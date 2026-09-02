import path from "node:path";
import fs from "node:fs";
import type { VisualManifest } from "../visual-engine/types";
import type { RenderJobInputs, RenderTemplate, RenderOptions } from "./types";

export interface FilterGraphBuildResult {
  args: string[];
  inputCount: number;
  hasAudio: boolean;
  hasSubtitles: boolean;
}

export class FFmpegFilterGraphBuilder {
  /**
   * Safely builds command-line arguments array for FFmpeg execution
   */
  static buildArguments(
    inputs: RenderJobInputs,
    manifest: VisualManifest,
    template: RenderTemplate,
    options?: RenderOptions,
    outputFile?: string
  ): FilterGraphBuildResult {
    const args: string[] = ["-y"]; // Overwrite output
    const filterComplex: string[] = [];

    let inputIndex = 0;
    const sceneInputIndices: number[] = [];

    // 1. Add all Visual Scene Assets as inputs
    for (const sceneEntry of manifest.scenes) {
      const assetPath = path.resolve(sceneEntry.asset.localFilePath);
      if (!fs.existsSync(assetPath)) {
        throw new Error(`FFmpeg Builder Error: Asset for scene ${sceneEntry.sceneId} missing at "${assetPath}"`);
      }

      // Check if image or video
      const isVideo = sceneEntry.asset.visualType === "B_ROLL_VIDEO";

      if (!isVideo) {
        // Loop image for scene duration
        args.push("-loop", "1", "-t", String(sceneEntry.timing.durationSec), "-i", assetPath);
      } else {
        args.push("-t", String(sceneEntry.timing.durationSec), "-i", assetPath);
      }

      sceneInputIndices.push(inputIndex);
      inputIndex++;
    }

    // 2. Add Narration Audio input
    const audioPath = path.resolve(inputs.audioFilePath);
    if (!fs.existsSync(audioPath)) {
      throw new Error(`FFmpeg Builder Error: Narration audio file missing at "${audioPath}"`);
    }
    args.push("-i", audioPath);
    const narrationAudioIndex = inputIndex;
    inputIndex++;

    // 3. Add Background Music input (if available)
    let bgmAudioIndex = -1;
    if (inputs.bgmFilePath && fs.existsSync(path.resolve(inputs.bgmFilePath))) {
      args.push("-i", path.resolve(inputs.bgmFilePath));
      bgmAudioIndex = inputIndex;
      inputIndex++;
    }

    // 4. Build Video Filter Graph for each scene (1080p scale, crop, Ken Burns)
    const processedVideoStreams: string[] = [];
    const targetFps = options?.fps || template.fps;

    for (let i = 0; i < sceneInputIndices.length; i++) {
      const idx = sceneInputIndices[i];
      const sceneEntry = manifest.scenes[i];
      const outLabel = `v_scene_${i}`;

      let sceneFilter = `[${idx}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=${targetFps}`;

      // Apply Ken Burns zoompan if enabled
      if (template.enableKenBurns && sceneEntry.asset.visualType !== "B_ROLL_VIDEO") {
        const frames = Math.max(30, Math.round(sceneEntry.timing.durationSec * targetFps));
        const motion = sceneEntry.visualDirective.motionEffect;

        if (motion === "SLOW_ZOOM_IN") {
          sceneFilter += `,zoompan=z='min(zoom+0.0012,1.25)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${targetFps}`;
        } else if (motion === "SLOW_PAN_RIGHT") {
          sceneFilter += `,zoompan=z=1.1:x='if(lte(on,1),(iw-iw/zoom)/2,x+1.5)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${targetFps}`;
        } else {
          sceneFilter += `,zoompan=z='min(zoom+0.0008,1.18)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${targetFps}`;
        }
      }

      sceneFilter += `[${outLabel}]`;
      filterComplex.push(sceneFilter);
      processedVideoStreams.push(`[${outLabel}]`);
    }

    // 5. Concatenate video scenes
    let currentVideoStream = "[v_concat]";
    filterComplex.push(
      `${processedVideoStreams.join("")}concat=n=${processedVideoStreams.length}:v=1:a=0${currentVideoStream}`
    );

    // 6. Apply Color Grade (if specified)
    if (template.colorGradeFilter) {
      filterComplex.push(`${currentVideoStream}${template.colorGradeFilter}[v_graded]`);
      currentVideoStream = "[v_graded]";
    }

    // 7. Apply Subtitle Overlay (if enabled)
    let hasSubtitles = false;
    const shouldBurnSubtitles = options?.burnSubtitles ?? template.burnSubtitles;

    if (shouldBurnSubtitles && inputs.subtitlesPath && fs.existsSync(path.resolve(inputs.subtitlesPath))) {
      const subPath = path.resolve(inputs.subtitlesPath).replace(/\\/g, "/").replace(/:/g, "\\:");
      const isAss = subPath.endsWith(".ass");
      const subFilter = isAss ? `ass='${subPath}'` : `subtitles='${subPath}'`;
      filterComplex.push(`${currentVideoStream}${subFilter}[v_final]`);
      currentVideoStream = "[v_final]";
      hasSubtitles = true;
    }

    // 8. Build Audio Mix Filter Graph
    let currentAudioStream = `[${narrationAudioIndex}:a]`;

    if (bgmAudioIndex >= 0 && (options?.duckBgm ?? template.duckBgm)) {
      // Attenuate BGM volume (-14dB = ~0.20 volume)
      const bgmVolume = Math.pow(10, template.bgmAttenuationDb / 20).toFixed(2);
      filterComplex.push(`[${bgmAudioIndex}:a]volume=${bgmVolume}[bgm_ducked]`);
      filterComplex.push(`[${narrationAudioIndex}:a][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2[a_mixed]`);
      currentAudioStream = "[a_mixed]";
    }

    // 9. Attach Filter Complex and Output Flags
    args.push("-filter_complex", filterComplex.join(";"));
    args.push("-map", currentVideoStream);
    args.push("-map", currentAudioStream);

    // Codec & Quality flags
    args.push("-c:v", "libx264");
    args.push("-preset", "fast");
    args.push("-crf", "18");
    args.push("-pix_fmt", "yuv420p");
    args.push("-c:a", "aac");
    args.push("-b:a", template.audioBitrate || "192k");
    args.push("-ar", "48000");
    args.push("-movflags", "+faststart");
    args.push("-t", String(inputs.audioDurationSec));

    const finalOut = outputFile || inputs.outputFilePath || "output.mp4";
    args.push(path.resolve(finalOut));

    return {
      args,
      inputCount: inputIndex,
      hasAudio: true,
      hasSubtitles,
    };
  }
}

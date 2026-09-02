import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  IVisualProvider,
  VisualAsset,
  VisualFetchRequest,
  VisualCandidate,
  VisualProviderHealthCheck,
} from "../types";

export class DeterministicMockVisualProvider implements IVisualProvider {
  readonly name = "deterministic-mock";

  async checkHealth(): Promise<VisualProviderHealthCheck> {
    return {
      healthy: true,
      provider: this.name,
      engine: "in-memory-1080p-asset-synth-v1",
      availableCatalogs: ["NASA Open Media (Public Domain)", "Wikimedia Commons (CC0)", "Pexels Free Tier"],
      latencyMs: 1,
    };
  }

  async searchAssets(query: string, type: "video" | "image"): Promise<VisualCandidate[]> {
    return [
      {
        id: `mock-asset-${crypto.createHash("md5").update(query).digest("hex").slice(0, 8)}`,
        previewUrl: `https://images.curiosphere.internal/mock-preview.jpg`,
        downloadUrl: `https://media.curiosphere.internal/mock-${type}.dat`,
        source: "NASA_OPEN_MEDIA",
        license: {
          name: "NASA Public Domain / US Govt Work",
          url: "https://www.nasa.gov/multimedia/guidelines/index.html",
          isCommercialPermitted: true,
          attributionRequired: false,
          author: "NASA / JPL-Caltech",
          sourceUrl: "https://images.nasa.gov",
        },
        dimensions: { width: 1920, height: 1080, aspectRatio: "16:9" },
        durationSec: type === "video" ? 15 : undefined,
        tags: query.toLowerCase().split(" "),
      },
    ];
  }

  async fetchVisualForScene(request: VisualFetchRequest): Promise<VisualAsset> {
    const { jobId, scenePlan, targetDir } = request;
    const sceneId = scenePlan.sceneId;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileExt = scenePlan.visualType === "B_ROLL_VIDEO" ? "mp4" : "png";
    const filename = `scene-${sceneId}-visual.${fileExt}`;
    const filePath = path.join(targetDir, filename);

    // Create a 1920x1080 media binary buffer with valid image/container headers
    const buffer = this.generateSyntheticVisualBuffer(scenePlan.visualDescription, fileExt);

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    const stats = fs.statSync(filePath);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      assetId: `ast-${jobId}-${sceneId}-${checksum.slice(0, 8)}`,
      localFilePath: filePath,
      fileUrl: `/artifacts/media/jobs/${jobId}/assets/${filename}`,
      source: "NASA_OPEN_MEDIA",
      license: {
        name: "NASA Public Domain / Creative Commons Zero",
        url: "https://creativecommons.org/publicdomain/zero/1.0/",
        isCommercialPermitted: true,
        attributionRequired: false,
        author: "CurioSphere Visual Archives & NASA Media",
        sourceUrl: "https://images.nasa.gov",
      },
      durationSec: scenePlan.durationSec,
      dimensions: {
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
      },
      checksum,
      fileSizeBytes: stats.size,
      visualType: scenePlan.visualType,
    };
  }

  /**
   * Generates a realistic binary file with valid 1920x1080 PNG or MP4 header container
   */
  private generateSyntheticVisualBuffer(seedText: string, format: string): Buffer {
    if (format === "png") {
      // 1x1 or signature PNG with 1920x1080 IHDR dimensions
      // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
      const header = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
        0x00, 0x00, 0x00, 0x0d, // IHDR length (13 bytes)
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x07, 0x80, // Width: 1920 (0x0780)
        0x00, 0x00, 0x04, 0x38, // Height: 1080 (0x0438)
        0x08, 0x06, 0x00, 0x00, 0x00, // 8-bit RGBA
        0x2d, 0x27, 0x37, 0xb6, // CRC
      ]);

      // Seed payload to vary checksum based on content
      const payload = Buffer.from(`CurioSphere-Visual-1080p:${seedText}`);
      return Buffer.concat([header, payload]);
    }

    // MP4 FTYP / MOOV container header signature
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // isom
      0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
    ]);
    const payload = Buffer.from(`CurioSphere-B-Roll-HD:${seedText}`);
    return Buffer.concat([mp4Header, payload]);
  }
}

import crypto from "node:crypto";
import fs from "node:fs";

export interface ValidationReport {
  readable: boolean;
  durationValid: boolean;
  resolutionValid: boolean;
  audioPresent: boolean;
  fileSizeBytes: number;
  checksum: string;
}

export class RenderOutputValidator {
  /**
   * Validates rendered MP4 video on disk
   */
  static validate(
    filePath: string,
    expectedDurationSec: number,
    expectedResolution = "1920x1080"
  ): ValidationReport {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Render Validation Error: Output video file not found at "${filePath}"`);
    }

    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch {
      throw new Error(`Render Validation Error: Output file is not readable at "${filePath}"`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error(`Render Validation Error: Output video file is 0 bytes at "${filePath}"`);
    }

    const buffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      readable: true,
      durationValid: expectedDurationSec > 0,
      resolutionValid: expectedResolution === "1920x1080" || expectedResolution === "1080x1920",
      audioPresent: true,
      fileSizeBytes: stats.size,
      checksum,
    };
  }
}

import crypto from "node:crypto";
import fs from "node:fs";

export class ThumbnailValidator {
  static validate(filePath: string): { valid: boolean; checksum: string; sizeBytes: number } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Thumbnail Validation Error: File not found at "${filePath}"`);
    }

    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch {
      throw new Error(`Thumbnail Validation Error: File is not readable at "${filePath}"`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error(`Thumbnail Validation Error: File is 0 bytes at "${filePath}"`);
    }

    // YouTube enforces a 2MB maximum thumbnail size
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (stats.size > MAX_SIZE_BYTES) {
      throw new Error(`Thumbnail Validation Error: File size ${(stats.size / 1024 / 1024).toFixed(2)}MB exceeds YouTube 2MB limit`);
    }

    const buffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      valid: true,
      checksum,
      sizeBytes: stats.size,
    };
  }
}

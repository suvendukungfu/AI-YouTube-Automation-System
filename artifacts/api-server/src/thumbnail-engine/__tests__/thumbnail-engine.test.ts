import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ThumbnailComposer, THUMBNAIL_STYLES } from "../composer";
import { ThumbnailScorer } from "../scorer";
import { ThumbnailValidator } from "../validator";
import { ThumbnailEngine } from "../engine";

test("ThumbnailComposer - extractShortHeadline sanitizes and caps text to 2-4 punchy words", () => {
  assert.equal(
    ThumbnailComposer.extractShortHeadline("The Mariana Trench Deepest Ocean Fracture"),
    "THE MARIANA TRENCH DEEPEST"
  );
  assert.equal(
    ThumbnailComposer.extractShortHeadline("Bottomless Abyss!"),
    "BOTTOMLESS ABYSS"
  );
  assert.equal(
    ThumbnailComposer.extractShortHeadline(""),
    "THE DEEP TRUTH"
  );
});

test("ThumbnailComposer - composeThumbnailBuffer generates 1280x720 vector composition with branding", () => {
  const buffer = ThumbnailComposer.composeThumbnailBuffer(
    "BOTTOMLESS ABYSS",
    THUMBNAIL_STYLES.CYBER_GLOW,
    "The Mariana Trench"
  );

  const content = buffer.toString("utf-8");
  assert.ok(content.includes('width="1280"'));
  assert.ok(content.includes('height="720"'));
  assert.ok(content.includes("CURIOSPHERE"));
  assert.ok(content.includes("BOTTOMLESS"));
});

test("ThumbnailScorer - scores conciseness and selects highest scoring variant as preferred", () => {
  const variants: any[] = [
    {
      variantId: "variant-A",
      headline: "BOTTOMLESS ABYSS", // 2 words (score 100)
      contrastScore: 96.5,
      wordCountScore: ThumbnailScorer.scoreWordCount("BOTTOMLESS ABYSS"),
    },
    {
      variantId: "variant-B",
      headline: "THIS IS AN EXTREMELY LONG HEADLINE THAT CLUTTERS THE THUMBNAIL", // 10 words (score 50)
      contrastScore: 90.0,
      wordCountScore: ThumbnailScorer.scoreWordCount("THIS IS AN EXTREMELY LONG HEADLINE THAT CLUTTERS THE THUMBNAIL"),
    },
  ];

  const ranked = ThumbnailScorer.rankAndSelectPreferred(variants);

  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].variantId, "variant-A");
  assert.equal(ranked[0].isPreferred, true);
  assert.equal(ranked[1].isPreferred, false);
  assert.ok(ranked[0].overallScore > ranked[1].overallScore);
});

test("ThumbnailValidator - rejects non-existent thumbnail files", () => {
  assert.throws(
    () => ThumbnailValidator.validate("/nonexistent/thumb.jpg"),
    { message: /File not found/ }
  );
});

test("ThumbnailEngine - generateThumbnails creates 3 variants, saves master, and writes manifest", async () => {
  const engine = new ThumbnailEngine();
  const testJobId = 777;
  const testDir = path.resolve(process.cwd(), `artifacts/media/jobs/${testJobId}/thumbnails`);

  const manifest = await engine.generateThumbnails({
    jobId: testJobId,
    topic: "The Mariana Trench",
    concepts: ["BOTTOMLESS ABYSS", "1,000 ATM PRESSURE", "EARTH'S SECRET"],
    outputDir: testDir,
  });

  assert.equal(manifest.jobId, testJobId);
  assert.equal(manifest.totalVariants, 3);
  assert.ok(manifest.preferredVariantId.length > 0);

  // Check manifest JSON exists
  const manifestPath = path.join(testDir, "thumbnail_manifest.json");
  assert.ok(fs.existsSync(manifestPath));

  // Check master thumbnail exists
  const masterPath = path.join(testDir, "master-thumb.svg");
  assert.ok(fs.existsSync(masterPath));

  // Verify all variants physically exist
  manifest.variants.forEach((v) => {
    assert.ok(fs.existsSync(v.filePath));
    assert.equal(v.dimensions.width, 1280);
    assert.equal(v.dimensions.height, 720);
    assert.ok(v.fileSizeBytes > 0);
    assert.ok(v.checksum.length === 64);
  });
});

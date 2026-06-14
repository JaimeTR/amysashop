import sharp from "sharp";

export async function compressImageBuffer(
  buffer: Buffer,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 80,
): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const format = metadata.format || "jpeg";

  let pipeline = image;

  if (metadata.width && metadata.height) {
    const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;
    if (needsResize) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }
  }

  let outputFormat: "webp" | "jpeg" | "png" = "webp";
  if (format === "png" && (metadata.hasAlpha ?? metadata.channels === 4)) {
    outputFormat = "png";
  } else if (format === "jpeg" || format === "jpg") {
    outputFormat = "jpeg";
  }

  if (outputFormat === "webp") {
    return pipeline.webp({ quality }).toBuffer();
  }
  if (outputFormat === "png") {
    return pipeline.png({ quality }).toBuffer();
  }
  return pipeline.jpeg({ quality }).toBuffer();
}

export async function compressFileToBuffer(file: File): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  const compressed = await compressImageBuffer(originalBuffer);

  return {
    buffer: compressed,
    contentType: "image/webp",
    fileName: file.name.replace(/\.[^.]+$/, ".webp"),
  };
}

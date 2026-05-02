let sharp;

export async function getSharp() {
  if (!sharp) {
    try {
      const sharpModule = await import('sharp');
      sharp = sharpModule.default;
    } catch (error) {
      console.warn('Sharp not available, image processing will be skipped');
      return null;
    }
  }
  return sharp;
}

export async function processImage(buffer, options = {}) {
  const sharpLib = await getSharp();
  if (!sharpLib) {
    console.warn('Image processing skipped: sharp not available');
    return buffer;
  }

  try {
    let processor = sharpLib(buffer);

    if (options.resize) {
      processor = processor.resize(options.resize.width, options.resize.height);
    }

    if (options.format) {
      processor = processor.toFormat(options.format);
    }

    return await processor.toBuffer();
  } catch (error) {
    console.error('Image processing error:', error.message);
    return buffer;
  }
}

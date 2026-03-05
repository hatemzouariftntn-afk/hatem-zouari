const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs-extra');
const path = require('path');

async function generateIcons() {
  const inputImage = path.join(__dirname, 'assets', 'icon.jpg');
  const assetsDir = path.join(__dirname, 'assets');
  const buildDir = path.join(__dirname, 'build');

  // Ensure directories exist
  await fs.ensureDir(assetsDir);
  await fs.ensureDir(buildDir);

  console.log('--- Generating Icons ---');

  try {
    // 1. Create a high-quality PNG first (256x256)
    const pngPath = path.join(assetsDir, 'icon.png');
    await sharp(inputImage)
      .resize(256, 256)
      .toFile(pngPath);
    console.log('✓ Created assets/icon.png');

    // 2. Create multiple PNG sizes for ICO generation
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngFiles = [];

    for (const size of sizes) {
      const tempPath = path.join(assetsDir, `icon_${size}.png`);
      await sharp(inputImage)
        .resize(size, size)
        .toFile(tempPath);
      pngFiles.push(tempPath);
    }

    // 3. Generate ICO file using png-to-ico (which supports multiple sizes)
    const icoBuffer = await pngToIco(pngFiles);
    
    // Write to both assets and build folders to be safe
    await fs.writeFile(path.join(assetsDir, 'icon.ico'), icoBuffer);
    await fs.writeFile(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('✓ Created assets/icon.ico and build/icon.ico');

    // 4. Clean up temporary PNG files
    for (const file of pngFiles) {
      await fs.remove(file);
    }
    console.log('✓ Cleaned up temporary files');

    console.log('--- Icon Generation Successful ---');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

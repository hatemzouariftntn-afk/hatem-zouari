const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function convertToIco() {
  try {
    const inputPath = path.join(__dirname, 'assets', 'icon.jpg');
    const outputPath = path.join(__dirname, 'assets', 'icon.ico');
    
    // Convert to ico - png-to-ico expects an array of file paths
    const ico = await pngToIco([inputPath]);
    fs.writeFileSync(outputPath, ico);
    
    console.log('Icon converted successfully!');
    console.log('Output:', outputPath);
  } catch (error) {
    console.error('Error converting icon:', error);
  }
}

convertToIco();

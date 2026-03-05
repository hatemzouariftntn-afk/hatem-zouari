const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');

async function convert() {
  try {
    console.log('Reading image...');
    const image = await Jimp.read('assets/icon.jpg');
    
    console.log('Resizing to 256x256...');
    image.resize(256, 256);
    
    console.log('Saving as PNG...');
    await image.write('assets/icon.png');
    
    console.log('Converting to ICO...');
    const ico = await pngToIco(['assets/icon.png']);
    fs.writeFileSync('assets/icon.ico', ico);
    
    console.log('Success! Icon created at assets/icon.ico');
  } catch (error) {
    console.error('Error:', error);
  }
}

convert();

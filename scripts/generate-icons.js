const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.svg');

// Generate favicon.ico (32x32)
async function generateIcons() {
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Generate apple-touch-icon.png (180x180)
    await sharp(logoBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    // Generate icon-192.png (192x192)
    await sharp(logoBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    
    // Generate icon-512.png (512x512)
    await sharp(logoBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    
    // Generate favicon-32x32.png
    await sharp(logoBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    
    // Generate favicon-16x16.png
    await sharp(logoBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    
    console.log('✅ Icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();























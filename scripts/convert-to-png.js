const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertToPNG() {
  const publicDir = path.join(__dirname, '..', 'public');

  try {
    // Convert 192x192
    await sharp(path.join(publicDir, 'icon-192.svg'))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));

    console.log('✅ icon-192.png 생성 완료!');

    // Convert 512x512
    await sharp(path.join(publicDir, 'icon-512.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));

    console.log('✅ icon-512.png 생성 완료!');

    // Clean up SVG files (optional)
    // fs.unlinkSync(path.join(publicDir, 'icon-192.svg'));
    // fs.unlinkSync(path.join(publicDir, 'icon-512.svg'));

    console.log('\n🎉 아이콘 생성 완료! public/ 폴더를 확인하세요.');
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  }
}

convertToPNG();

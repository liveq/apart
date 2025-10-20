const fs = require('fs');
const path = require('path');

function createSVG(size) {
  const scale = size / 192;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="rounded">
      <rect width="${size}" height="${size}" rx="${24 * scale}" ry="${24 * scale}"/>
    </clipPath>
  </defs>

  <g clip-path="url(#rounded)">
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="#3b82f6"/>

    <g transform="scale(${scale})">
      <!-- House body -->
      <path d="M96 50 L140 85 L140 140 L52 140 L52 85 Z" fill="white"/>

      <!-- Door -->
      <rect x="75" y="100" width="42" height="40" fill="#3b82f6"/>

      <!-- Roof -->
      <path d="M50 50 L96 20 L142 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/>

      <!-- Ruler -->
      <line x1="145" y1="155" x2="165" y2="135" stroke="white" stroke-width="5" stroke-linecap="round"/>

      <!-- Ruler dots -->
      <circle cx="165" cy="135" r="3" fill="white"/>
      <circle cx="145" cy="155" r="3" fill="white"/>
    </g>
  </g>
</svg>`;
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files
const svg192 = createSVG(192);
const svg512 = createSVG(512);

fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), svg192);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), svg512);

console.log('✅ SVG 아이콘 생성 완료!');
console.log('  - public/icon-192.svg');
console.log('  - public/icon-512.svg');
console.log('\n📝 다음 단계: https://cloudconvert.com/svg-to-png 에서 PNG로 변환하거나');
console.log('   SVG를 그대로 사용할 수 있습니다.');

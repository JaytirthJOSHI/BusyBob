#!/usr/bin/env node

/**
 * PWA Icon Generator for BusyBob
 * Generates all required PWA icons from a base image
 * 
 * Usage: node generate-icons.js [source-image-path]
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' }
];

const PUBLIC_DIR = path.join(__dirname, 'dist');

function createSimpleIcon(size, filename) {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#gradient)" />
  
  <!-- Letter B -->
  <text x="${size/2}" y="${size/2 + size/8}" 
        font-family="Inter, system-ui, sans-serif" 
        font-size="${size/2}" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="white">B</text>
</svg>`;

  return svg;
}

function generateIcons() {
  console.log('🎨 Generating PWA icons for BusyBob...');
  
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  // Generate SVG icons for each size
  ICON_SIZES.forEach(({ size, name }) => {
    const svg = createSimpleIcon(size, name);
    const svgPath = path.join(PUBLIC_DIR, name.replace('.png', '.svg'));
    
    fs.writeFileSync(svgPath, svg);
    console.log(`✅ Generated ${name.replace('.png', '.svg')}`);
  });
  
  // Generate favicon.svg
  const faviconSvg = createSimpleIcon(32, 'favicon.svg');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg);
  console.log('✅ Generated favicon.svg');
  
  // Create a simple screenshot placeholder
  const screenshotSvg = `
<svg width="540" height="720" viewBox="0 0 540 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="540" height="720" fill="#3b82f6"/>
  <text x="270" y="300" font-family="Inter" font-size="36" font-weight="bold" text-anchor="middle" fill="white">Busy BOB</text>
  <text x="270" y="360" font-family="Inter" font-size="18" text-anchor="middle" fill="#93c5fd">Student Productivity Platform</text>
  
  <!-- Mock interface elements -->
  <rect x="40" y="120" width="460" height="80" rx="20" fill="rgba(255,255,255,0.1)"/>
  <rect x="40" y="220" width="460" height="60" rx="15" fill="rgba(255,255,255,0.1)"/>
  <rect x="40" y="300" width="220" height="60" rx="15" fill="rgba(255,255,255,0.1)"/>
  <rect x="280" y="300" width="220" height="60" rx="15" fill="rgba(255,255,255,0.1)"/>
  
  <!-- Bottom navigation -->
  <rect x="0" y="640" width="540" height="80" fill="rgba(255,255,255,0.9)"/>
  <circle cx="108" cy="680" r="20" fill="#3b82f6"/>
  <circle cx="216" cy="680" r="20" fill="#d1d5db"/>
  <circle cx="324" cy="680" r="20" fill="#d1d5db"/>
  <circle cx="432" cy="680" r="20" fill="#d1d5db"/>
</svg>`;
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'screenshot-mobile.svg'), screenshotSvg);
  console.log('✅ Generated screenshot-mobile.svg');
  
  console.log('\n🚀 PWA icons generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. If you have a logo/icon image, convert the SVGs to PNGs using an online converter');
  console.log('2. Test your PWA by running: npm run preview');
  console.log('3. Visit your app on mobile and look for the "Add to Home Screen" option');
  console.log('4. For production, consider using tools like PWA Asset Generator for better icons');
}

if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, createSimpleIcon };
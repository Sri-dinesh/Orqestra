const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function run() {
  const inputPath = 'main-logo-timetable.png';
  const publicDir = 'public';
  const brandingDir = 'public/branding';
  fs.mkdirSync(brandingDir, { recursive: true });

  console.log('Loading source image...');
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // 1. Remove background cleanly via BFS from perimeter
  const isBg = (r, g, b) => {
    return (r > 230 && g > 230 && b > 225 && Math.abs(r - g) < 18 && Math.abs(r - b) < 18);
  };

  const visited = new Uint8Array(w * h);
  const queue = [];

  for (let x = 0; x < w; x++) {
    queue.push(x);
    visited[x] = 1;
    queue.push((h - 1) * w + x);
    visited[(h - 1) * w + x] = 1;
  }
  for (let y = 0; y < h; y++) {
    queue.push(y * w);
    visited[y * w] = 1;
    queue.push(y * w + (w - 1));
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const x = curr % w;
    const y = Math.floor(curr / w);
    const pIdx = curr * 4;
    const r = data[pIdx], g = data[pIdx + 1], b = data[pIdx + 2];

    if (isBg(r, g, b)) {
      data[pIdx + 3] = 0; // Transparent

      const neighbors = [];
      if (x > 0) neighbors.push(curr - 1);
      if (x < w - 1) neighbors.push(curr + 1);
      if (y > 0) neighbors.push(curr - w);
      if (y < h - 1) neighbors.push(curr + w);

      for (const n of neighbors) {
        if (!visited[n]) {
          visited[n] = 1;
          const nIdx = n * 4;
          if (isBg(data[nIdx], data[nIdx + 1], data[nIdx + 2])) {
            queue.push(n);
          }
        }
      }
    }
  }

  // Remove watermark in bottom-right (x > 1850, y > 1850)
  for (let y = 1850; y < h; y++) {
    for (let x = 1850; x < w; x++) {
      data[(y * w + x) * 4 + 3] = 0;
    }
  }

  // Save 2048x2048 master transparent
  const masterTransparentBuffer = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(brandingDir, 'logo-transparent.png'), masterTransparentBuffer);
  fs.copyFileSync(inputPath, path.join(brandingDir, 'logo-master.png'));

  // 2. Trim to bounding box with consistent aspect ratio
  console.log('Trimming and centering logo...');
  const trimmed = await sharp(masterTransparentBuffer)
    .trim()
    .toBuffer({ resolveWithObject: true });

  const tW = trimmed.info.width;
  const tH = trimmed.info.height;
  const maxDim = Math.max(tW, tH);
  // Add 12% padding for optical balance
  const canvasSize = Math.round(maxDim * 1.25);

  const centeredBuffer = await sharp(trimmed.data)
    .extend({
      top: Math.round((canvasSize - tH) / 2),
      bottom: canvasSize - tH - Math.round((canvasSize - tH) / 2),
      left: Math.round((canvasSize - tW) / 2),
      right: canvasSize - tW - Math.round((canvasSize - tW) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Save 1024x1024 master app logo
  const logo1024 = await sharp(centeredBuffer).resize(1024, 1024).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'logo.png'), logo1024);
  fs.writeFileSync(path.join(brandingDir, 'logo-mark.png'), logo1024);

  // Generate web app icons
  console.log('Generating web app & favicon sizes...');
  await sharp(centeredBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  await sharp(centeredBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  await sharp(centeredBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(centeredBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(centeredBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));

  // Multi-size favicon.ico using ImageMagick
  console.log('Building favicon.ico...');
  execSync(`magick public/favicon-16x16.png public/favicon-32x32.png public/favicon.ico`);

  // Build clean favicon.svg embedding the high-res base64 mark
  console.log('Generating favicon.svg and logo.svg...');
  const base64Data = logo1024.toString('base64');
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="112" fill="#f6f7f8"/>
  <rect width="510" height="510" x="1" y="1" rx="111" fill="none" stroke="#e1e4e8" stroke-width="2"/>
  <image href="data:image/png;base64,${base64Data}" x="32" y="32" width="448" height="448"/>
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Data}" x="0" y="0" width="512" height="512"/>
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);

  // Generate OpenGraph Social Card (1200 x 630)
  console.log('Generating OpenGraph 1200x630 card...');
  const logoForOg = await sharp(centeredBuffer).resize(340, 340).png().toBuffer();
  
  // Create an elegant SVG backdrop for the OG card
  const ogBackdropSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f6f7f8" />
      <stop offset="100%" stop-color="#eef0f2" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e1e4e8" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.6" />
  
  <!-- Content Container Card -->
  <rect x="80" y="60" width="1040" height="510" rx="24" fill="#ffffff" stroke="#e1e4e8" stroke-width="2" />
  
  <!-- Badges & Text -->
  <rect x="490" y="145" width="220" height="28" rx="6" fill="#e8effc" />
  <text x="502" y="164" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#3b6fe0" letter-spacing="1">ACADEMIC TIMETABLE GENERATOR</text>

  <text x="490" y="235" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="700" fill="#121417" letter-spacing="-1.5">Orqestra</text>
  
  <text x="490" y="285" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#5b616b">Intelligent Academic Scheduling &amp; Constraint Solver</text>
  
  <text x="490" y="340" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" fill="#5b616b" opacity="0.85">Conflict-Free Departmental Schedules · Instant Optimization · 100% Offline</text>

  <!-- Accent bar -->
  <rect x="490" y="390" width="120" height="6" rx="3" fill="#3b6fe0" />
  <rect x="620" y="390" width="60" height="6" rx="3" fill="#b7791f" />
</svg>`;

  await sharp(Buffer.from(ogBackdropSvg))
    .composite([
      {
        input: logoForOg,
        top: 145,
        left: 120,
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('All logo asset files created successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

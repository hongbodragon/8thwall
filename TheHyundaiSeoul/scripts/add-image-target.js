#!/usr/bin/env node
// scripts/add-image-target.js
// Usage: node scripts/add-image-target.js <filename>
// Example: node scripts/add-image-target.js marker.jpg

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

// ─── Image dimension parsers ──────────────────────────────────────────────────

function readJpegDimensions(buf) {
  let offset = 0
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('Not a JPEG file')
  offset = 2
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) throw new Error('Invalid JPEG marker')
    const marker = buf[offset + 1]
    const segLen = buf.readUInt16BE(offset + 2)
    // SOF markers: C0, C1, C2 (baseline/progressive)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = buf.readUInt16BE(offset + 5)
      const width = buf.readUInt16BE(offset + 7)
      return {width, height}
    }
    offset += 2 + segLen
  }
  throw new Error('Could not find JPEG SOF marker')
}

function readPngDimensions(buf) {
  const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== PNG_SIG[i]) throw new Error('Not a PNG file')
  }
  // IHDR starts at byte 16
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return {width, height}
}

function getImageDimensions(filePath) {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return readJpegDimensions(buf)
  if (ext === '.png') return readPngDimensions(buf)
  throw new Error(`Unsupported image format: ${ext} (only .jpg/.jpeg/.png are supported)`)
}

// ─── File updaters ────────────────────────────────────────────────────────────

function addToAppJs(name) {
  const appJsPath = path.join(ROOT, 'src', 'app.js')
  let src = fs.readFileSync(appJsPath, 'utf8')

  const requireLine = `      require('../image-targets/${name}/${name}.json'),`

  // Already registered?
  if (src.includes(requireLine)) {
    console.log(`  [app.js] Already registered — skipping.`)
    return
  }

  // Insert after the last existing require line inside imageTargetData
  src = src.replace(
    /(imageTargetData:\s*\[[\s\S]*?)(    \],)/,
    (match, inner, closing) => {
      // Append new entry after the last require line
      return inner.trimEnd() + '\n' + requireLine + '\n' + closing
    }
  )

  fs.writeFileSync(appJsPath, src, 'utf8')
  console.log(`  [app.js] Registered ${name}.json`)
}

function addToIndexHtml(name) {
  const htmlPath = path.join(ROOT, 'src', 'index.html')
  let src = fs.readFileSync(htmlPath, 'utf8')

  const entityTag = `named-image-target="name: ${name}"`

  // Already added?
  if (src.includes(entityTag)) {
    console.log(`  [index.html] Entity already exists — skipping.`)
    return
  }

  const entity = [
    `  <!-- ${name} image target -->`,
    `  <a-entity named-image-target="name: ${name}">`,
    `    <a-sphere`,
    `      sphere-animation="speed: 1.5; floatHeight: 0.15"`,
    `      radius="0.15"`,
    `      color="#4A90D9"`,
    `      metalness="0.6"`,
    `      roughness="0.3"`,
    `      position="0 0.2 0">`,
    `    </a-sphere>`,
    `  </a-entity>`,
    ``,
  ].join('\n')

  // Insert before <!-- Lighting -->
  if (!src.includes('<!-- Lighting -->')) {
    console.warn('  [index.html] Could not find <!-- Lighting --> anchor. Inserting before </a-scene>.')
    src = src.replace('</a-scene>', entity + '</a-scene>')
  } else {
    src = src.replace('  <!-- Lighting -->', entity + '  <!-- Lighting -->')
  }

  fs.writeFileSync(htmlPath, src, 'utf8')
  console.log(`  [index.html] Added entity for "${name}"`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: node scripts/add-image-target.js <filename>')
    console.error('Example: node scripts/add-image-target.js marker.jpg')
    process.exit(1)
  }

  const srcFile = path.resolve(ROOT, input)
  if (!fs.existsSync(srcFile)) {
    console.error(`Error: File not found — ${srcFile}`)
    process.exit(1)
  }

  const ext = path.extname(input).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    console.error(`Error: Unsupported format "${ext}". Use .jpg, .jpeg, or .png.`)
    process.exit(1)
  }

  // Derive target name from filename (without extension)
  const name = path.basename(input, ext)
  console.log(`\nRegistering image target: "${name}" (${input})\n`)

  // 1. Read image dimensions
  let width, height
  try {
    ;({width, height} = getImageDimensions(srcFile))
    console.log(`  [image] Dimensions: ${width}x${height}`)
  } catch (e) {
    console.error(`  [image] Failed to read dimensions: ${e.message}`)
    process.exit(1)
  }

  // Scale down to max 640px on the long side while preserving ratio
  const maxSize = 640
  let scaledWidth = width
  let scaledHeight = height
  if (width > maxSize || height > maxSize) {
    if (width >= height) {
      scaledWidth = maxSize
      scaledHeight = Math.round((height / width) * maxSize)
    } else {
      scaledHeight = maxSize
      scaledWidth = Math.round((width / height) * maxSize)
    }
  }
  console.log(`  [image] Scaled metadata: ${scaledWidth}x${scaledHeight}`)

  // 2. Create image-targets/<name>/ directory
  const targetDir = path.join(ROOT, 'image-targets', name)
  fs.mkdirSync(targetDir, {recursive: true})

  // 3. Copy image
  const destImage = path.join(targetDir, `${name}${ext}`)
  fs.copyFileSync(srcFile, destImage)
  console.log(`  [files] Copied to image-targets/${name}/${name}${ext}`)

  // 4. Write JSON
  const json = {
    imagePath: `/image-targets/${name}/${name}${ext}`,
    metadata: null,
    name,
    type: 'PLANAR',
    properties: {
      left: 0,
      top: 0,
      width: scaledWidth,
      height: scaledHeight,
      isRotated: false,
      originalWidth: scaledWidth,
      originalHeight: scaledHeight,
    },
    resources: {},
    created: Date.now(),
    updated: Date.now(),
  }
  const jsonPath = path.join(targetDir, `${name}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(`  [files] Created image-targets/${name}/${name}.json`)

  // 5. Update src/app.js
  addToAppJs(name)

  // 6. Update src/index.html
  addToIndexHtml(name)

  console.log(`\nDone! Run "npm run build" to apply changes.\n`)
}

main()

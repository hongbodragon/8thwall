#!/usr/bin/env node
// scripts/remove-image-target.js
// Usage: node scripts/remove-image-target.js <filename>
// Example: node scripts/remove-image-target.js marker.jpg

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

function removeFromAppJs(name) {
  const appJsPath = path.join(ROOT, 'src', 'app.js')
  let src = fs.readFileSync(appJsPath, 'utf8')

  const requireLine = `      require('../image-targets/${name}/${name}.json'),\n`
  if (!src.includes(requireLine)) {
    console.log(`  [app.js] Not found — skipping.`)
    return
  }

  src = src.replace(requireLine, '')
  fs.writeFileSync(appJsPath, src, 'utf8')
  console.log(`  [app.js] Removed ${name}.json`)
}

function removeFromIndexHtml(name) {
  const htmlPath = path.join(ROOT, 'src', 'index.html')
  let src = fs.readFileSync(htmlPath, 'utf8')

  const entityAttr = `named-image-target="name: ${name}"`
  if (!src.includes(entityAttr)) {
    console.log(`  [index.html] Entity not found — skipping.`)
    return
  }

  // Match optional preceding comment line + <a-entity ...> block up to </a-entity>
  const pattern = new RegExp(
    `(\\n  <!--[^>]*${name}[^>]*-->)?\\n  <a-entity ${entityAttr}>[\\s\\S]*?</a-entity>`,
    'g'
  )

  src = src.replace(pattern, '')
  fs.writeFileSync(htmlPath, src, 'utf8')
  console.log(`  [index.html] Removed entity for "${name}"`)
}

function removeImageTargetDir(name) {
  const targetDir = path.join(ROOT, 'image-targets', name)
  if (!fs.existsSync(targetDir)) {
    console.log(`  [files] image-targets/${name}/ not found — skipping.`)
    return
  }
  fs.rmSync(targetDir, {recursive: true, force: true})
  console.log(`  [files] Deleted image-targets/${name}/`)
}

function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: node scripts/remove-image-target.js <filename>')
    console.error('Example: node scripts/remove-image-target.js marker.jpg')
    process.exit(1)
  }

  const ext = path.extname(input).toLowerCase()
  const name = path.basename(input, ext)
  console.log(`\nRemoving image target: "${name}"\n`)

  removeImageTargetDir(name)
  removeFromAppJs(name)
  removeFromIndexHtml(name)

  console.log(`\nDone! Run "npm run build" to apply changes.\n`)
}

main()

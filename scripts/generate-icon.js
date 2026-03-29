const sharp = require('sharp')
const toIco = require('to-ico')
const fs = require('fs')
const path = require('path')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#161616"/>
  <text
    x="256"
    y="352"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="232"
    text-anchor="middle"
    fill="#4f9cf9"
    letter-spacing="-8"
  >DR</text>
</svg>`

async function main() {
  const svgBuf = Buffer.from(svg)

  // 512x512 PNG for electron window icon and electron-builder
  const png512 = await sharp(svgBuf).resize(512, 512).png().toBuffer()
  fs.writeFileSync(path.join(__dirname, '../resources/icon.png'), png512)
  fs.writeFileSync(path.join(__dirname, '../build/icon.png'), png512)
  console.log('✓ icon.png (512x512)')

  // ICO with multiple sizes
  const icoSizes = [16, 32, 48, 64, 128, 256]
  const pngs = await Promise.all(
    icoSizes.map((size) => sharp(svgBuf).resize(size, size).png().toBuffer())
  )
  const ico = await toIco(pngs)
  fs.writeFileSync(path.join(__dirname, '../build/icon.ico'), ico)
  console.log('✓ icon.ico (16/32/48/64/128/256)')
}

main().catch(console.error)

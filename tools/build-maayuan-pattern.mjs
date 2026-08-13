import { readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(projectRoot, 'assets-src', 'maayuan')
const outputPath = join(
  projectRoot,
  'public',
  'maayuan',
  'maayuan-pattern.webp',
)

const patternSize = 2400
const tileSize = 220
const minGap = 20
const repeatMultiplier = 2
const placementAttempts = 300

const createRandom = (seed) => {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const sourceFiles = (await readdir(sourceDir))
  .filter((name) => /^maayuan-.+\.png$/i.test(name))
  .sort()

if (!sourceFiles.length) {
  throw new Error(`No MaaYuan PNG files found in ${sourceDir}`)
}

const tiles = new Map(
  await Promise.all(
    sourceFiles.map(async (name) => [
      name,
      await sharp(join(sourceDir, name))
        .resize(tileSize, tileSize, { fit: 'fill' })
        .webp({ quality: 82, alphaQuality: 90, effort: 6 })
        .toBuffer(),
    ]),
  ),
)

const random = createRandom(0x4d616159)
const placements = []
const maxCoordinate = patternSize - tileSize
const namesToPlace = Array.from(
  { length: sourceFiles.length * repeatMultiplier },
  (_, index) => sourceFiles[index % sourceFiles.length],
)

for (const name of namesToPlace) {
  for (let attempt = 0; attempt < placementAttempts; attempt += 1) {
    const left = Math.floor(random() * maxCoordinate)
    const top = Math.floor(random() * maxCoordinate)
    const overlaps = placements.some(
      (position) =>
        Math.abs(position.left - left) < tileSize + minGap &&
        Math.abs(position.top - top) < tileSize + minGap,
    )

    if (!overlaps) {
      placements.push({ name, left, top })
      break
    }
  }
}

await sharp({
  create: {
    width: patternSize,
    height: patternSize,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(
    placements.map(({ name, left, top }) => ({
      input: tiles.get(name),
      left,
      top,
    })),
  )
  .webp({ quality: 82, alphaQuality: 90, effort: 6 })
  .toFile(outputPath)

console.log(`Generated ${outputPath} with ${placements.length} tiles.`)

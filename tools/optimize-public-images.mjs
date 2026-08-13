import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = join(projectRoot, 'assets-src')
const publicRoot = join(projectRoot, 'public')

const bannerSources = [
  ['mumu-560x320.jpg', 'mumu.webp'],
  ['biubiu.png', 'biubiu.webp'],
  ['mirror.png', 'mirror.webp'],
  ['biyong.png', 'biyong.webp'],
  ['wiki.png', 'wiki.webp'],
]

const optimizeBanners = async () => {
  for (const [sourceName, outputName] of bannerSources) {
    const outputPath = join(publicRoot, outputName)
    await sharp(join(sourceRoot, 'banners', sourceName))
      .resize(560, 320, { fit: 'cover' })
      .webp({ quality: 82, alphaQuality: 90, effort: 6 })
      .toFile(outputPath)
  }
}

const optimizeAvatars = async () => {
  const avatarRoot = join(publicRoot, 'assets', 'operator-avatars')
  const sourceDir = join(avatarRoot, 'webp96')
  const output32Dir = join(avatarRoot, 'webp32')
  const names = (await readdir(sourceDir)).filter((name) =>
    name.endsWith('.webp'),
  )

  await mkdir(output32Dir, { recursive: true })

  for (const name of names) {
    const sourcePath = join(sourceDir, name)
    const sourceMetadata = await sharp(sourcePath).metadata()
    const output32Path = join(output32Dir, name)

    if (sourceMetadata.width === 96 && sourceMetadata.height === 96) {
      continue
    }

    const output96 = await sharp(sourcePath)
      .resize(96, 96, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toBuffer()
    const output32 = await sharp(output96)
      .resize(32, 32)
      .webp({ quality: 78, alphaQuality: 88, effort: 6 })
      .toBuffer()

    await Promise.all([
      writeFile(sourcePath, output96),
      writeFile(output32Path, output32),
    ])
  }

  await sharp(join(sourceRoot, 'operator-avatars', '404.webp'))
    .resize(96, 96, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(join(avatarRoot, '404.webp'))
}

await Promise.all([optimizeBanners(), optimizeAvatars()])

console.log('Optimized public banners and operator avatars.')

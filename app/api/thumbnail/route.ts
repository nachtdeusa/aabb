import { type NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import sharp from "sharp"
import { spawn } from "child_process"
import { mkdir, writeFile } from "fs/promises"

// Diretório para armazenar thumbnails em cache
const THUMBNAIL_CACHE_DIR = path.join(process.cwd(), ".thumbnail-cache")

// Garantir que o diretório de cache exista
async function ensureCacheDir() {
  try {
    await mkdir(THUMBNAIL_CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error("Erro ao criar diretório de cache:", error)
  }
}

// Função para gerar um hash simples do caminho do arquivo
function getFileHash(filePath: string): string {
  let hash = 0
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Converter para inteiro de 32 bits
  }
  return Math.abs(hash).toString(16)
}

// Função para extrair o primeiro frame de um vídeo usando ffmpeg
async function extractVideoFrame(videoPath: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      videoPath,
      "-ss",
      "00:00:01", // Pegar o frame em 1 segundo (para evitar telas pretas no início)
      "-frames:v",
      "1",
      "-q:v",
      "2",
      outputPath,
    ])

    ffmpeg.on("close", (code) => {
      resolve(code === 0)
    })

    ffmpeg.stderr.on("data", (data) => {
      // FFmpeg envia informações para stderr, não é necessariamente um erro
    })

    // Se ocorrer um erro no processo
    ffmpeg.on("error", (err) => {
      console.error("Erro ao executar ffmpeg:", err)
      resolve(false)
    })
  })
}

// Função para encontrar a primeira imagem em uma pasta
async function findFirstImageInFolder(folderPath: string): Promise<string | null> {
  try {
    const files = fs.readdirSync(folderPath)
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const stats = fs.statSync(filePath)

      if (!stats.isDirectory()) {
        const ext = path.extname(file).toLowerCase()
        if (imageExtensions.includes(ext)) {
          return filePath
        }
      }
    }

    return null
  } catch (error) {
    console.error("Erro ao buscar primeira imagem na pasta:", error)
    return null
  }
}

// Função para verificar se um arquivo WebP é animado
async function isAnimatedWebp(filePath: string): Promise<boolean> {
  try {
    const metadata = await sharp(filePath).metadata()
    return metadata.pages !== undefined && metadata.pages > 1
  } catch (error) {
    console.error("Erro ao verificar se WebP é animado:", error)
    return false
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filePath = searchParams.get("path")

  if (!filePath) {
    return NextResponse.json({ error: "Caminho não fornecido" }, { status: 400 })
  }

  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
    }

    // Garantir que o diretório de cache exista
    await ensureCacheDir()

    // Determinar o tipo de arquivo
    const ext = path.extname(filePath).toLowerCase()
    const isGif = ext === ".gif"
    const isWebp = ext === ".webp"
    const isAnimatedWebpFile = isWebp && (await isAnimatedWebp(filePath))
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext) && !isGif && !isAnimatedWebpFile
    const isVideo = [".mp4", ".webm", ".ogv", ".mkv"].includes(ext)
    const isDirectory = fs.statSync(filePath).isDirectory()

    // Gerar nome de arquivo para cache
    const fileHash = getFileHash(filePath)
    const cacheFilePath = path.join(THUMBNAIL_CACHE_DIR, `${fileHash}${isGif || isAnimatedWebpFile ? ext : ".jpg"}`)

    // Verificar se já existe no cache
    if (fs.existsSync(cacheFilePath)) {
      const cachedThumbnail = fs.readFileSync(cacheFilePath)
      return new NextResponse(cachedThumbnail, {
        headers: {
          "Content-Type": isGif ? "image/gif" : isAnimatedWebpFile ? "image/webp" : "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      })
    }

    let thumbnailBuffer

    if (isImage) {
      // Gerar miniatura para imagem
      thumbnailBuffer = await sharp(filePath).resize(300, 300, { fit: "cover" }).toBuffer()

      // Salvar no cache
      await writeFile(cacheFilePath, thumbnailBuffer)
    } else if (isGif || isAnimatedWebpFile) {
      // Para GIFs e WebPs animados, retornar o arquivo original para preservar a animação
      thumbnailBuffer = fs.readFileSync(filePath)

      // Salvar no cache
      await writeFile(cacheFilePath, thumbnailBuffer)

      // Retornar o arquivo original
      return new NextResponse(thumbnailBuffer, {
        headers: {
          "Content-Type": isGif ? "image/gif" : "image/webp",
          "Cache-Control": "public, max-age=86400",
        },
      })
    } else if (isVideo) {
      // Para vídeos, extrair o primeiro frame
      const frameOutputPath = path.join(THUMBNAIL_CACHE_DIR, `${fileHash}_frame.jpg`)

      // Tentar extrair o frame do vídeo
      const extractionSuccess = await extractVideoFrame(filePath, frameOutputPath)

      if (extractionSuccess && fs.existsSync(frameOutputPath)) {
        // Se conseguiu extrair o frame, usar como thumbnail
        thumbnailBuffer = await sharp(frameOutputPath).resize(300, 300, { fit: "cover" }).toBuffer()

        // Salvar no cache
        await writeFile(cacheFilePath, thumbnailBuffer)
      } else {
        // Se falhou, usar um placeholder
        const placeholderPath = path.join(process.cwd(), "public", "video-placeholder.png")

        if (fs.existsSync(placeholderPath)) {
          thumbnailBuffer = await sharp(placeholderPath).resize(300, 300, { fit: "cover" }).toBuffer()
        } else {
          // Criar uma imagem de placeholder
          thumbnailBuffer = await sharp({
            create: {
              width: 300,
              height: 300,
              channels: 4,
              background: { r: 50, g: 50, b: 50, alpha: 1 },
            },
          }).toBuffer()
        }

        // Salvar no cache
        await writeFile(cacheFilePath, thumbnailBuffer)
      }
    } else if (isDirectory) {
      // Para diretórios, procurar por uma imagem para usar como capa
      const firstImage = await findFirstImageInFolder(filePath)

      if (firstImage) {
        // Se encontrou uma imagem, usar como thumbnail
        const firstImageExt = path.extname(firstImage).toLowerCase()

        if (firstImageExt === ".gif") {
          // Se for GIF, preservar a animação
          thumbnailBuffer = fs.readFileSync(firstImage)

          // Salvar no cache
          await writeFile(cacheFilePath, thumbnailBuffer)

          // Retornar o GIF
          return new NextResponse(thumbnailBuffer, {
            headers: {
              "Content-Type": "image/gif",
              "Cache-Control": "public, max-age=86400",
            },
          })
        } else if (firstImageExt === ".webp" && (await isAnimatedWebp(firstImage))) {
          // Se for WebP animado, preservar a animação
          thumbnailBuffer = fs.readFileSync(firstImage)

          // Salvar no cache
          await writeFile(cacheFilePath, thumbnailBuffer)

          // Retornar o WebP
          return new NextResponse(thumbnailBuffer, {
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=86400",
            },
          })
        } else {
          // Se for outra imagem, gerar thumbnail
          thumbnailBuffer = await sharp(firstImage).resize(300, 300, { fit: "cover" }).toBuffer()

          // Salvar no cache
          await writeFile(cacheFilePath, thumbnailBuffer)
        }
      } else {
        // Se não encontrou imagem, usar um placeholder para pasta
        const placeholderPath = path.join(process.cwd(), "public", "folder-placeholder.png")

        if (fs.existsSync(placeholderPath)) {
          thumbnailBuffer = await sharp(placeholderPath).resize(300, 300, { fit: "cover" }).toBuffer()
        } else {
          // Criar uma imagem de placeholder
          thumbnailBuffer = await sharp({
            create: {
              width: 300,
              height: 300,
              channels: 4,
              background: { r: 30, g: 30, b: 30, alpha: 1 },
            },
          }).toBuffer()
        }

        // Salvar no cache
        await writeFile(cacheFilePath, thumbnailBuffer)
      }
    } else {
      // Tipo de arquivo não suportado
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }

    // Retornar a miniatura
    return new NextResponse(thumbnailBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    console.error("Erro ao gerar miniatura:", error)
    return NextResponse.json({ error: "Erro ao gerar miniatura" }, { status: 500 })
  }
}


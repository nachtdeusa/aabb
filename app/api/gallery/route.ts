import { type NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

// Extensões de arquivos suportadas
const supportedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]
const supportedVideoExtensions = [".mp4", ".webm", ".ogv", ".mkv"]
const supportedAudioExtensions = [".mp3", ".ogg", ".wav"]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const folderPath = searchParams.get("path")

  if (!folderPath) {
    return NextResponse.json({ error: "Caminho não fornecido" }, { status: 400 })
  }

  try {
    // Verificar se o caminho existe
    const stats = await stat(folderPath)

    if (!stats.isDirectory()) {
      return NextResponse.json({ error: "O caminho não é um diretório" }, { status: 400 })
    }

    // Ler o conteúdo do diretório
    const files = await readdir(folderPath)

    // Processar arquivos e subpastas
    const media = []
    const subfolders = []

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const fileStats = await stat(filePath)

      if (fileStats.isDirectory()) {
        // É uma subpasta
        const thumbnail = await findThumbnailInFolder(filePath)

        subfolders.push({
          name: file,
          path: filePath,
          thumbnail,
        })
      } else {
        // É um arquivo
        const ext = path.extname(file).toLowerCase()

        if (
          supportedImageExtensions.includes(ext) ||
          supportedVideoExtensions.includes(ext) ||
          supportedAudioExtensions.includes(ext)
        ) {
          media.push({
            name: file,
            path: filePath,
            size: fileStats.size,
            type: getFileType(ext),
          })
        }
      }
    }

    return NextResponse.json({
      name: path.basename(folderPath),
      path: folderPath,
      media,
      subfolders,
    })
  } catch (error) {
    console.error("Erro ao ler diretório:", error)
    return NextResponse.json({ error: "Erro ao ler diretório" }, { status: 500 })
  }
}

// Função para encontrar uma miniatura em uma pasta
async function findThumbnailInFolder(folderPath: string): Promise<string | null> {
  try {
    const files = await readdir(folderPath)

    // Procurar por imagens para usar como miniatura
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const fileStats = await stat(filePath)

      if (!fileStats.isDirectory()) {
        const ext = path.extname(file).toLowerCase()

        if (supportedImageExtensions.includes(ext)) {
          return filePath
        }
      }
    }

    // Procurar por vídeos para usar como miniatura
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const fileStats = await stat(filePath)

      if (!fileStats.isDirectory()) {
        const ext = path.extname(file).toLowerCase()

        if (supportedVideoExtensions.includes(ext)) {
          return filePath
        }
      }
    }

    return null
  } catch (error) {
    console.error("Erro ao procurar miniatura:", error)
    return null
  }
}

// Função para determinar o tipo de arquivo
function getFileType(extension: string): string {
  if (supportedImageExtensions.includes(extension)) {
    return "image"
  } else if (supportedVideoExtensions.includes(extension)) {
    return "video"
  } else if (supportedAudioExtensions.includes(extension)) {
    return "audio"
  } else {
    return "unknown"
  }
}


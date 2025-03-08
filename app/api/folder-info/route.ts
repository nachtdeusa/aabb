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

    // Processar subpastas
    const subfolders = []

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const fileStats = await stat(filePath)

      if (fileStats.isDirectory()) {
        // É uma subpasta
        const thumbnail = await findThumbnailInFolder(filePath)
        const hasMedia = await checkFolderHasMedia(filePath)

        if (hasMedia) {
          subfolders.push({
            name: file,
            path: filePath,
            thumbnail,
          })
        }
      }
    }

    // Obter tags da galeria
    const tags = await getGalleryTags(folderPath)

    return NextResponse.json({
      name: path.basename(folderPath),
      path: folderPath,
      type: await determineFolderType(folderPath),
      subfolders,
      tags,
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

// Função para verificar se uma pasta contém arquivos de mídia
async function checkFolderHasMedia(folderPath: string): Promise<boolean> {
  try {
    const files = await readdir(folderPath)

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const fileStats = await stat(filePath)

      if (!fileStats.isDirectory()) {
        const ext = path.extname(file).toLowerCase()

        if (
          supportedImageExtensions.includes(ext) ||
          supportedVideoExtensions.includes(ext) ||
          supportedAudioExtensions.includes(ext)
        ) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error("Erro ao verificar mídia na pasta:", error)
    return false
  }
}

// Função para determinar o tipo predominante de arquivos em uma pasta
async function determineFolderType(folderPath: string): Promise<string> {
  try {
    const files = await readdir(folderPath)

    let imageCount = 0
    let videoCount = 0
    let audioCount = 0

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const fileStats = await stat(filePath)

      if (!fileStats.isDirectory()) {
        const ext = path.extname(file).toLowerCase()

        if (supportedImageExtensions.includes(ext)) {
          imageCount++
        } else if (supportedVideoExtensions.includes(ext)) {
          videoCount++
        } else if (supportedAudioExtensions.includes(ext)) {
          audioCount++
        }
      }
    }

    if (imageCount > videoCount && imageCount > audioCount) {
      return "images"
    } else if (videoCount > imageCount && videoCount > audioCount) {
      return "videos"
    } else if (audioCount > imageCount && audioCount > videoCount) {
      return "audio"
    } else if (imageCount > 0 || videoCount > 0 || audioCount > 0) {
      return "mixed"
    } else {
      return "folder"
    }
  } catch (error) {
    console.error("Erro ao determinar tipo da pasta:", error)
    return "folder"
  }
}

// Função para obter tags de uma galeria
async function getGalleryTags(path: string): Promise<string[]> {
  if (typeof localStorage === "undefined") return []

  const storedGalleryTags = localStorage.getItem("media-gallery-gallery-tags")
  const galleryTags = storedGalleryTags ? JSON.parse(storedGalleryTags) : {}

  return galleryTags[path] || []
}


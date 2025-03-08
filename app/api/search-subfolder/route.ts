import { type NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rootPath = searchParams.get("path")
  const query = searchParams.get("query")

  if (!rootPath || !query) {
    return NextResponse.json({ error: "Parâmetros incompletos" }, { status: 400 })
  }

  try {
    // Verificar se o caminho existe
    const stats = await stat(rootPath)

    if (!stats.isDirectory()) {
      return NextResponse.json({ error: "O caminho não é um diretório" }, { status: 400 })
    }

    // Buscar subpastas que correspondem à consulta
    const results = await searchSubfolders(rootPath, query.toLowerCase())

    return NextResponse.json(results)
  } catch (error) {
    console.error("Erro ao buscar subpastas:", error)
    return NextResponse.json({ error: "Erro ao buscar subpastas" }, { status: 500 })
  }
}

// Função para buscar subpastas
async function searchSubfolders(rootPath: string, query: string): Promise<any[]> {
  const results: any[] = []

  // Função recursiva para percorrer diretórios
  async function traverse(dirPath: string) {
    try {
      const files = await readdir(dirPath)

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const fileStats = await stat(filePath)

        if (fileStats.isDirectory()) {
          // Verificar se o nome da pasta corresponde à consulta
          if (file.toLowerCase().includes(query)) {
            // Encontrar uma miniatura
            const thumbnail = await findThumbnailInFolder(filePath)

            // Determinar o tipo de pasta
            const type = await determineFolderType(filePath)

            results.push({
              name: file,
              path: filePath,
              type,
              thumbnail,
            })
          }

          // Continuar a busca recursivamente
          await traverse(filePath)
        }
      }
    } catch (error) {
      console.error(`Erro ao percorrer diretório ${dirPath}:`, error)
    }
  }

  await traverse(rootPath)

  return results
}

// Função para encontrar uma miniatura em uma pasta
async function findThumbnailInFolder(folderPath: string): Promise<string | null> {
  try {
    const files = await readdir(folderPath)

    // Extensões de arquivos suportadas
    const supportedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]
    const supportedVideoExtensions = [".mp4", ".webm", ".ogv", ".mkv"]

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

// Função para determinar o tipo predominante de arquivos em uma pasta
async function determineFolderType(folderPath: string): Promise<string> {
  try {
    const files = await readdir(folderPath)

    // Extensões de arquivos suportadas
    const supportedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]
    const supportedVideoExtensions = [".mp4", ".webm", ".ogv", ".mkv"]
    const supportedAudioExtensions = [".mp3", ".ogg", ".wav"]

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


import { type NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

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

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath)

    // Determinar o tipo MIME
    const ext = path.extname(filePath).toLowerCase()
    const contentType = getContentType(ext)

    // Retornar o arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Erro ao ler arquivo:", error)
    return NextResponse.json({ error: "Erro ao ler arquivo" }, { status: 500 })
  }
}

// Função para determinar o tipo MIME
function getContentType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
  }

  return mimeTypes[extension] || "application/octet-stream"
}


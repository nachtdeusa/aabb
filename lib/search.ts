// Funções para busca

import { getKeywords, getKeyword } from "./keywords"
import { getGalleriesByTag } from "./gallery"

// Buscar por palavra-chave ou tag
export const searchByKeyword = async (query: string): Promise<any[]> => {
  // Verificar se é uma palavra-chave
  const keyword = await getKeyword(query)

  if (keyword) {
    // É uma palavra-chave, retornar os caminhos
    const results = await Promise.all(
      keyword.paths.map(async (path) => {
        try {
          // Obter informações da pasta
          const response = await fetch(`/api/folder-info?path=${encodeURIComponent(path)}`)
          if (!response.ok) throw new Error("Falha ao obter informações da pasta")

          const folderInfo = await response.json()
          return {
            ...folderInfo,
            isFavorite: await isPathFavorite(path),
          }
        } catch (error) {
          console.error("Erro ao obter informações da pasta:", error)
          return {
            name: path.split("\\").pop() || path.split("/").pop() || path,
            path,
            type: keyword.type,
            subfolders: [],
            isFavorite: false,
          }
        }
      }),
    )

    return results
  }

  // Verificar se é uma tag
  const galleryPaths = await getGalleriesByTag(query)

  if (galleryPaths.length > 0) {
    // É uma tag, retornar as galerias
    const results = await Promise.all(
      galleryPaths.map(async (path) => {
        try {
          // Obter informações da galeria
          const response = await fetch(`/api/gallery-info?path=${encodeURIComponent(path)}`)
          if (!response.ok) throw new Error("Falha ao obter informações da galeria")

          const galleryInfo = await response.json()
          return {
            ...galleryInfo,
            isFavorite: await isPathFavorite(path),
          }
        } catch (error) {
          console.error("Erro ao obter informações da galeria:", error)
          return {
            name: path.split("\\").pop() || path.split("/").pop() || path,
            path,
            type: "unknown",
            isFavorite: false,
          }
        }
      }),
    )

    return results
  }

  // Buscar em subpastas de palavras-chave
  const keywords = await getKeywords()
  const allResults = []

  for (const keyword of keywords) {
    for (const path of keyword.paths) {
      try {
        // Verificar se a subpasta existe
        const response = await fetch(
          `/api/search-subfolder?path=${encodeURIComponent(path)}&query=${encodeURIComponent(query)}`,
        )
        if (!response.ok) continue

        const results = await response.json()

        if (results.length > 0) {
          const enhancedResults = await Promise.all(
            results.map(async (result: any) => ({
              ...result,
              isFavorite: await isPathFavorite(result.path),
            })),
          )

          allResults.push(...enhancedResults)
        }
      } catch (error) {
        console.error("Erro ao buscar em subpastas:", error)
      }
    }
  }

  return allResults
}

// Verificar se um caminho é favorito
const isPathFavorite = async (path: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  const storedFavorites = localStorage.getItem("media-gallery-favorites")
  const favorites = storedFavorites ? JSON.parse(storedFavorites) : []

  return favorites.some((fav: any) => fav.path === path)
}


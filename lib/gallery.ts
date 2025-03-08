// Funções para gerenciar galerias, favoritos e tags de galerias

// Armazenamento local para favoritos
const FAVORITES_STORAGE_KEY = "media-gallery-favorites"

// Armazenamento local para tags de galerias
const GALLERY_TAGS_STORAGE_KEY = "media-gallery-gallery-tags"

// Interface para galeria
interface Gallery {
  path: string
  name: string
  type: string
  thumbnail?: string
}

// Interface para tags de galeria
interface GalleryTags {
  [path: string]: string[]
}

// Obter conteúdo de uma galeria
export const getGalleryContents = async (path: string): Promise<any> => {
  try {
    const response = await fetch(`/api/gallery?path=${encodeURIComponent(path)}`)
    if (!response.ok) throw new Error("Falha ao carregar galeria")
    return await response.json()
  } catch (error) {
    console.error("Erro ao carregar galeria:", error)
    return { name: "Erro", media: [], subfolders: [] }
  }
}

// Obter arquivo de mídia
export const getMediaFile = async (path: string): Promise<Blob> => {
  try {
    const response = await fetch(`/api/media?path=${encodeURIComponent(path)}`)
    if (!response.ok) throw new Error("Falha ao carregar mídia")
    return await response.blob()
  } catch (error) {
    console.error("Erro ao carregar mídia:", error)
    throw error
  }
}

// Verificar se uma galeria é favorita
export const isGalleryFavorite = async (path: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  const favorites = await getFavorites()
  return favorites.some((fav) => fav.path === path)
}

// Alternar favorito
export const toggleFavorite = async (path: string): Promise<void> => {
  if (typeof window === "undefined") return

  const favorites = await getFavorites()
  const isFavorite = await isGalleryFavorite(path)

  if (isFavorite) {
    // Remover dos favoritos
    const updatedFavorites = favorites.filter((fav) => fav.path !== path)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites))
  } else {
    // Adicionar aos favoritos
    try {
      const response = await fetch(`/api/gallery-info?path=${encodeURIComponent(path)}`)
      if (!response.ok) throw new Error("Falha ao obter informações da galeria")

      const galleryInfo = await response.json()
      favorites.push(galleryInfo)
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    } catch (error) {
      console.error("Erro ao adicionar favorito:", error)
    }
  }
}

// Obter todos os favoritos
export const getFavorites = async (): Promise<Gallery[]> => {
  if (typeof window === "undefined") return []

  const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
  return storedFavorites ? JSON.parse(storedFavorites) : []
}

// Obter tags de uma galeria
export const getGalleryTags = async (path: string): Promise<string[]> => {
  if (typeof window === "undefined") return []

  const storedGalleryTags = localStorage.getItem(GALLERY_TAGS_STORAGE_KEY)
  const galleryTags: GalleryTags = storedGalleryTags ? JSON.parse(storedGalleryTags) : {}

  return galleryTags[path] || []
}

// Adicionar tag a uma galeria
export const addGalleryTag = async (path: string, tag: string): Promise<void> => {
  if (typeof window === "undefined") return

  const storedGalleryTags = localStorage.getItem(GALLERY_TAGS_STORAGE_KEY)
  const galleryTags: GalleryTags = storedGalleryTags ? JSON.parse(storedGalleryTags) : {}

  if (!galleryTags[path]) {
    galleryTags[path] = []
  }

  if (!galleryTags[path].includes(tag)) {
    galleryTags[path].push(tag)
    localStorage.setItem(GALLERY_TAGS_STORAGE_KEY, JSON.stringify(galleryTags))
  }
}

// Remover tag de uma galeria
export const removeGalleryTag = async (path: string, tag: string): Promise<void> => {
  if (typeof window === "undefined") return

  const storedGalleryTags = localStorage.getItem(GALLERY_TAGS_STORAGE_KEY)
  const galleryTags: GalleryTags = storedGalleryTags ? JSON.parse(storedGalleryTags) : {}

  if (galleryTags[path]) {
    galleryTags[path] = galleryTags[path].filter((t) => t !== tag)
    localStorage.setItem(GALLERY_TAGS_STORAGE_KEY, JSON.stringify(galleryTags))
  }
}

// Obter galerias por tag
export const getGalleriesByTag = async (tag: string): Promise<string[]> => {
  if (typeof window === "undefined") return []

  const storedGalleryTags = localStorage.getItem(GALLERY_TAGS_STORAGE_KEY)
  const galleryTags: GalleryTags = storedGalleryTags ? JSON.parse(storedGalleryTags) : {}

  const paths: string[] = []

  for (const [path, tags] of Object.entries(galleryTags)) {
    if (tags.includes(tag)) {
      paths.push(path)
    }
  }

  return paths
}


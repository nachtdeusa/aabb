// Funções para gerenciar tags

// Armazenamento local para tags
const TAGS_STORAGE_KEY = "media-gallery-tags"

// Obter todas as tags
export const getTags = async (): Promise<string[]> => {
  if (typeof window === "undefined") return []

  const storedTags = localStorage.getItem(TAGS_STORAGE_KEY)
  return storedTags ? JSON.parse(storedTags) : []
}

// Adicionar uma nova tag
export const addTag = async (tag: string): Promise<void> => {
  if (typeof window === "undefined") return

  const tags = await getTags()

  // Verificar se a tag já existe
  if (!tags.includes(tag)) {
    tags.push(tag)
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags))
  }
}

// Remover uma tag
export const removeTag = async (tag: string): Promise<void> => {
  if (typeof window === "undefined") return

  const tags = await getTags()
  const updatedTags = tags.filter((t) => t !== tag)

  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(updatedTags))
}


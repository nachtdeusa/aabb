// Funções para gerenciar palavras-chave e caminhos

// Armazenamento local para palavras-chave
const KEYWORDS_STORAGE_KEY = "media-gallery-keywords"

// Interface para palavra-chave
interface Keyword {
  name: string
  type: string
  paths: string[]
}

// Obter todas as palavras-chave
export const getKeywords = async (): Promise<Keyword[]> => {
  if (typeof window === "undefined") return []

  const storedKeywords = localStorage.getItem(KEYWORDS_STORAGE_KEY)
  return storedKeywords ? JSON.parse(storedKeywords) : []
}

// Adicionar uma nova palavra-chave
export const addKeyword = async (name: string, type: string): Promise<void> => {
  if (typeof window === "undefined") return

  const keywords = await getKeywords()

  // Verificar se a palavra-chave já existe
  const existingIndex = keywords.findIndex((k) => k.name === name)

  if (existingIndex >= 0) {
    // Atualizar o tipo se a palavra-chave já existir
    keywords[existingIndex].type = type
  } else {
    // Adicionar nova palavra-chave
    keywords.push({
      name,
      type,
      paths: [],
    })
  }

  localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(keywords))
}

// Remover uma palavra-chave
export const removeKeyword = async (name: string): Promise<void> => {
  if (typeof window === "undefined") return

  const keywords = await getKeywords()
  const updatedKeywords = keywords.filter((k) => k.name !== name)

  localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(updatedKeywords))
}

// Adicionar um caminho a uma palavra-chave
export const addPath = async (keywordName: string, path: string): Promise<void> => {
  if (typeof window === "undefined") return

  const keywords = await getKeywords()
  const keywordIndex = keywords.findIndex((k) => k.name === keywordName)

  if (keywordIndex >= 0) {
    // Verificar se o caminho já existe
    if (!keywords[keywordIndex].paths.includes(path)) {
      keywords[keywordIndex].paths.push(path)
      localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(keywords))
    }
  }
}

// Remover um caminho de uma palavra-chave
export const removePath = async (keywordName: string, path: string): Promise<void> => {
  if (typeof window === "undefined") return

  const keywords = await getKeywords()
  const keywordIndex = keywords.findIndex((k) => k.name === keywordName)

  if (keywordIndex >= 0) {
    keywords[keywordIndex].paths = keywords[keywordIndex].paths.filter((p) => p !== path)
    localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(keywords))
  }
}

// Obter uma palavra-chave específica
export const getKeyword = async (name: string): Promise<Keyword | null> => {
  if (typeof window === "undefined") return null

  const keywords = await getKeywords()
  return keywords.find((k) => k.name === name) || null
}


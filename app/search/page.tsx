"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Folder, Image, Video, Music, Star, Tag } from "lucide-react"
import { searchByKeyword } from "@/lib/search"
import { addGalleryTag, removeGalleryTag, toggleFavorite } from "@/lib/gallery"
import { getTags } from "@/lib/tags"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTabs } from "@/contexts/TabContext"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const { updateTabTitle } = useTabs()
  const titleUpdated = useRef(false)

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Atualizar o título da aba com a consulta
  useEffect(() => {
    if (query && !titleUpdated.current) {
      updateTabTitle(`search-${query}`, `Busca: ${query}`)
      titleUpdated.current = true
    }
  }, [query, updateTabTitle])

  const performSearch = useCallback(async () => {
    if (!query) return

    setLoading(true)
    try {
      const searchResults = await searchByKeyword(query)
      setResults(searchResults)

      // Adicionar timeout para verificar se não há resultados
      if (searchResults.length === 0) {
        setError("Palavra-chave inválida ou sem resultados")
      }
    } catch (error) {
      console.error("Erro na busca:", error)
      setError("Erro ao realizar a busca")
    } finally {
      setLoading(false)
    }
  }, [query])

  const loadTags = useCallback(async () => {
    const tags = await getTags()
    setAvailableTags(tags)
  }, [])

  useEffect(() => {
    if (query) {
      titleUpdated.current = false
      setError(null)
      performSearch()
      loadTags()
    }
  }, [query, performSearch, loadTags])

  const handleOpenGallery = (path: string) => {
    router.push(`/gallery?path=${encodeURIComponent(path)}`)
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "images":
        return <Image size={20} />
      case "videos":
        return <Video size={20} />
      case "audio":
        return <Music size={20} />
      default:
        return <Folder size={20} />
    }
  }

  const handleToggleFavorite = async (path: string) => {
    await toggleFavorite(path)
    performSearch() // Recarregar para atualizar status de favorito
  }

  const handleAddTag = async (path: string, tag: string) => {
    await addGalleryTag(path, tag)
    performSearch() // Recarregar para atualizar tags
  }

  const handleRemoveTag = async (path: string, tag: string) => {
    await removeGalleryTag(path, tag)
    performSearch() // Recarregar para atualizar tags
  }

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Backspace") {
        // Não voltar se estiver em um input, textarea ou elemento editável
        const target = e.target as HTMLElement
        const tagName = target.tagName.toLowerCase()
        const isEditableElement = tagName === "input" || tagName === "textarea" || target.isContentEditable

        if (!isEditableElement) {
          e.preventDefault()
          router.push("/")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
            <ArrowLeft className="mr-2" size={20} />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Resultados para: {query}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-400">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum resultado encontrado para "{query}"</p>
              </div>
            ) : (
              results.map((item, index) => (
                <div key={index} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {getIconForType(item.type)}
                      <h2 className="ml-2 font-medium">{item.name}</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(item.path)}
                        className={item.isFavorite ? "text-yellow-400" : "text-gray-400"}
                      >
                        <Star size={20} />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Tag size={20} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800">
                          <DialogHeader>
                            <DialogTitle>Gerenciar Tags</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium mb-2">Tags Aplicadas</h3>
                              <div className="flex flex-wrap gap-2">
                                {item.tags && item.tags.length > 0 ? (
                                  item.tags.map((tag: string, tagIndex: number) => (
                                    <Badge key={tagIndex} variant="secondary" className="flex items-center gap-1">
                                      {tag}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0"
                                        onClick={() => handleRemoveTag(item.path, tag)}
                                      >
                                        <span className="text-xs">×</span>
                                      </Button>
                                    </Badge>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-400">Nenhuma tag aplicada</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium mb-2">Tags Disponíveis</h3>
                              <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-gray-800"
                                    onClick={() => handleAddTag(item.path, tag)}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <p className="text-sm text-gray-400 mb-2">Caminho: {item.path}</p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.map((tag: string, tagIndex: number) => (
                          <Badge key={tagIndex} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {item.subfolders && item.subfolders.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Subpastas</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {item.subfolders.map((subfolder: any, subIndex: number) => (
                            <div
                              key={subIndex}
                              className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700"
                              onClick={() => handleOpenGallery(subfolder.path)}
                            >
                              <div className="aspect-square bg-gray-700 rounded flex items-center justify-center mb-2">
                                {subfolder.thumbnail ? (
                                  <img
                                    src={`/api/thumbnail?path=${encodeURIComponent(subfolder.thumbnail)}`}
                                    alt={subfolder.name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Folder size={32} />
                                )}
                              </div>
                              <p className="text-xs truncate">{subfolder.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="mt-4 w-full" onClick={() => handleOpenGallery(item.path)}>
                      Abrir Galeria
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}


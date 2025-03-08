"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Folder, Image, Video, Music, Star } from "lucide-react"
import { getFavorites, toggleFavorite } from "@/lib/gallery"
import { useTabs } from "@/contexts/TabContext"

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { updateTabTitle } = useTabs()
  const titleUpdated = useRef(false)

  // Atualizar o título da aba
  useEffect(() => {
    if (!titleUpdated.current) {
      updateTabTitle("favorites", "Favoritos")
      titleUpdated.current = true
    }
  }, [updateTabTitle])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const favoritesData = await getFavorites()
      setFavorites(favoritesData)
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenGallery = (path: string) => {
    router.push(`/gallery?path=${encodeURIComponent(path)}`)
  }

  const handleToggleFavorite = async (path: string) => {
    await toggleFavorite(path)
    loadFavorites()
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
          <h1 className="text-2xl font-bold">Favoritos</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum favorito encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((item, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    <div className="aspect-square bg-gray-800 relative">
                      {item.thumbnail ? (
                        <img
                          src={`/api/thumbnail?path=${encodeURIComponent(item.thumbnail)}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getIconForType(item.type)}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(item.path)}
                        className="absolute top-2 right-2 text-yellow-400 bg-black bg-opacity-50 rounded-full"
                      >
                        <Star size={20} />
                      </Button>
                    </div>

                    <div className="p-4">
                      <h2 className="font-medium truncate mb-1">{item.name}</h2>
                      <p className="text-xs text-gray-400 truncate mb-4">{item.path}</p>

                      <Button className="w-full" onClick={() => handleOpenGallery(item.path)}>
                        Abrir Galeria
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


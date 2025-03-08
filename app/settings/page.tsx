"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { addKeyword, getKeywords, removeKeyword, addPath, removePath } from "@/lib/keywords"
import { addTag, getTags, removeTag } from "@/lib/tags"
import { useTabs } from "@/contexts/TabContext"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("keywords")
  const [keywords, setKeywords] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newPath, setNewPath] = useState("")
  const [selectedMediaType, setSelectedMediaType] = useState("images")
  const [paths, setPaths] = useState<string[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const titleUpdated = useRef(false)

  const router = useRouter()
  const { toast } = useToast()
  const { updateTabTitle } = useTabs()

  // Atualizar o título da aba
  useEffect(() => {
    if (!titleUpdated.current) {
      updateTabTitle("settings", "Configurações")
      titleUpdated.current = true
    }
  }, [updateTabTitle])

  useEffect(() => {
    loadKeywords()
    loadTags()
  }, [])

  const loadKeywords = async () => {
    const keywordsData = await getKeywords()
    setKeywords(keywordsData)
  }

  const loadTags = async () => {
    const tagsData = await getTags()
    setTags(tagsData)
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return

    await addKeyword(newKeyword, selectedMediaType)
    setNewKeyword("")
    loadKeywords()
    setSelectedKeyword(newKeyword)
    setPaths([])

    toast({
      title: "Palavra-chave adicionada",
      description: `A palavra-chave "${newKeyword}" foi adicionada com sucesso.`,
    })
  }

  const handleRemoveKeyword = async (keyword: string) => {
    await removeKeyword(keyword)
    loadKeywords()
    if (selectedKeyword === keyword) {
      setSelectedKeyword(null)
      setPaths([])
    }

    toast({
      title: "Palavra-chave removida",
      description: `A palavra-chave "${keyword}" foi removida com sucesso.`,
    })
  }

  const handleAddPath = async () => {
    if (!newPath.trim() || !selectedKeyword) return

    await addPath(selectedKeyword, newPath)
    setNewPath("")
    loadKeywords()

    toast({
      title: "Caminho adicionado",
      description: `O caminho foi adicionado à palavra-chave "${selectedKeyword}".`,
    })
  }

  const handleRemovePath = async (keyword: string, path: string) => {
    await removePath(keyword, path)
    loadKeywords()

    toast({
      title: "Caminho removido",
      description: `O caminho foi removido da palavra-chave "${keyword}".`,
    })
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return

    await addTag(newTag)
    setNewTag("")
    loadTags()

    toast({
      title: "Tag adicionada",
      description: `A tag "${newTag}" foi adicionada com sucesso.`,
    })
  }

  const handleRemoveTag = async (tag: string) => {
    await removeTag(tag)
    loadTags()

    toast({
      title: "Tag removida",
      description: `A tag "${tag}" foi removida com sucesso.`,
    })
  }

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword)
    const keywordData = keywords.find((k) => k.name === keyword)
    setPaths(keywordData?.paths || [])
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
            <ArrowLeft className="mr-2" size={20} />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Gerenciar Palavras-chave</h1>
        </div>

        <Tabs defaultValue="keywords" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Adicionar Nova Palavra-chave</CardTitle>
                  <CardDescription>Defina palavras-chave e associe caminhos de diretórios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyword">Palavra-chave</Label>
                      <Input
                        id="keyword"
                        placeholder="Ex: putas, puctas, cumdump, onahole"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mediaType">Tipo de Mídia</Label>
                      <Select value={selectedMediaType} onValueChange={setSelectedMediaType}>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Selecione o tipo de mídia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="images">Imagens</SelectItem>
                          <SelectItem value="videos">Vídeos</SelectItem>
                          <SelectItem value="audio">Áudios</SelectItem>
                          <SelectItem value="mixed">Misto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAddKeyword} className="w-full">
                    Adicionar Palavra-chave
                  </Button>
                </CardFooter>
              </Card>

              {selectedKeyword && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Caminhos</CardTitle>
                    <CardDescription>Adicione caminhos para a palavra-chave: {selectedKeyword}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="path">Caminho</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="path"
                            placeholder="Ex: C:\Users\username\Pictures\folder"
                            value={newPath}
                            onChange={(e) => setNewPath(e.target.value)}
                            className="bg-gray-800 border-gray-700 flex-1"
                          />
                          <Button onClick={handleAddPath} size="icon">
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Caminhos existentes</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {paths.map((path, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                              <span className="text-sm truncate flex-1">{path}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePath(selectedKeyword, path)}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </Button>
                            </div>
                          ))}
                          {paths.length === 0 && <p className="text-sm text-gray-400">Nenhum caminho adicionado</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="mt-8 bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Palavras-chave Existentes</CardTitle>
                <CardDescription>Gerencie suas palavras-chave e caminhos associados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${selectedKeyword === keyword.name ? "border-blue-500 bg-gray-800" : "border-gray-700 bg-gray-800"}`}
                      onClick={() => handleKeywordSelect(keyword.name)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <h3 className="font-medium">{keyword.name}</h3>
                          <Badge className="ml-2" variant="outline">
                            {keyword.type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveKeyword(keyword.name)
                          }}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-400">
                        <p>Caminhos:</p>
                        <ul className="list-disc list-inside">
                          {keyword.paths.map((path: string, pathIndex: number) => (
                            <li key={pathIndex} className="truncate">
                              {path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                  {keywords.length === 0 && (
                    <p className="text-center text-gray-400">Nenhuma palavra-chave adicionada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Adicionar Nova Tag</CardTitle>
                  <CardDescription>Crie tags para organizar suas galerias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag">Tag</Label>
                      <Input
                        id="tag"
                        placeholder="Ex: favoritos, importante, assistir depois"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAddTag} className="w-full">
                    Adicionar Tag
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Tags Existentes</CardTitle>
                  <CardDescription>Gerencie suas tags</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-gray-800 rounded-full px-3 py-1">
                        <span className="text-sm mr-2">{tag}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveTag(tag)}>
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {tags.length === 0 && <p className="text-center text-gray-400 w-full">Nenhuma tag adicionada</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


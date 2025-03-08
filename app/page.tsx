"use client"

import type React from "react"

import { useState } from "react"
import { Search, Settings, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTabs } from "@/contexts/TabContext"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const { addTab } = useTabs()

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      addTab({
        title: `Busca: ${searchQuery}`,
        url: `/search?q=${encodeURIComponent(searchQuery)}`,
        type: "search",
        query: searchQuery,
      })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <div className="w-full max-w-5xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">納赫特王國</h1>

        <div className="relative mb-8">
          <p className="text-center mb-2 text-gray-400">Insira a palavra-chave</p>
          <div className="relative">
            <Input
              type="text"
              placeholder="Digite uma palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-gray-900 border-gray-700 text-white pl-10 pr-4 py-6 rounded-md w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (searchQuery.trim()) {
                  addTab({
                    title: `Busca: ${searchQuery}`,
                    url: `/search?q=${encodeURIComponent(searchQuery)}`,
                    type: "search",
                    query: searchQuery,
                  })
                }
              }}
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="flex justify-center space-x-6">
          <Button
            variant="ghost"
            className="flex flex-col items-center hover:bg-gray-800 rounded-lg p-4"
            onClick={() => {
              addTab({
                title: "Configurações",
                url: "/settings",
                type: "settings",
              })
            }}
          >
            <Settings size={24} className="mb-2" />
            <span>Configurações</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center hover:bg-gray-800 rounded-lg p-4"
            onClick={() => {
              addTab({
                title: "Favoritos",
                url: "/favorites",
                type: "favorites",
              })
            }}
          >
            <Star size={24} className="mb-2" />
            <span>Favoritos</span>
          </Button>
        </div>
      </div>
    </main>
  )
}


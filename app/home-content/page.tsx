"use client"

import { Settings, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HomeContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-center mb-8">納赫特王國</h1>
      <p className="text-center text-gray-400 mb-8">Bem-vindo ao seu explorador de mídia local</p>

      <div className="flex justify-center space-x-6">
        <Button
          variant="ghost"
          className="flex flex-col items-center hover:bg-gray-800 rounded-lg p-4"
          onClick={() => router.push("/settings")}
        >
          <Settings size={24} className="mb-2" />
          <span>Configurações</span>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center hover:bg-gray-800 rounded-lg p-4"
          onClick={() => router.push("/favorites")}
        >
          <Star size={24} className="mb-2" />
          <span>Favoritos</span>
        </Button>
      </div>
    </div>
  )
}


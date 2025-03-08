import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { TabProvider } from "@/contexts/TabContext"
import { TabBar } from "@/components/TabBar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "納赫特王國",
  description: "Explore sua coleção de mídia local",
    generator: 'v0.dev'
}

// Garantir que o TabProvider tenha acesso ao router
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-black text-white`}>
        <TabProvider>
          <TabBar />
          <main className="pt-2">{children}</main>
          <Toaster />
        </TabProvider>
      </body>
    </html>
  )
}



import './globals.css'
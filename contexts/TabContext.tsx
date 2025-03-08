"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

export interface Tab {
  id: string
  title: string
  url: string
  type: "search" | "gallery" | "settings" | "favorites" | "home"
  query?: string
}

interface TabContextType {
  tabs: Tab[]
  activeTab: string
  addTab: (tab: Omit<Tab, "id">) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabTitle: (id: string, title: string) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Inicializar com uma aba home - executado apenas uma vez
  useEffect(() => {
    if (initialized) return

    const initialTab = {
      id: "home",
      title: "Início",
      url: "/",
      type: "home" as const,
    }

    // Carregar tabs do localStorage
    try {
      const savedTabs = localStorage.getItem("media-gallery-tabs")

      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs)
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          setTabs(parsedTabs)

          // Encontrar a aba ativa com base na URL atual
          const currentPath = pathname || "/"
          const matchingTab = parsedTabs.find((tab) => tab.url === currentPath)

          if (matchingTab) {
            setActiveTab(matchingTab.id)
          } else {
            setActiveTab(parsedTabs[0].id)
          }
        } else {
          setTabs([initialTab])
          setActiveTab(initialTab.id)
        }
      } else {
        setTabs([initialTab])
        setActiveTab(initialTab.id)
      }
    } catch (error) {
      console.error("Erro ao carregar abas salvas:", error)
      setTabs([initialTab])
      setActiveTab(initialTab.id)
    }

    setInitialized(true)
  }, [initialized, pathname])

  // Salvar tabs no localStorage quando mudam
  useEffect(() => {
    if (!initialized) return

    if (tabs.length > 0) {
      localStorage.setItem("media-gallery-tabs", JSON.stringify(tabs))
    }
  }, [tabs, initialized])

  // Sincronizar a aba ativa com a URL atual
  useEffect(() => {
    if (!initialized || !pathname) return

    // Evitar atualizações desnecessárias
    const matchingTab = tabs.find((tab) => tab.url === pathname)
    if (matchingTab && matchingTab.id !== activeTab) {
      setActiveTab(matchingTab.id)
    }
  }, [pathname, tabs, activeTab, initialized])

  const addTab = useCallback(
    (tabInfo: Omit<Tab, "id">) => {
      const newTabId = `${tabInfo.type}-${Date.now()}`
      const newTab: Tab = {
        id: newTabId,
        ...tabInfo,
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTab(newTabId)
      router.push(tabInfo.url)
    },
    [router],
  )

  const closeTab = useCallback(
    (id: string) => {
      // Não permitir fechar a última aba
      if (tabs.length <= 1) return

      const tabToClose = tabs.find((tab) => tab.id === id)
      const updatedTabs = tabs.filter((tab) => tab.id !== id)

      setTabs(updatedTabs)

      // Se a aba ativa foi fechada, ativar a primeira aba
      if (activeTab === id) {
        setActiveTab(updatedTabs[0].id)
        router.push(updatedTabs[0].url)
      }
    },
    [tabs, activeTab, router],
  )

  const updateTabTitle = useCallback((id: string, title: string) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, title } : tab)))
  }, [])

  const handleSetActiveTab = useCallback(
    (id: string) => {
      if (id === activeTab) return

      setActiveTab(id)
      const tab = tabs.find((t) => t.id === id)
      if (tab) {
        router.push(tab.url)
      }
    },
    [activeTab, tabs, router],
  )

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTab,
        addTab,
        closeTab,
        setActiveTab: handleSetActiveTab,
        updateTabTitle,
      }}
    >
      {children}
    </TabContext.Provider>
  )
}

export function useTabs() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error("useTabs must be used within a TabProvider")
  }
  return context
}


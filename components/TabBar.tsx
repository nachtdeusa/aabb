"use client"

import type React from "react"

import { useTabs } from "@/contexts/TabContext"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

export function TabBar() {
  const { tabs, activeTab, setActiveTab, closeTab, addTab } = useTabs()

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const handleAddNewTab = () => {
    addTab({
      title: "Nova aba",
      url: "/",
      type: "home",
    })
  }

  return (
    <div className="sticky top-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-full px-2">
        <div className="flex items-center py-1">
          <div className="flex-1 overflow-x-auto">
            <div className="flex h-auto bg-gray-900 p-1 rounded-md">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2 rounded-md mr-1 ${
                    activeTab === tab.id ? "bg-gray-800" : "hover:bg-gray-800/50"
                  }`}
                >
                  <span className="truncate max-w-[150px]">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      className="h-5 w-5 ml-2 text-gray-400 hover:text-white rounded-full flex items-center justify-center"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="ml-2 bg-gray-900 hover:bg-gray-800" onClick={handleAddNewTab}>
            <Plus size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { HockeyLoadingAnimation } from "@/components/hockey-loading-animation"
import { PreferencePanel } from "@/components/preference-panel"
import { ChatMessage } from "@/components/chat-message"
import Image from "next/image"

export default function HockeyGoTimeMockup() {
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState([
    {
      type: "assistant" as const,
      content: "Hi! I can help you with SCAHA hockey schedules. When does your team play next?",
    },
  ])

  const userPreferences = {
    team: "Jr Kings (1)",
    division: "14B",
    season: "2025/2026",
    homeAddress: "17516 Patronella Ave, Torr...",
    prepTime: 30,
    arrivalBuffer: 60,
  }

  const handleSendMessage = () => {
    setIsThinking(true)
    // Simulate thinking
    setTimeout(() => {
      setIsThinking(false)
      setMessages([
        ...messages,
        {
          type: "user" as const,
          content: "When do we play next?",
        },
        {
          type: "assistant" as const,
          content:
            "Your next game is Saturday, January 18th at 3:00 PM at Anaheim Ice. You're playing against the LA Jr. Kings. With traffic, you should leave by 2:15 PM to arrive 60 minutes early.",
        },
      ])
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/hgt-logo.png" alt="HockeyGoTime Logo" width={200} height={60} className="h-12 w-auto" />
            <div className="ml-2">
              <p className="text-4xl text-slate-700 font-[family-name:var(--font-bebas)] tracking-wide leading-tight">
                YOUR AI-POWERED HOCKEY SCHEDULE SIDEKICK
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Preferences Sidebar */}
          <aside className="space-y-4">
            <PreferencePanel
              preferences={userPreferences}
              onEdit={() => console.log("Edit preferences")}
              onClear={() => console.log("Clear preferences")}
            />

            <Card className="p-4 bg-sky-50 border-sky-200">
              <p className="text-sm text-slate-900 font-medium mb-2">💡 Try asking:</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• "When do we play next?"</li>
                <li>• "What time should I leave?"</li>
                <li>• "Who are we playing Saturday?"</li>
                <li>• "Show our team stats"</li>
              </ul>
            </Card>
          </aside>

          {/* Main Chat Area */}
          <main className="space-y-4">
            {/* Chat Messages */}
            <Card className="min-h-[500px] flex flex-col shadow-lg">
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {messages.map((message, index) => (
                  <ChatMessage key={index} type={message.type} content={message.content} />
                ))}

                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-6 py-4">
                      <HockeyLoadingAnimation />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4 bg-slate-50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about schedules, travel times, or stats..."
                    className="flex-1 bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} className="bg-sky-500 hover:bg-sky-600" disabled={isThinking}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  🔒 Your preferences stay in your browser • We don't track or store your data
                </p>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}

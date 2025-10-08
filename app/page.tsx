import ChatAssistant from "@/components/chat/chat-assistant";
import { PreferencePanel } from "@/components/ui/preferences/PreferencePanel";

export default function HockeyGoTimePage() {
  return (
    <div className="h-screen bg-background flex max-w-6xl mx-auto overflow-hidden">
      {/* Sidebar with preferences */}
      <div className="w-80 border-r p-4 overflow-y-auto">
        <PreferencePanel />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold">HockeyGoTime 🏒</h1>
          <p className="text-sm text-muted-foreground mt-1">
            SCAHA Schedule Assistant - Ask me about games, times, and opponents!
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatAssistant api="/api/hockey-chat" />
        </div>
      </div>
    </div>
  );
}

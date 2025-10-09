import Image from "next/image";
import ChatAssistant from "@/components/chat/chat-assistant";
import { PreferencePanel } from "@/components/ui/preferences/PreferencePanel";

const suggestions = [
  '"When do we play next?"',
  '"What time should I leave?"',
  '"Who are we playing Sunday?"',
  '"Show our team stats"',
];

export default function HockeyGoTimePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5">
          <Image
            src="/hgt-logo.png"
            alt="HockeyGoTime logo"
            width={180}
            height={60}
            priority
            className="h-12 w-auto"
          />
          <h1 className="text-xl font-black uppercase tracking-[0.4em] text-slate-800 sm:text-2xl md:text-3xl">
            Your AI-Powered Hockey Schedule Sidekick
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <PreferencePanel />

            <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">💡 Try asking:</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="flex flex-col">
            <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-3xl border-2 border-slate-200 bg-white/95 shadow-xl">
              <ChatAssistant api="/api/hockey-chat" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

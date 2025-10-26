import Image from "next/image";
import ChatAssistant from "@/components/chat/chat-assistant";
import { PreferencePanel } from "@/components/ui/preferences/PreferencePanel";
import { FeedbackButton } from "@/components/ui/feedback/FeedbackButton";

const suggestions = [
  '"When do we play next?"',
  '"What time should I leave?"',
  '"Who are we playing Sunday?"',
  '"Show our team stats"',
];

export default function HockeyGoTimePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sky-50 to-accent dark:from-background dark:via-sky-950/20 dark:to-accent/20">
      <header className="border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5">
          <Image
            src="/hgt-logo.png"
            alt="HockeyGoTime logo"
            width={249}
            height={83}
            priority
            className="h-[83px] w-auto"
          />
          <h1 className="text-2xl font-black uppercase tracking-widest text-foreground sm:text-3xl md:text-4xl">
            Your AI Hockey Schedule Sidekick
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <PreferencePanel />

            <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-4 shadow-sm dark:border-sky-800 dark:bg-sky-950/50">
              <p className="text-sm font-semibold text-foreground">💡 Try asking:</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="flex flex-col">
            <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-3xl border-2 border-border bg-card/95 shadow-xl">
              <ChatAssistant api="/api/hockey-chat" />
            </div>

            {/* Ko-fi donation button + Feedback */}
            <div className="mt-4 flex justify-center items-center gap-3">
              <FeedbackButton />
              <a
                href="https://ko-fi.com/joerawr"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img
                  height="36"
                  style={{ border: '0px', height: '36px' }}
                  src="/buymeabeer.png"
                  alt="Buy me a beer at ko-fi.com"
                />
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

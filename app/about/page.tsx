import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-4xl mx-auto">
      <div className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">About</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          Home
        </Link>
      </div>

      <main className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">HockeyGoTime (HGT) - Stop Hunting for Hockey Schedules</h2>
          <p className="text-muted-foreground">
            Tired of navigating confusing league websites to find your kid&apos;s next game? HGT brings AI to youth hockey scheduling for SCAHA and PGHL families.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Instead of clicking through websites, just ask:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• &quot;When&apos;s our next game?&quot;</li>
            <li>• &quot;What time should I leave for the game this Saturday?&quot;</li>
            <li>• &quot;Show me our team stats&quot;</li>
            <li>• &quot;Who do we play on November 5th?&quot;</li>
            <li>• &quot;How far is the drive to the rink?&quot;</li>
          </ul>
        </div>

        <p>
          HGT understands your questions naturally and gives you quick answers. Set your preferences (team, division, home address) once and HGT remembers them—but only in your browser.
        </p>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Your data, your device</h3>
          <p className="text-sm text-muted-foreground">
            Everything stays local. HGT processes your preferences and queries entirely in your browser. We never see, store, or track your information.
          </p>
        </div>
      </main>
    </div>
  );
}

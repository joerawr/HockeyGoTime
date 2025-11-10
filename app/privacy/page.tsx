export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-neutral max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Last updated: 11/10/2025
        </p>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-amber-900 dark:text-amber-100">
            ⚠️ Development Notice
          </h2>
          <p className="text-amber-800 dark:text-amber-200">
            HockeyGoTime is currently in active development. While we&apos;re pretty sure we&apos;re not saving your data on our servers, bugs happen. If data is accidentally logged during development, it would be quickly flushed and deleted during normal development cycles.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">The Short Version</h2>
          <p className="mb-4 font-medium">
            Your preferences (team, division, home address) are stored in your browser only. We don&apos;t have user accounts, databases, or any way to identify you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What We Store Locally (In Your Browser)</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Team name and division</li>
            <li>Season preference</li>
            <li>Home address (for travel time calculations)</li>
            <li>Arrival buffer and prep time preferences</li>
            <li>League data source selection (SCAHA or PGHL)</li>
          </ul>
          <p className="text-muted-foreground">
            This data never leaves your device. It&apos;s stored using browser localStorage and can be cleared anytime by clicking &quot;Clear All&quot; in the preferences panel or clearing your browser data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What Gets Sent to Our Servers</h2>
          <p className="mb-4">
            When you ask a question, we send:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your chat message</li>
            <li>Your saved preferences (to personalize the AI&apos;s response)</li>
          </ul>
          <p className="mb-4">
            We do <strong>not</strong> send:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Any identifiable information about you</li>
            <li>IP addresses or device fingerprints (intentionally)</li>
            <li>Persistent user IDs or tracking cookies</li>
          </ul>
          <p className="text-muted-foreground">
            Your queries are processed by our AI to generate responses, then discarded. We don&apos;t build profiles or track usage patterns.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="mb-4">
            HockeyGoTime uses these external services:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Google Gemini AI</strong> - Processes your questions to generate responses</li>
            <li><strong>Google Routes API</strong> - Calculates travel times when you ask about departure/arrival times</li>
            <li><strong>League websites (SCAHA/PGHL)</strong> - We fetch public schedule data from official league sites</li>
          </ul>
          <p className="text-muted-foreground">
            These services have their own privacy policies. We don&apos;t control what they log.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">No Analytics or Tracking</h2>
          <p className="mb-4">
            We don&apos;t use Google Analytics, Facebook Pixel, or any other tracking scripts. We don&apos;t know who you are, how often you visit, or what you search for (unless we accidentally log it during a development bug, which would be deleted quickly).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Deletion</h2>
          <p className="mb-4">
            Want to delete your data? Click &quot;Clear All&quot; in the preferences panel. Done. Since everything is stored in your browser, you&apos;re in complete control.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
          <p className="mb-4">
            HockeyGoTime is designed for parents and players. We don&apos;t knowingly collect information from anyone, let alone children. Since we don&apos;t have accounts or persistent storage, this is a non-issue.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
          <p className="mb-4">
            This is a personal project built for hockey families. If you have concerns or questions about privacy, feel free to reach out via GitHub issues at{" "}
            <a href="https://github.com/joerawr/HockeyGoTime" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              github.com/joerawr/HockeyGoTime
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
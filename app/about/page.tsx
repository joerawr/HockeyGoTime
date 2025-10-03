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

      <main className="p-6 space-y-4">
        <p className="text-muted-foreground">
          This starter showcases a minimal AI chat interface using the Next.js
          App Router and a small set of reusable UI primitives.
        </p>
        <p>
          Explore the code in{" "}
          <code className="px-1 py-0.5 bg-muted rounded">app/page.tsx</code> and
          the UI building blocks under{" "}
          <code className="px-1 py-0.5 bg-muted rounded">components</code>.
        </p>
        <p>
          Use this as a foundation for your own product, and customize the
          layout, styles, and components to fit your needs.
        </p>
      </main>
    </div>
  );
}

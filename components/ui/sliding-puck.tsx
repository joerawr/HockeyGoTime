/**
 * Sliding Hockey Puck Loading Indicator
 * Shows a hockey puck sliding from left to right while the AI is thinking
 */

import Image from "next/image";

interface SlidingPuckProps {
  message?: string;
}

export function SlidingPuck({ message = "Thinking..." }: SlidingPuckProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-sky-50 px-4 py-3 border border-sky-200">
      <div className="relative h-8 flex-1 overflow-hidden">
        <div className="animate-slide-puck absolute left-0 top-1/2 -translate-y-1/2">
          <Image
            src="/puck.png"
            alt="Hockey puck"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            unoptimized
            priority
          />
        </div>
      </div>
      <span className="text-sm font-medium text-sky-900 whitespace-nowrap">
        {message}
      </span>
    </div>
  );
}

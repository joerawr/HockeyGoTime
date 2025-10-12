/**
 * Sliding Hockey Puck Loading Indicator
 * Shows a hockey puck sliding from left to right while the AI is thinking
 */

import Image from "next/image";

export function SlidingPuck() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-sky-50 px-4 py-3 border border-sky-200">
      <div className="relative h-8 w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="animate-slide-puck">
            <Image
              src="/puck.jpg"
              alt="Hockey puck"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>
      </div>
      <span className="text-sm font-medium text-sky-900 whitespace-nowrap">
        Thinking...
      </span>
    </div>
  );
}

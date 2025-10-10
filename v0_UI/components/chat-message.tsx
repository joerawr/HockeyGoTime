interface ChatMessageProps {
  type: "user" | "assistant"
  content: string
}

export function ChatMessage({ type, content }: ChatMessageProps) {
  if (type === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-sky-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="bg-slate-100 text-slate-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

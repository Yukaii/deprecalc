import { Smartphone } from "lucide-react"

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Smartphone className="h-12 w-12 text-primary animate-pulse" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce"></span>
        </div>
      </div>
    </div>
  )
}
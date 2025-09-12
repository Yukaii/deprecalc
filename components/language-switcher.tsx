"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { useTransition } from "react"

const locales = [
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' }
]

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  
  const currentLocale = params.locale as string

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      // Replace the locale in the URL
      const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
      router.push(newPath)
    })
  }

  const currentLocaleName = locales.find(l => l.code === currentLocale)?.name || currentLocale

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <Languages className="h-4 w-4 mr-2" />
          {currentLocaleName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => switchLocale(locale.code)}
            className={locale.code === currentLocale ? "bg-muted" : ""}
          >
            {locale.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
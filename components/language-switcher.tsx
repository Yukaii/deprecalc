"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const languages = [
  { code: "zh-TW", name: "繁體中文" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(/^\/(zh-TW|en|ja)/, "")
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`)
    setIsOpen(false)
  }

  const currentLanguage = languages.find((lang) => lang.code === locale)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsOpen(!isOpen)}>
        <Languages className="h-4 w-4" />
        <span>{currentLanguage?.name || "Language"}</span>
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 min-w-[10rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => switchLanguage(language.code)}
              className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
                locale === language.code ? "bg-accent" : ""
              }`}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
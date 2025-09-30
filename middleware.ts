import createMiddleware from "next-intl/middleware"
import { locales } from "./i18n/request"

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: "zh-TW",
})

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(zh-TW|en|ja)/:path*"],
}
import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ja', 'zh-TW'],
 
  // Used when no locale matches
  defaultLocale: 'zh-TW',
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh-TW|en|ja)/:path*']
};
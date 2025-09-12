import createMiddleware from 'next-intl/middleware';
import {routing} from './routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh-TW|en|ja)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
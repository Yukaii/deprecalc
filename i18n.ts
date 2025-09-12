import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from './routing';
 
export default getRequestConfig(async (params) => {
  // Use requestLocale getter if locale is undefined
  let locale = params.locale
  if (!locale && params.requestLocale) {
    try {
      locale = await params.requestLocale
    } catch (error) {
      // If requestLocale fails, use default
      locale = routing.defaultLocale
    }
  }
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale) {
    locale = routing.defaultLocale
  }
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }
  
  try {
    const messages = (await import(`./messages/${locale}.json`)).default
    return { 
      locale,
      messages 
    }
  } catch (error) {
    console.error('Error loading messages for locale:', locale, error)
    throw error
  }
});
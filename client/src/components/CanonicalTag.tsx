import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { getCanonicalUrl, isLegacyUrl } from '@/lib/canonicalUrls';

/**
 * CanonicalTag Component
 *
 * Automatically sets the canonical URL meta tag based on the current path.
 * This is critical for SEO during the WordPress migration to prevent
 * duplicate content penalties.
 *
 * How it works:
 * 1. Detects if user is on a legacy WordPress URL
 * 2. Sets canonical tag pointing to the new clean URL
 * 3. Search engines will consolidate ranking signals to the canonical URL
 *
 * Example:
 * - User visits: /plumbing/toilet-repair-install-quincy-ma/
 * - Canonical set to: https://thejohnsonbros.com/services/general-plumbing
 * - Google knows both URLs are the same content
 */
export function CanonicalTag() {
  const [location] = useLocation();

  useEffect(() => {
    const canonicalUrl = getCanonicalUrl(location);

    // Find or create canonical link element
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }

    canonicalElement.setAttribute('href', canonicalUrl);

    // Log for debugging (only in development)
    if (import.meta.env.DEV && isLegacyUrl(location)) {
      console.log(`[SEO] Legacy URL detected: ${location}`);
      console.log(`[SEO] Canonical set to: ${canonicalUrl}`);
    }
  }, [location]);

  return null;
}

export default CanonicalTag;

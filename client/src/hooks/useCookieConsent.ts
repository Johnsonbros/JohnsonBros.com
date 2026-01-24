/**
 * Cookie Consent Hook
 *
 * Manages cookie consent state and provides methods to update preferences.
 */

import { useState, useEffect, useCallback } from 'react';

// Consent state type
export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

// Full consent status from API
export interface ConsentStatus extends ConsentState {
  hasConsented: boolean;
  timestamp: string | null;
  version: string;
}

// Cookie name - must match server
const CONSENT_COOKIE_NAME = 'cookie_consent';

/**
 * Parse consent cookie from document.cookie
 */
function parseConsentCookie(): ConsentStatus | null {
  try {
    const cookies = document.cookie.split(';');
    const consentCookie = cookies.find(c => c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`));

    if (!consentCookie) return null;

    const value = consentCookie.split('=')[1];
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);

    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      hasConsented: true,
      timestamp: parsed.timestamp || null,
      version: parsed.version || '1.0',
    };
  } catch {
    return null;
  }
}

/**
 * Get default consent status (no consent given yet)
 */
function getDefaultConsent(): ConsentStatus {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    hasConsented: false,
    timestamp: null,
    version: '1.0',
  };
}

/**
 * Cookie consent hook
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(getDefaultConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize consent from cookie on mount
  useEffect(() => {
    const stored = parseConsentCookie();
    if (stored) {
      setConsent(stored);
      setShowBanner(false);
    } else {
      // Auto-accept all cookies if no consent stored
      acceptAll();
      setShowBanner(false);
    }
  }, [acceptAll]);

  // Update consent via API
  const updateConsentApi = useCallback(async (updates: Partial<ConsentState>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update consent');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setConsent(result.data);
        setShowBanner(false);
        setShowPreferences(false);

        // Dispatch custom event for analytics to listen to
        window.dispatchEvent(new CustomEvent('consentUpdated', {
          detail: result.data,
        }));
      }
    } catch (error) {
      console.error('[CookieConsent] Failed to update consent:', error);
      // Fall back to local cookie setting
      const newConsent: ConsentStatus = {
        necessary: true,
        analytics: updates.analytics ?? consent.analytics,
        marketing: updates.marketing ?? consent.marketing,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
      setConsent(newConsent);
      setShowBanner(false);
      setShowPreferences(false);
    } finally {
      setIsLoading(false);
    }
  }, [consent]);

  // Accept all cookies
  const acceptAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/compliance/consent/accept-all', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setConsent(result.data);
          setShowBanner(false);
          setShowPreferences(false);

          window.dispatchEvent(new CustomEvent('consentUpdated', {
            detail: result.data,
          }));
        }
      }
    } catch (error) {
      console.error('[CookieConsent] Failed to accept all:', error);
      // Fall back to setting locally
      setConsent({
        necessary: true,
        analytics: true,
        marketing: true,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
      });
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accept only necessary cookies
  const acceptNecessary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/compliance/consent/necessary-only', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setConsent(result.data);
          setShowBanner(false);
          setShowPreferences(false);

          window.dispatchEvent(new CustomEvent('consentUpdated', {
            detail: result.data,
          }));
        }
      }
    } catch (error) {
      console.error('[CookieConsent] Failed to set necessary only:', error);
      // Fall back to setting locally
      setConsent({
        necessary: true,
        analytics: false,
        marketing: false,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
      });
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update specific consent settings
  const updateConsent = useCallback((updates: Partial<ConsentState>) => {
    updateConsentApi(updates);
  }, [updateConsentApi]);

  // Open preferences modal
  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  // Close preferences modal
  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  // Hide banner without making a choice (user scrolled away, etc.)
  const hideBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Show banner again (for preference link in footer)
  const showBannerAgain = useCallback(() => {
    setShowBanner(true);
  }, []);

  return {
    // State
    consent,
    hasConsented: consent.hasConsented,
    showBanner,
    showPreferences,
    isLoading,

    // Actions
    acceptAll,
    acceptNecessary,
    updateConsent,
    openPreferences,
    closePreferences,
    hideBanner,
    showBannerAgain,
  };
}

/**
 * Utility to check if analytics consent is given
 */
export function hasAnalyticsConsent(): boolean {
  const consent = parseConsentCookie();
  return consent?.analytics ?? false;
}

/**
 * Utility to check if marketing consent is given
 */
export function hasMarketingConsent(): boolean {
  const consent = parseConsentCookie();
  return consent?.marketing ?? false;
}

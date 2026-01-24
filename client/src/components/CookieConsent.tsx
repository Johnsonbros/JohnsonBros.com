/**
 * Cookie Consent Banner Component
 *
 * GDPR/CCPA compliant cookie consent banner with preferences modal.
 */

import { useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';
import { Cookie, Shield, Settings } from 'lucide-react';

export function CookieConsent() {
  const {
    consent,
    showBanner,
    showPreferences,
    isLoading,
    acceptAll,
    acceptNecessary,
    updateConsent,
    openPreferences,
    closePreferences,
  } = useCookieConsent();

  // Local state for preferences modal
  const [localAnalytics, setLocalAnalytics] = useState(consent.analytics);
  const [localMarketing, setLocalMarketing] = useState(consent.marketing);

  // Update local state when consent changes
  useState(() => {
    setLocalAnalytics(consent.analytics);
    setLocalMarketing(consent.marketing);
  });

  // Handle save preferences
  const handleSavePreferences = () => {
    updateConsent({
      analytics: localAnalytics,
      marketing: localMarketing,
    });
  };

  // Reset local state when opening preferences
  const handleOpenPreferences = () => {
    setLocalAnalytics(consent.analytics);
    setLocalMarketing(consent.marketing);
    openPreferences();
  };

  if (!showPreferences) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg md:p-6"
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-johnson-blue/10 rounded-lg">
                  <Cookie className="w-6 h-6 text-johnson-blue" />
                </div>
                <div className="flex-1">
                  <h2
                    id="cookie-banner-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    We use cookies
                  </h2>
                  <p
                    id="cookie-banner-description"
                    className="mt-1 text-sm text-gray-600"
                  >
                    We use cookies to analyze site traffic and optimize your experience.
                    By clicking "Accept All", you consent to our use of cookies.
                    Learn more in our{' '}
                    <Link
                      href="/privacy-policy"
                      className="text-johnson-blue hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  onClick={acceptNecessary}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Necessary Only
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenPreferences}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
                <Button
                  onClick={acceptAll}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-johnson-blue hover:bg-johnson-blue/90"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <Dialog open={showPreferences} onOpenChange={closePreferences}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-johnson-blue" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="font-semibold text-gray-900">
                    Necessary Cookies
                  </Label>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                    Required
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Essential for site functionality. These cookies enable core features
                  like security, session management, and accessibility. Cannot be disabled.
                </p>
              </div>
              <Switch
                checked={true}
                disabled={true}
                aria-label="Necessary cookies (required)"
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <Label
                  htmlFor="analytics-toggle"
                  className="font-semibold text-gray-900 cursor-pointer"
                >
                  Analytics Cookies
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Help us understand how visitors use our site. We use this data to
                  improve our services and user experience. Data is anonymized.
                </p>
              </div>
              <Switch
                id="analytics-toggle"
                checked={localAnalytics}
                onCheckedChange={setLocalAnalytics}
                aria-label="Analytics cookies"
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <Label
                  htmlFor="marketing-toggle"
                  className="font-semibold text-gray-900 cursor-pointer"
                >
                  Marketing Cookies
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Used to deliver relevant advertisements and track campaign effectiveness.
                  May be set by our advertising partners.
                </p>
              </div>
              <Switch
                id="marketing-toggle"
                checked={localMarketing}
                onCheckedChange={setLocalMarketing}
                aria-label="Marketing cookies"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={closePreferences}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={isLoading}
              className="w-full sm:w-auto bg-johnson-blue hover:bg-johnson-blue/90"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Link component to open cookie preferences
 * Use this in footer or settings pages
 */
export function CookiePreferencesLink({
  className = '',
  children = 'Cookie Preferences',
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { showBannerAgain } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={showBannerAgain}
      className={`text-gray-400 hover:text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

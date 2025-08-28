import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, PhoneCall, CheckCircle, Clock, Sparkles } from "lucide-react";

export function VideoCallPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if user is on iPhone/iOS
    const isIOS = () => {
      return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ].includes(navigator.platform)
      || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    };

    // Check for test mode in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test-popup') === 'true';
    
    // Check if popup has already been shown this session
    const popupShown = sessionStorage.getItem('video-call-popup-shown');
    
    if (testMode && !hasShown) {
      // Test mode: show immediately
      setIsOpen(true);
      setHasShown(true);
    } else if (!popupShown && isIOS() && !hasShown) {
      // Production mode: Set timer for 38 seconds for iOS users
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('video-call-popup-shown', 'true');
      }, 38000);

      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  const handleStartVideoCall = () => {
    // Try FaceTime first for iOS devices
    const phoneNumber = '+16176868763';
    
    // Check if device supports FaceTime URL scheme
    if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
      // For iOS devices, try FaceTime
      window.location.href = `facetime://${phoneNumber}`;
    } else {
      // Fallback to regular phone call for non-iOS or if FaceTime fails
      window.location.href = `tel:${phoneNumber}`;
    }
    
    setIsOpen(false);
  };

  const handleScheduleCall = () => {
    // Open booking modal or navigate to booking
    const bookingButton = document.querySelector('[data-testid="button-emergency-booking"]');
    if (bookingButton) {
      (bookingButton as HTMLElement).click();
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] p-0 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 border-0 shadow-2xl" data-testid="video-call-popup">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 text-white">
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 opacity-20">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="absolute bottom-2 left-2 opacity-10">
            <Sparkles className="h-6 w-6" />
          </div>
          
          {/* Close button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
          
          {/* Main icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30 shadow-lg">
              <Video className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <DialogTitle className="text-center text-3xl font-bold mb-2">
            Need Help Right Now?
          </DialogTitle>
          <DialogDescription className="text-center text-xl text-blue-100">
            FaceTime with a Licensed Plumber!
          </DialogDescription>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Features section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-5 border border-blue-100 dark:border-blue-800/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg">
                First in Massachusetts to offer:
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/50 p-1 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-blue-800 dark:text-blue-200 font-medium">Instant video diagnostics to assess your problem</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/50 p-1 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-blue-800 dark:text-blue-200 font-medium">Professional advice from certified plumbers</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/50 p-1 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-blue-800 dark:text-blue-200 font-medium">Save time & money with quick visual assessment</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleStartVideoCall}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              size="lg"
              data-testid="button-start-video-call"
            >
              <PhoneCall className="mr-2 h-5 w-5" />
              <span className="font-semibold">FaceTime a Plumber Now</span>
            </Button>
            
            <Button 
              onClick={handleScheduleCall}
              variant="outline"
              className="w-full border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
              size="lg"
              data-testid="button-schedule-video-call"
            >
              <Clock className="mr-2 h-5 w-5" />
              Schedule a Video Consultation
            </Button>
            
            <Button 
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              data-testid="button-close-video-popup"
            >
              Maybe later
            </Button>
          </div>

          {/* Footer note */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
            <p className="text-sm text-center text-amber-800 dark:text-amber-200 font-medium flex items-center justify-center gap-2">
              <span className="text-lg">💡</span>
              <span>No other plumbing company in Massachusetts offers instant video support</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, PhoneCall, CheckCircle, Clock } from "lucide-react";

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

    // Check if popup has already been shown this session
    const popupShown = sessionStorage.getItem('video-call-popup-shown');
    
    if (!popupShown && isIOS() && !hasShown) {
      // Set timer for 38 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('video-call-popup-shown', 'true');
      }, 38000);

      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  const handleStartVideoCall = () => {
    // This would typically open FaceTime or initiate video call
    window.location.href = 'facetime://+14022058866'; // Replace with actual number
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
      <DialogContent className="sm:max-w-md" data-testid="video-call-popup">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Need Help Right Now?
          </DialogTitle>
          <DialogDescription className="text-center text-lg pt-2">
            FaceTime with a Licensed Plumber!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              First in Nebraska to offer:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Instant video diagnostics to assess your problem</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Professional advice from certified plumbers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Save time & money with quick visual assessment</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleStartVideoCall}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              data-testid="button-start-video-call"
            >
              <PhoneCall className="mr-2 h-5 w-5" />
              FaceTime a Plumber Now
            </Button>
            
            <Button 
              onClick={handleScheduleCall}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-schedule-video-call"
            >
              <Clock className="mr-2 h-5 w-5" />
              Schedule a Video Consultation
            </Button>
            
            <Button 
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="w-full text-gray-500"
              data-testid="button-close-video-popup"
            >
              Maybe later
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
            💡 No other plumbing company in Nebraska offers instant video support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
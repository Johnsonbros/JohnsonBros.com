import { useRef, useState, useEffect } from "react";
import plumberVideo from "@assets/Website video_1759942431968.mp4";
import { Card, CardContent } from "@/components/ui/card";

export function HeroVideoCard() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoInView, setVideoInView] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVideoInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="container mx-auto px-4 -mt-8 relative z-20 mb-12">
      <Card className="overflow-hidden shadow-2xl border-none rounded-2xl bg-johnson-blue">
        <CardContent className="p-0">
          <div ref={videoContainerRef} className="relative w-full aspect-video bg-gradient-to-br from-johnson-blue to-johnson-teal">
            {!videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-white/70">Loading professional service preview...</p>
                </div>
              </div>
            )}
            {videoInView && (
              <video 
                src={plumberVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                onLoadedData={() => setVideoLoaded(true)}
                onCanPlay={() => setVideoLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                aria-label="Professional plumber at work"
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
               <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 text-white">
                  <p className="text-xs uppercase tracking-wider font-bold opacity-80">Now Serving</p>
                  <p className="text-sm font-semibold">Quincy & South Shore MA</p>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Phone, Calendar, Home, MessageSquare, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileBottomNavProps {
  onBookService?: () => void;
}

export default function MobileBottomNav({ onBookService }: MobileBottomNavProps) {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] lg:hidden z-50 pb-safe">
      <div className="flex items-center justify-around py-2 px-2">
        {/* Home Button */}
        <Link
          href="/"
          className={`group flex flex-col items-center justify-center min-w-[64px] py-1.5 touch-manipulation rounded-xl transition-all duration-300 ${
            location === "/" 
              ? "bg-johnson-blue text-white shadow-lg shadow-johnson-blue/20 scale-105" 
              : "text-gray-500 hover:bg-gray-50 active:scale-95"
          }`}
          data-testid="bottom-nav-home"
        >
          <div className="relative">
            <Home className={`h-5 w-5 transition-transform duration-300 ${location === "/" ? "scale-110" : "group-hover:scale-110"}`} />
            {location === "/" && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight uppercase ${location === "/" ? "text-white" : "text-gray-500"}`}>
            Home
          </span>
        </Link>

        {/* Book Button - Flashy */}
        <button
          onClick={onBookService}
          className="group relative flex flex-col items-center justify-center min-w-[72px] py-2 touch-manipulation rounded-xl transition-all duration-300 bg-johnson-blue text-white shadow-[0_0_15px_rgba(32,128,205,0.4)] scale-110 active:scale-95 animate-pulse-slow overflow-hidden"
          data-testid="bottom-nav-book"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-fast" />
          <Calendar className="h-5 w-5 text-white group-hover:scale-110 transition-transform relative z-10" />
          <span className="text-[10px] mt-1 text-white font-black tracking-widest uppercase relative z-10">Book</span>
        </button>

        {/* Call Button - Flashy */}
        <a
          href="tel:6174799911"
          className="group relative flex flex-col items-center justify-center min-w-[72px] py-2 touch-manipulation rounded-xl transition-all duration-300 bg-johnson-orange text-white shadow-[0_0_15px_rgba(255,165,0,0.4)] active:scale-95 overflow-hidden"
          data-testid="bottom-nav-call"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-fast" />
          <div className="p-0.5 rounded-lg relative z-10">
            <Phone className="h-5 w-5 text-white animate-bounce-subtle" />
          </div>
          <span className="text-[10px] mt-0.5 text-white font-black tracking-widest uppercase relative z-10">Call</span>
        </a>

        {/* Referral Button */}
        <Link
          href="/referral"
          className={`group flex flex-col items-center justify-center min-w-[64px] py-1.5 touch-manipulation rounded-xl transition-all duration-300 ${
            location === "/referral" 
              ? "bg-johnson-blue text-white shadow-lg shadow-johnson-blue/20 scale-105" 
              : "text-gray-500 hover:bg-gray-50 active:scale-95"
          }`}
          data-testid="bottom-nav-referral"
        >
          <Gift className={`h-5 w-5 transition-transform duration-300 ${location === "/referral" ? "scale-110" : "group-hover:scale-110"}`} />
          <span className={`text-[10px] mt-1 font-bold tracking-tight uppercase ${location === "/referral" ? "text-white" : "text-gray-500"}`}>
            Referral
          </span>
        </Link>

        {/* Contact Button */}
        <Link
          href="/contact"
          className={`group flex flex-col items-center justify-center min-w-[64px] py-1.5 touch-manipulation rounded-xl transition-all duration-300 ${
            location === "/contact" 
              ? "bg-johnson-blue text-white shadow-lg shadow-johnson-blue/20 scale-105" 
              : "text-gray-500 hover:bg-gray-50 active:scale-95"
          }`}
          data-testid="bottom-nav-contact"
        >
          <MessageSquare className={`h-5 w-5 transition-transform duration-300 ${location === "/contact" ? "scale-110" : "group-hover:scale-110"}`} />
          <span className={`text-[10px] mt-1 font-bold tracking-tight uppercase ${location === "/contact" ? "text-white" : "text-gray-500"}`}>
            Contact
          </span>
        </Link>
      </div>
    </div>
  );
}
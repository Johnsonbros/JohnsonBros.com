import { Phone, Calendar, Home, MessageSquare, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileBottomNavProps {
  onBookService?: () => void;
}

export default function MobileBottomNav({ onBookService }: MobileBottomNavProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.15)] lg:hidden z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {/* Home Button */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all duration-200 ${
            isActive("/") 
              ? "text-johnson-blue" 
              : "text-gray-500 hover:text-gray-700"
          }`}
          data-testid="bottom-nav-home"
        >
          <Home className={`h-5 w-5 ${isActive("/") ? "stroke-[2.5]" : ""}`} />
          <span className={`text-[10px] mt-0.5 font-semibold uppercase tracking-wide ${isActive("/") ? "text-johnson-blue" : "text-gray-500"}`}>
            Home
          </span>
        </Link>

        {/* Book Button */}
        <button
          onClick={onBookService}
          className="flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-700 active:scale-95"
          data-testid="bottom-nav-book"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-semibold uppercase tracking-wide text-gray-500">
            Book
          </span>
        </button>

        {/* CALL Button - Hero Center */}
        <a
          href="tel:6174799911"
          className="relative flex flex-col items-center justify-center -mt-8 transition-all duration-300 active:scale-95"
          data-testid="bottom-nav-call"
        >
          {/* Outer glow ring */}
          <div className="absolute inset-0 -m-1 bg-johnson-orange/30 rounded-full blur-md animate-pulse" />
          
          {/* Main button circle */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-johnson-orange to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 ring-4 ring-white">
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            </div>
            <Phone className="h-7 w-7 text-white relative z-10" />
          </div>
          
          {/* Label */}
          <span className="text-[10px] mt-2 font-bold uppercase tracking-wider text-johnson-orange bg-white px-1 rounded-sm">
            Call
          </span>
        </a>

        {/* Referral Button */}
        <Link
          href="/referral"
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all duration-200 ${
            isActive("/referral") 
              ? "text-johnson-blue" 
              : "text-gray-500 hover:text-gray-700"
          }`}
          data-testid="bottom-nav-referral"
        >
          <Gift className={`h-5 w-5 ${isActive("/referral") ? "stroke-[2.5]" : ""}`} />
          <span className={`text-[10px] mt-0.5 font-semibold uppercase tracking-wide ${isActive("/referral") ? "text-johnson-blue" : "text-gray-500"}`}>
            Referral
          </span>
        </Link>

        {/* Contact Button */}
        <Link
          href="/contact"
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all duration-200 ${
            isActive("/contact") 
              ? "text-johnson-blue" 
              : "text-gray-500 hover:text-gray-700"
          }`}
          data-testid="bottom-nav-contact"
        >
          <MessageSquare className={`h-5 w-5 ${isActive("/contact") ? "stroke-[2.5]" : ""}`} />
          <span className={`text-[10px] mt-0.5 font-semibold uppercase tracking-wide ${isActive("/contact") ? "text-johnson-blue" : "text-gray-500"}`}>
            Contact
          </span>
        </Link>
      </div>
    </div>
  );
}

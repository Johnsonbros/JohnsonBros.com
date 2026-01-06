import { Phone, Calendar, Home, MessageSquare, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileBottomNavProps {
  onBookService?: () => void;
}

export default function MobileBottomNav({ onBookService }: MobileBottomNavProps) {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {/* Home Button */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation rounded-lg transition-colors ${
            location === "/" ? "bg-johnson-blue/10" : "hover:bg-gray-50"
          }`}
          data-testid="bottom-nav-home"
        >
          <Home
            className={`h-5 w-5 ${
              location === "/" ? "text-johnson-blue" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs mt-1 font-medium ${
              location === "/" ? "text-johnson-blue" : "text-gray-700"
            }`}
          >
            Home
          </span>
        </Link>

        {/* Book Button */}
        <button
          onClick={onBookService}
          className="flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation hover:bg-gray-50 rounded-lg transition-colors"
          data-testid="bottom-nav-book"
        >
          <Calendar className="h-5 w-5 text-johnson-blue" />
          <span className="text-xs mt-1 text-gray-700 font-medium">Book</span>
        </button>

        {/* Call Button */}
        <a
          href="tel:6174799911"
          className="flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation hover:bg-gray-50 rounded-lg transition-colors"
          data-testid="bottom-nav-call"
        >
          <Phone className="h-5 w-5 text-johnson-blue" />
          <span className="text-xs mt-1 text-gray-700 font-medium">Call</span>
        </a>

        {/* Referral Button */}
        <Link
          href="/referral"
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation rounded-lg transition-colors ${
            location === "/referral" ? "bg-johnson-blue/10" : "hover:bg-gray-50"
          }`}
          data-testid="bottom-nav-referral"
        >
          <Gift
            className={`h-5 w-5 ${
              location === "/referral" ? "text-johnson-blue" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs mt-1 font-medium ${
              location === "/referral" ? "text-johnson-blue" : "text-gray-700"
            }`}
          >
            Referral
          </span>
        </Link>

        {/* Contact Button */}
        <Link
          href="/contact"
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation rounded-lg transition-colors ${
            location === "/contact" ? "bg-johnson-blue/10" : "hover:bg-gray-50"
          }`}
          data-testid="bottom-nav-contact"
        >
          <MessageSquare
            className={`h-5 w-5 ${
              location === "/contact" ? "text-johnson-blue" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs mt-1 font-medium ${
              location === "/contact" ? "text-johnson-blue" : "text-gray-700"
            }`}
          >
            Contact
          </span>
        </Link>
      </div>
    </div>
  );
}
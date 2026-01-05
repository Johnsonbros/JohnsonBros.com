import { Phone, Calendar, Home, MessageSquare, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileBottomNavProps {
  onBookService?: () => void;
  onMoreClick?: () => void;
}

export default function MobileBottomNav({ onBookService, onMoreClick }: MobileBottomNavProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/", testId: "bottom-nav-home" },
    { icon: Calendar, label: "Book", action: onBookService, testId: "bottom-nav-book" },
    { icon: Phone, label: "Call", href: "tel:6174799911", testId: "bottom-nav-call" },
    { icon: MessageSquare, label: "Contact", path: "/contact", testId: "bottom-nav-contact" },
    { icon: MoreHorizontal, label: "More", action: onMoreClick, testId: "bottom-nav-more" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation hover:bg-gray-50 rounded-lg transition-colors"
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5 text-johnson-blue" />
                <span className="text-xs mt-1 text-gray-700 font-medium">{item.label}</span>
              </button>
            );
          }

          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation hover:bg-gray-50 rounded-lg transition-colors"
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5 text-johnson-blue" />
                <span className="text-xs mt-1 text-gray-700 font-medium">{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.path!}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-1 touch-manipulation rounded-lg transition-colors ${
                isActive
                  ? "bg-johnson-blue/10"
                  : "hover:bg-gray-50"
              }`}
              data-testid={item.testId}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-johnson-blue" : "text-gray-600"
                }`}
              />
              <span
                className={`text-xs mt-1 font-medium ${
                  isActive ? "text-johnson-blue" : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
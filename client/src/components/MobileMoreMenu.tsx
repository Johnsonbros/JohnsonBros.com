import { X, Wrench, MapPin, BookOpen, Users, Gift, Info, Phone, Shield, Flame, Droplets, AlertTriangle, HardHat, Home, Zap } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef } from "react";

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PageCard {
  title: string;
  href: string;
  icon: typeof Wrench;
  color: string;
}

interface PageCategory {
  name: string;
  icon: typeof Wrench;
  pages: PageCard[];
}

const pageCategories: PageCategory[] = [
  {
    name: "Services",
    icon: Wrench,
    pages: [
      { title: "Emergency Plumbing", href: "/services/emergency-plumbing", icon: AlertTriangle, color: "bg-red-500" },
      { title: "Drain Cleaning", href: "/services/drain-cleaning", icon: Droplets, color: "bg-blue-500" },
      { title: "Water Heater", href: "/services/water-heater", icon: Flame, color: "bg-orange-500" },
      { title: "Pipe Repair", href: "/services/pipe-repair", icon: Wrench, color: "bg-purple-500" },
      { title: "General Plumbing", href: "/services/general-plumbing", icon: Home, color: "bg-teal-500" },
      { title: "New Construction", href: "/services/new-construction", icon: HardHat, color: "bg-amber-500" },
      { title: "Gas & Heat", href: "/services/gas-heat", icon: Flame, color: "bg-red-600" },
    ],
  },
  {
    name: "Service Areas",
    icon: MapPin,
    pages: [
      { title: "Quincy, MA", href: "/service-areas/quincy", icon: MapPin, color: "bg-johnson-blue" },
      { title: "Braintree, MA", href: "/service-areas/braintree", icon: MapPin, color: "bg-johnson-blue" },
      { title: "Weymouth, MA", href: "/service-areas/weymouth", icon: MapPin, color: "bg-johnson-blue" },
      { title: "Plymouth, MA", href: "/service-areas/plymouth", icon: MapPin, color: "bg-johnson-blue" },
      { title: "Marshfield, MA", href: "/service-areas/marshfield", icon: MapPin, color: "bg-johnson-blue" },
      { title: "Hingham, MA", href: "/service-areas/hingham", icon: MapPin, color: "bg-johnson-blue" },
    ],
  },
  {
    name: "Resources",
    icon: BookOpen,
    pages: [
      { title: "Blog", href: "/blog", icon: BookOpen, color: "bg-indigo-500" },
      { title: "Family Discount", href: "/family-discount", icon: Gift, color: "bg-green-500" },
      { title: "Referral Program", href: "/referral", icon: Users, color: "bg-pink-500" },
      { title: "About Us", href: "/about", icon: Info, color: "bg-gray-600" },
      { title: "Contact", href: "/contact", icon: Phone, color: "bg-johnson-orange" },
      { title: "My Plan", href: "/my-plan", icon: Shield, color: "bg-emerald-500" },
    ],
  },
];

export default function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid="more-menu-backdrop"
      />
      
      <div 
        ref={menuRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        data-testid="more-menu-container"
      >
        <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Browse Pages</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
            data-testid="more-menu-close"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-60px)] pb-20">
          {pageCategories.map((category) => (
            <div key={category.name} className="py-4">
              <div className="px-4 mb-3 flex items-center gap-2">
                <category.icon className="h-5 w-5 text-johnson-blue" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {category.name}
                </h3>
              </div>
              
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
                  {category.pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      onClick={onClose}
                      className="flex-shrink-0 w-28 touch-manipulation"
                      data-testid={`more-menu-card-${page.href.replace(/\//g, '-')}`}
                    >
                      <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors border border-gray-100 hover:border-gray-200 hover:shadow-md active:scale-95 transition-transform">
                        <div className={`${page.color} w-10 h-10 rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                          <page.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-xs font-medium text-gray-800 text-center leading-tight line-clamp-2">
                          {page.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          <div className="px-4 py-4 border-t bg-gray-50">
            <a
              href="tel:6174799911"
              className="flex items-center justify-center gap-2 bg-johnson-blue text-white py-3 px-4 rounded-xl font-bold hover:bg-johnson-teal transition-colors touch-manipulation"
              data-testid="more-menu-call-button"
            >
              <Phone className="h-5 w-5" />
              Call (617) 479-9911
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

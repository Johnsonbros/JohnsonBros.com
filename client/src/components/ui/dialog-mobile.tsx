"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, ChevronLeft } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface MobileDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  title?: string;
  fullScreen?: boolean;
}

const MobileDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  MobileDialogContentProps
>(({ className, children, hideCloseButton = false, onBack, showBackButton = false, title, fullScreen = true, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle swipe gestures for mobile - only on the header, not the content
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const target = e.target as HTMLElement;
    const header = target.closest('[data-dialog-header]');
    if (!header) return;
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - startY;
    
    if (deltaY > 0) {
      setCurrentY(deltaY);
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    setIsDragging(false);
    
    if (currentY > 150) {
      const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
      closeButton?.click();
    } else {
      if (contentRef.current) {
        contentRef.current.style.transform = '';
      }
    }
    setCurrentY(0);
  };

  const mobileStyles = isMobile && fullScreen 
    ? "fixed inset-0 w-full h-full max-w-full rounded-none p-0 flex flex-col" 
    : "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-lg";

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        className={cn(
          "z-50 bg-background shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          isMobile 
            ? "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom" 
            : "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          mobileStyles,
          !isMobile && "gap-4 border p-6 sm:rounded-lg",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.pac-container') || target.closest('.pac-item')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.pac-container') || target.closest('.pac-item')) {
            e.preventDefault();
          }
        }}
        {...props}
      >
        {isMobile && fullScreen ? (
          <>
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-background border-b px-4 py-3 flex-shrink-0" data-dialog-header>
              {showBackButton && onBack ? (
                <button
                  onClick={onBack}
                  className="p-2 -ml-2 rounded-full hover:bg-accent"
                  data-testid="dialog-back-button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="w-9" />
              )}
              
              {title && (
                <h2 className="text-lg font-semibold flex-1 text-center mx-2">{title}</h2>
              )}
              
              {!hideCloseButton && (
                <DialogPrimitive.Close 
                  className="p-2 -mr-2 rounded-full hover:bg-accent"
                  data-dialog-close
                  data-testid="dialog-close-button"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </div>

            {/* Swipe Indicator */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 pb-6">
              {children}
            </div>
          </>
        ) : (
          <>
            {children}
            {!hideCloseButton && (
              <DialogPrimitive.Close 
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                data-dialog-close
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
MobileDialogContent.displayName = "MobileDialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  MobileDialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
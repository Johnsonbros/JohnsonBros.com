import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "brand-primary":
          "bg-gradient-to-r from-johnson-blue to-johnson-teal text-white font-semibold shadow-lg hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105",
        "brand-accent":
          "bg-gradient-to-r from-johnson-orange to-orange-500 text-white font-bold shadow-lg hover:from-orange-500 hover:to-johnson-orange transition-all duration-300 transform hover:scale-105",
        "brand-outline":
          "border-2 border-johnson-blue text-johnson-blue bg-white font-bold shadow-lg hover:bg-gray-50 hover:border-johnson-teal transition-all duration-300 transform hover:scale-105",
        "brand-outline-accent":
          "border-2 border-johnson-orange text-johnson-orange bg-white font-semibold hover:bg-johnson-orange hover:text-white transition-all duration-300",
        "brand-urgent":
          "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 animate-pulse",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-6 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

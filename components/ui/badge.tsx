import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Variantes base
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success:
          "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80 font-medium",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",

        // Variantes para OrderFinancialStatus
        pending: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        authorized: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        partially_paid: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100/80",
        paid: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        partially_refunded: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80",
        refunded: "border-transparent bg-pink-100 text-pink-800 hover:bg-pink-100/80",
        voided: "border-transparent bg-red-100 text-red-800 hover:bg-red-100/80",

        // Variantes para OrderFulfillmentStatus
        unfulfilled: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-100/80",
        partially_fulfilled: "border-transparent bg-teal-100 text-teal-800 hover:bg-teal-100/80",
        fulfilled: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        restocked: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        pending_fulfillment: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        open: "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-100/80",
        in_progress: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100/80",
        on_hold: "border-transparent bg-red-100 text-red-800 hover:bg-red-100/80",
        scheduled: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
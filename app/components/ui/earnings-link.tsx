import Link from "next/link";
import { cn } from "@/app/lib/utils";

interface EarningsLinkProps {
  variant?: "dashboard" | "profile" | "minimal";
  className?: string;
}

export function EarningsLink({ 
  variant = "dashboard", 
  className 
}: EarningsLinkProps) {
  const styles = {
    dashboard: "text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 p-2 rounded-md border border-primary/20 transition-colors",
    profile: "text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 p-1 rounded-md transition-colors",
    minimal: "text-sm text-primary hover:text-primary/80 flex items-center gap-1"
  };

  return (
    <Link 
      href="/dashboard/earnings" 
      className={cn(styles[variant], className)}
      data-testid="earnings-link"
      aria-label="View your detailed earnings and payout history"
    >
      <span>
        {variant === "minimal" ? "Earnings" : "View detailed earnings & payouts"}
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>
    </Link>
  );
}

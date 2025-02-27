import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { CheckCircledIcon } from "@radix-ui/react-icons";

interface SuccessMessageProps {
  title?: string;
  message?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function SuccessMessage({
  title = "Purchase Successful!",
  message = "Thank you for your purchase. You can now access this lesson in your library.",
  ctaText = "View My Lessons",
  ctaHref = "/my-lessons"
}: SuccessMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="success-message">
      <div className="mb-6 text-green-500">
        <CheckCircledIcon className="h-16 w-16" />
      </div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground mb-8 max-w-md">{message}</p>
      <Button asChild>
        <Link href={ctaHref}>{ctaText}</Link>
      </Button>
    </div>
  );
}

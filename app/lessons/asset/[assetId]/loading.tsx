import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto py-8 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-lg">Checking video status...</p>
    </div>
  );
}

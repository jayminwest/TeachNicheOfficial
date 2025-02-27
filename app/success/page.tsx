import { Suspense } from "react";
import SuccessContent from "./success-content";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

import Link from "next/link";

export default function LessonNotFound() {
  return (
    <div className="container mx-auto py-8">
      <div 
        className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg" 
        data-testid="error-message"
      >
        The lesson you&apos;re looking for doesn&apos;t exist or has been removed.
      </div>
      <Link href="/lessons" className="text-primary hover:underline">
        Browse available lessons
      </Link>
    </div>
  );
}

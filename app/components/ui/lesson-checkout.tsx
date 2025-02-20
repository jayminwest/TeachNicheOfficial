'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
  searchParams?: URLSearchParams;
}

export function LessonCheckout({ lessonId, price, searchParams }: LessonCheckoutProps) {
  const isSuccess = searchParams?.get('success') === 'true';
  const isCanceled = searchParams?.get('canceled') === 'true';

  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    
    // Create checkout session and redirect
    const stripe = await stripePromise;
    if (!stripe) return;

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessonId,
        price,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      setError(data.error);
      return;
    }

    await stripe.redirectToCheckout({ sessionId: data.sessionId });
  };

  if (isSuccess) {
    return (
      <div className="text-green-600 font-medium">
        Payment Successful
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      <Button onClick={handleCheckout}>
        Purchase Lesson
      </Button>
    </div>
  );
}

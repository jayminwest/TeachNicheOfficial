'use client';

import { useStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
}

export function LessonCheckout({ lessonId, price }: LessonCheckoutProps) {
  const stripe = useStripe();

  const handleCheckout = async () => {
    if (!stripe) return;

    // Create checkout session and redirect
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

    const { sessionId } = await response.json();
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <Button onClick={handleCheckout}>
      Purchase Lesson
    </Button>
  );
}

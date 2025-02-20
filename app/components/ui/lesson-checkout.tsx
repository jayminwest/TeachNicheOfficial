'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
}

export function LessonCheckout({ lessonId, price }: LessonCheckoutProps) {

  const handleCheckout = async () => {
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

    const { sessionId } = await response.json();
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <Button onClick={handleCheckout}>
      Purchase Lesson
    </Button>
  );
}

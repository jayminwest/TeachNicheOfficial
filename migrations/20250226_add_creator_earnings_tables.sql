-- Create creator_earnings table
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  payment_intent_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payout_id UUID REFERENCES public.creator_payouts(id)
);

-- Create creator_payouts table
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  payout_id TEXT NOT NULL,
  destination_last_four TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creator_payout_methods table
CREATE TABLE IF NOT EXISTS public.creator_payout_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  bank_account_token TEXT NOT NULL,
  last_four TEXT NOT NULL,
  bank_name TEXT,
  account_holder_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(creator_id)
);

-- Create function to mark earnings as paid
CREATE OR REPLACE FUNCTION mark_creator_earnings_as_paid(
  creator_id UUID,
  payout_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.creator_earnings
  SET status = 'paid', payout_id = $2, updated_at = NOW()
  WHERE creator_id = $1 AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create function to get creators eligible for payout
CREATE OR REPLACE FUNCTION get_creators_eligible_for_payout(
  minimum_amount INTEGER
) RETURNS TABLE (
  creator_id UUID,
  pending_amount BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.creator_id,
    SUM(e.amount)::INTEGER AS pending_amount
  FROM 
    public.creator_earnings e
  WHERE 
    e.status = 'pending'
  GROUP BY 
    e.creator_id
  HAVING 
    SUM(e.amount) >= minimum_amount;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_id ON public.creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_status ON public.creator_earnings(status);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_payment_intent_id ON public.creator_earnings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON public.creator_payouts(status);

-- Migration: Current Schema as of 2025-02-26
-- Description: This migration captures the current state of the database schema

-- Create custom types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_status') THEN
        CREATE TYPE lesson_status AS ENUM ('draft', 'published', 'archived');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
        CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
END $$;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    creator_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    content TEXT,
    content_url TEXT,
    thumbnail_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status lesson_status NOT NULL DEFAULT 'draft',
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    mux_asset_id TEXT,
    mux_playback_id TEXT
);

-- Lesson-Category junction table
CREATE TABLE IF NOT EXISTS lesson_category (
    lesson_id UUID NOT NULL REFERENCES lessons(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    PRIMARY KEY (lesson_id, category_id)
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    social_media_tag TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    stripe_account_id TEXT,
    deleted_at TIMESTAMPTZ
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    stripe_session_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL,
    creator_earnings NUMERIC NOT NULL,
    payment_intent_id TEXT NOT NULL,
    fee_percentage NUMERIC NOT NULL,
    status purchase_status NOT NULL DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lesson Requests table
CREATE TABLE IF NOT EXISTS lesson_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID,
    status TEXT DEFAULT 'open',
    vote_count INTEGER DEFAULT 0,
    category TEXT,
    tags TEXT[],
    instagram_handle TEXT
);

-- Lesson Request Votes table
CREATE TABLE IF NOT EXISTS lesson_request_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES lesson_requests(id),
    user_id UUID,
    vote_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Creator Earnings table
CREATE TABLE IF NOT EXISTS creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    payment_intent_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    lesson_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    payout_id UUID
);

-- Creator Payout Methods table
CREATE TABLE IF NOT EXISTS creator_payout_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    bank_account_token TEXT NOT NULL,
    last_four TEXT NOT NULL,
    bank_name TEXT,
    account_holder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_default BOOLEAN NOT NULL DEFAULT true
);

-- Creator Payouts table
CREATE TABLE IF NOT EXISTS creator_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payout_id TEXT NOT NULL,
    destination_last_four TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    signed_up_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_creator_id ON lessons(creator_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_lesson_id ON purchases(lesson_id);
CREATE INDEX IF NOT EXISTS idx_purchases_creator_id ON purchases(creator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_lesson_id ON reviews(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_user_id ON lesson_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_category ON lesson_requests(category);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_id ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_lesson_id ON creator_earnings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_creator_payout_methods_creator_id ON creator_payout_methods(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_id ON creator_payouts(creator_id);

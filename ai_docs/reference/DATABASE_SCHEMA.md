# Database Schema Reference

This document provides a comprehensive reference for the database schema used in the Teach Niche platform.

## Overview

The Teach Niche platform uses PostgreSQL as its primary database, managed through Supabase. The schema is designed to support:

- User authentication and profiles
- Lesson creation and management
- Payment processing and earnings tracking
- Creator payouts
- Analytics and reporting

## Core Tables

### profiles

Stores user profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, matches auth.users.id |
| full_name | TEXT | User's full name |
| email | TEXT | User's email address |
| bio | TEXT | User's biography (optional) |
| avatar_url | TEXT | URL to user's profile image |
| social_media_tag | TEXT | Social media handle (optional) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp (optional) |

### lessons

Stores lesson information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Lesson title |
| description | TEXT | Lesson description |
| price | NUMERIC | Lesson price in cents |
| creator_id | UUID | Foreign key to profiles.id |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| stripe_product_id | TEXT | Stripe product ID |
| stripe_price_id | TEXT | Stripe price ID |
| content | TEXT | Lesson content in markdown |
| content_url | TEXT | URL to external content (optional) |
| thumbnail_url | TEXT | URL to lesson thumbnail |
| is_featured | BOOLEAN | Whether lesson is featured |
| status | lesson_status | Status: draft, published, archived |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp (optional) |
| version | INTEGER | Content version number |
| mux_asset_id | TEXT | Mux video asset ID |
| mux_playback_id | TEXT | Mux video playback ID |

### categories

Stores lesson categories.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Category name |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### lesson_category

Junction table for lessons and categories (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| lesson_id | UUID | Foreign key to lessons.id |
| category_id | UUID | Foreign key to categories.id |

### purchases

Stores lesson purchase information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles.id |
| lesson_id | UUID | Foreign key to lessons.id |
| creator_id | UUID | Foreign key to profiles.id |
| purchase_date | TIMESTAMPTZ | Purchase timestamp |
| stripe_session_id | TEXT | Stripe checkout session ID |
| amount | NUMERIC | Purchase amount in cents |
| platform_fee | NUMERIC | Platform fee amount in cents |
| creator_earnings | NUMERIC | Creator earnings amount in cents |
| payment_intent_id | TEXT | Stripe payment intent ID |
| fee_percentage | NUMERIC | Platform fee percentage applied |
| status | purchase_status | Status: pending, completed, failed, refunded |
| metadata | JSONB | Additional purchase metadata |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| version | INTEGER | Record version number |

### reviews

Stores lesson reviews.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles.id |
| lesson_id | UUID | Foreign key to lessons.id |
| rating | INTEGER | Rating (1-5) |
| comment | TEXT | Review comment |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Payment and Earnings Tables

### creator_earnings

Tracks earnings for creators from lesson purchases.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| creator_id | UUID | Foreign key to profiles.id |
| payment_intent_id | TEXT | Stripe payment intent ID |
| amount | INTEGER | Earnings amount in cents |
| lesson_id | UUID | Foreign key to lessons.id |
| status | TEXT | Status: pending, paid |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| payout_id | UUID | Foreign key to creator_payouts.id (optional) |

### creator_payout_methods

Stores creator bank account information for payouts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| creator_id | UUID | Foreign key to profiles.id |
| bank_account_token | TEXT | Stripe bank account token |
| last_four | TEXT | Last four digits of account number |
| bank_name | TEXT | Bank name (optional) |
| account_holder_name | TEXT | Account holder name |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| is_default | BOOLEAN | Whether this is the default payout method |

### creator_payouts

Tracks payouts to creators.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| creator_id | UUID | Foreign key to profiles.id |
| amount | INTEGER | Payout amount in cents |
| status | TEXT | Status: pending, completed, failed |
| payout_id | TEXT | Stripe payout ID |
| destination_last_four | TEXT | Last four digits of destination account |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Feature-Specific Tables

### lesson_requests

Stores user requests for lessons on specific topics.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Request title |
| description | TEXT | Request description |
| created_at | TIMESTAMPTZ | Creation timestamp |
| user_id | UUID | Foreign key to profiles.id |
| status | TEXT | Status: open, in_progress, completed |
| vote_count | INTEGER | Number of votes |
| category | TEXT | Requested category |
| tags | TEXT[] | Array of tags |
| instagram_handle | TEXT | Instagram handle (optional) |

### lesson_request_votes

Tracks votes on lesson requests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| request_id | UUID | Foreign key to lesson_requests.id |
| user_id | UUID | Foreign key to profiles.id |
| vote_type | TEXT | Vote type |
| created_at | TIMESTAMPTZ | Creation timestamp |

### waitlist

Stores email addresses for the waitlist.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Email address |
| signed_up_at | TIMESTAMPTZ | Signup timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Custom Types

### lesson_status

Enum type for lesson status.

| Value | Description |
|-------|-------------|
| draft | Lesson is in draft mode |
| published | Lesson is published and available |
| archived | Lesson is archived and not available |

### purchase_status

Enum type for purchase status.

| Value | Description |
|-------|-------------|
| pending | Payment is pending |
| completed | Payment is completed |
| failed | Payment failed |
| refunded | Payment was refunded |

## Database Functions

### get_user_purchases(user_id UUID)

Returns all purchases for a specific user.

### check_lesson_access(user_id UUID, lesson_id UUID)

Checks if a user has access to a specific lesson.

### mark_creator_earnings_as_paid(creator_id UUID, payout_id UUID)

Updates creator earnings records to mark them as paid.

### get_creators_eligible_for_payout(minimum_amount INTEGER)

Returns creators who have pending earnings above the minimum amount.

## Indexes

| Table | Index Name | Columns | Description |
|-------|------------|---------|-------------|
| lessons | idx_lessons_creator_id | creator_id | Improves queries filtering by creator |
| purchases | idx_purchases_user_id | user_id | Improves queries filtering by user |
| purchases | idx_purchases_lesson_id | lesson_id | Improves queries filtering by lesson |
| purchases | idx_purchases_creator_id | creator_id | Improves queries filtering by creator |
| reviews | idx_reviews_lesson_id | lesson_id | Improves queries filtering by lesson |
| creator_earnings | idx_creator_earnings_creator_id | creator_id | Improves queries filtering by creator |
| creator_earnings | idx_creator_earnings_lesson_id | lesson_id | Improves queries filtering by lesson |
| creator_payout_methods | idx_creator_payout_methods_creator_id | creator_id | Improves queries filtering by creator |
| creator_payouts | idx_creator_payouts_creator_id | creator_id | Improves queries filtering by creator |

## Database Migrations

Database migrations are managed through SQL files in the `migrations/` directory. Each migration is applied in order based on the timestamp prefix.

Example migration file: `migrations/20250226_current_schema.sql`

## Security Considerations

- Row-level security (RLS) policies are applied to all tables
- Public access is restricted to specific views and functions
- Sensitive data is protected by appropriate policies
- Database roles are used to enforce access control

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Database Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*

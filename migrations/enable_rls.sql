BEGIN;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lessons" 
ON lessons FOR SELECT 
USING (status = 'published');

CREATE POLICY "Creators can manage their own lessons" 
ON lessons FOR ALL 
USING (auth.uid() = creator_id);

COMMIT;

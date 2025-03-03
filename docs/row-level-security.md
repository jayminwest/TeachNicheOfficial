# Row Level Security (RLS) Implementation

## Core Policies

### Lessons Table
- **Published Lessons**: `CREATE POLICY "Anyone can view published lessons" ON lessons FOR SELECT USING (status = 'published');`
- **Creator Access**: `CREATE POLICY "Creators can manage their own lessons" ON lessons FOR ALL USING (auth.uid() = creator_id);`

### Categories Table  
- **View Access**: `CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);`
- **Admin Modifications**: `CREATE POLICY "Only admins can modify categories" ON categories FOR INSERT UPDATE DELETE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));`

## Development Guidelines

1. Always use authenticated clients
2. RLS policies auto-apply to all queries
3. Test with both user roles (creator/student/admin)
4. Use service roles only for migrations

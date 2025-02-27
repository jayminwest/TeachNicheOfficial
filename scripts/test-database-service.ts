import dotenv from 'dotenv';
import { CloudSqlDatabase } from '../app/services/database/cloud-sql';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testDatabaseService() {
  console.log('Testing CloudSqlDatabase service...');
  
  try {
    // Create database service instance
    const db = new CloudSqlDatabase();
    
    // Test basic query
    console.log('\nTesting basic query...');
    const { rows: testRows } = await db.query('SELECT NOW() as current_time');
    console.log('Current database time:', testRows[0].current_time);
    
    // Test getCategories
    console.log('\nTesting getCategories()...');
    const categories = await db.getCategories();
    console.log(`Retrieved ${categories.length} categories`);
    if (categories.length > 0) {
      console.log('Sample category:', categories[0]);
    } else {
      console.log('No categories found. You may want to seed some test data.');
    }
    
    // Test getLessons
    console.log('\nTesting getLessons()...');
    const lessons = await db.getLessons(5, 0);
    console.log(`Retrieved ${lessons.length} lessons`);
    if (lessons.length > 0) {
      console.log('Sample lesson:', lessons[0]);
    } else {
      console.log('No lessons found. You may want to seed some test data.');
    }
    
    // Test table existence
    console.log('\nTesting table existence...');
    const tables = [
      'categories',
      'profiles',
      'lessons',
      'lesson_category',
      'purchases',
      'reviews',
      'creator_applications',
      'creator_earnings',
      'creator_payout_methods',
      'creator_payouts',
      'lesson_requests',
      'lesson_request_votes',
      'waitlist'
    ];
    
    for (const table of tables) {
      const { rows } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = rows[0].exists;
      console.log(`  Table ${table}: ${exists ? '✅ Exists' : '❌ Missing'}`);
    }
    
    console.log('\n✅ Database service tests completed successfully!');
  } catch (error) {
    console.error('Error testing database service:', error);
    process.exit(1);
  }
}

testDatabaseService().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

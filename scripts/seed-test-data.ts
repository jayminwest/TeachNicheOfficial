import dotenv from 'dotenv';
import { CloudSqlDatabase } from '../app/services/database/cloud-sql';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function seedTestData() {
  console.log('Seeding test data into database...');
  
  try {
    // Create database service instance
    const db = new CloudSqlDatabase();
    
    // Seed categories
    console.log('\nSeeding categories...');
    const categories = [
      { name: 'Kendama Basics', id: uuidv4() },
      { name: 'Advanced Tricks', id: uuidv4() },
      { name: 'Competition Techniques', id: uuidv4() },
      { name: 'Kendama Maintenance', id: uuidv4() },
      { name: 'Freestyle', id: uuidv4() }
    ];
    
    for (const category of categories) {
      await db.query(
        'INSERT INTO categories (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [category.id, category.name]
      );
    }
    console.log(`✅ Seeded ${categories.length} categories`);
    
    // Seed test user profiles
    console.log('\nSeeding user profiles...');
    const users = [
      { id: uuidv4(), username: 'instructor1', full_name: 'John Instructor', email: 'instructor1@example.com', is_creator: true },
      { id: uuidv4(), username: 'instructor2', full_name: 'Jane Instructor', email: 'instructor2@example.com', is_creator: true },
      { id: uuidv4(), username: 'student1', full_name: 'Bob Student', email: 'student1@example.com', is_creator: false }
    ];
    
    for (const user of users) {
      await db.query(
        'INSERT INTO profiles (id, username, full_name, email, is_creator, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [user.id, user.username, user.full_name, user.email, user.is_creator]
      );
    }
    console.log(`✅ Seeded ${users.length} user profiles`);
    
    // Seed lessons
    console.log('\nSeeding lessons...');
    const lessons = [
      {
        id: uuidv4(),
        title: 'Introduction to Kendama',
        description: 'Learn the basics of kendama play and terminology.',
        price: 19.99,
        creator_id: users[0].id,
        status: 'published',
        mux_playback_id: 'sample-playback-id-1',
        thumbnail_url: 'https://via.placeholder.com/640x360.png?text=Introduction+to+Kendama'
      },
      {
        id: uuidv4(),
        title: 'Advanced Spike Techniques',
        description: 'Master advanced spike techniques for competitions.',
        price: 29.99,
        creator_id: users[0].id,
        status: 'published',
        mux_playback_id: 'sample-playback-id-2',
        thumbnail_url: 'https://via.placeholder.com/640x360.png?text=Advanced+Spike+Techniques'
      },
      {
        id: uuidv4(),
        title: 'Freestyle Kendama Mastery',
        description: 'Express yourself with creative freestyle kendama techniques.',
        price: 24.99,
        creator_id: users[1].id,
        status: 'published',
        mux_playback_id: 'sample-playback-id-3',
        thumbnail_url: 'https://via.placeholder.com/640x360.png?text=Freestyle+Kendama+Mastery'
      }
    ];
    
    for (const lesson of lessons) {
      await db.query(
        `INSERT INTO lessons (
          id, title, description, price, creator_id, status, 
          mux_playback_id, thumbnail_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          lesson.id, lesson.title, lesson.description, lesson.price, 
          lesson.creator_id, lesson.status, lesson.mux_playback_id, lesson.thumbnail_url
        ]
      );
    }
    console.log(`✅ Seeded ${lessons.length} lessons`);
    
    // Associate lessons with categories
    console.log('\nAssociating lessons with categories...');
    const lessonCategories = [
      { lesson_id: lessons[0].id, category_id: categories[0].id },
      { lesson_id: lessons[1].id, category_id: categories[1].id },
      { lesson_id: lessons[1].id, category_id: categories[2].id },
      { lesson_id: lessons[2].id, category_id: categories[4].id }
    ];
    
    for (const lc of lessonCategories) {
      await db.query(
        'INSERT INTO lesson_category (lesson_id, category_id) VALUES ($1, $2)',
        [lc.lesson_id, lc.category_id]
      );
    }
    console.log(`✅ Created ${lessonCategories.length} lesson-category associations`);
    
    // Seed purchases
    console.log('\nSeeding purchases...');
    const purchases = [
      {
        id: uuidv4(),
        user_id: users[2].id,
        lesson_id: lessons[0].id,
        creator_id: users[0].id,
        amount: 19.99,
        status: 'completed',
        payment_intent_id: 'pi_' + uuidv4().replace(/-/g, '')
      },
      {
        id: uuidv4(),
        user_id: users[2].id,
        lesson_id: lessons[2].id,
        creator_id: users[1].id,
        amount: 24.99,
        status: 'completed',
        payment_intent_id: 'pi_' + uuidv4().replace(/-/g, '')
      }
    ];
    
    for (const purchase of purchases) {
      await db.query(
        `INSERT INTO purchases (
          id, user_id, lesson_id, creator_id, amount, status, 
          payment_intent_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          purchase.id, purchase.user_id, purchase.lesson_id, purchase.creator_id,
          purchase.amount, purchase.status, purchase.payment_intent_id
        ]
      );
    }
    console.log(`✅ Seeded ${purchases.length} purchases`);
    
    // Seed reviews
    console.log('\nSeeding reviews...');
    const reviews = [
      {
        id: uuidv4(),
        user_id: users[2].id,
        lesson_id: lessons[0].id,
        rating: 5,
        comment: 'Excellent introduction to kendama! Very clear instructions.'
      },
      {
        id: uuidv4(),
        user_id: users[2].id,
        lesson_id: lessons[2].id,
        rating: 4,
        comment: 'Great freestyle techniques, but could use more examples.'
      }
    ];
    
    for (const review of reviews) {
      await db.query(
        `INSERT INTO reviews (
          id, user_id, lesson_id, rating, comment, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [review.id, review.user_id, review.lesson_id, review.rating, review.comment]
      );
    }
    console.log(`✅ Seeded ${reviews.length} reviews`);
    
    // Seed lesson requests
    console.log('\nSeeding lesson requests...');
    const lessonRequests = [
      {
        id: uuidv4(),
        user_id: users[2].id,
        title: 'Kendama Maintenance Guide',
        description: 'I would love to see a comprehensive guide on how to maintain and care for kendamas.',
        category: categories[3].id,
        status: 'open'
      },
      {
        id: uuidv4(),
        user_id: users[2].id,
        title: 'Competition Preparation',
        description: 'Tips and techniques for preparing for kendama competitions.',
        category: categories[2].id,
        status: 'open'
      }
    ];
    
    for (const request of lessonRequests) {
      await db.query(
        `INSERT INTO lesson_requests (
          id, user_id, title, description, category, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [request.id, request.user_id, request.title, request.description, request.category, request.status]
      );
    }
    console.log(`✅ Seeded ${lessonRequests.length} lesson requests`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('You can now run the database verification script to see the data:');
    console.log('  npx tsx scripts/test-database-service.ts');
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData().catch(error => {
  console.error('Failed to seed test data:', error);
  process.exit(1);
});

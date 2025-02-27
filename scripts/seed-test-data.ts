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
#!/usr/bin/env tsx

/**
 * Script to seed test data into the Cloud SQL database
 * 
 * This script:
 * 1. Connects to the Cloud SQL database
 * 2. Clears existing test data (optional)
 * 3. Seeds test users, profiles, lessons, and other required data
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const dotenvPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(dotenvPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: dotenvPath });
}

// Database connection configuration
const dbConfig = {
  host: process.env.CLOUD_SQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.CLOUD_SQL_USER || process.env.DB_USER || 'postgres',
  password: process.env.CLOUD_SQL_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.CLOUD_SQL_DATABASE || process.env.DB_NAME || 'teach-niche-db',
  port: parseInt(process.env.CLOUD_SQL_PORT || process.env.DB_PORT || '5432'),
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Test data
const testUsers = [
  {
    id: uuidv4(),
    email: 'test@example.com',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    email: 'creator@example.com',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function seedTestData() {
  console.log('Starting test data seeding...');
  console.log(`Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Insert test users
    console.log('Inserting test users...');
    for (const user of testUsers) {
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, user.password_hash, user.created_at, user.updated_at]);
    }
    
    // Insert profiles for test users
    console.log('Inserting user profiles...');
    for (const user of testUsers) {
      const username = user.email.split('@')[0];
      const displayName = username.charAt(0).toUpperCase() + username.slice(1);
      
      // Check if the profiles table has a username column
      const columnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'username'
        );
      `);
      
      if (columnCheckResult.rows[0].exists) {
        // If username column exists, include it in the insert
        await client.query(`
          INSERT INTO profiles (user_id, display_name, username, avatar_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = $2, username = $3, avatar_url = $4, updated_at = $6
        `, [
          user.id, 
          displayName, 
          username, 
          `https://ui-avatars.com/api/?name=${displayName}&background=random`,
          user.created_at,
          user.updated_at
        ]);
      } else {
        // If username column doesn't exist, exclude it from the insert
        await client.query(`
          INSERT INTO profiles (user_id, display_name, avatar_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = $2, avatar_url = $3, updated_at = $5
        `, [
          user.id, 
          displayName, 
          `https://ui-avatars.com/api/?name=${displayName}&background=random`,
          user.created_at,
          user.updated_at
        ]);
      }
    }
    
    // Insert test categories
    console.log('Inserting test categories...');
    const categories = ['Kendama', 'Juggling', 'Yo-yo', 'Skill Toys'];
    for (const category of categories) {
      await client.query(`
        INSERT INTO categories (id, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `, [uuidv4(), category, new Date(), new Date()]);
    }
    
    // Insert test lessons
    console.log('Inserting test lessons...');
    const creatorId = testUsers[1].id;
    const lessonId = uuidv4();
    
    await client.query(`
      INSERT INTO lessons (
        id, creator_id, title, description, price, 
        mux_asset_id, mux_playback_id, thumbnail_url, 
        created_at, updated_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
    `, [
      lessonId,
      creatorId,
      'Introduction to Kendama',
      'Learn the basics of kendama play with this comprehensive introduction.',
      1999, // $19.99
      'mux_asset_123',
      'mux_playback_123',
      'https://images.unsplash.com/photo-1559116315-f158f9ee34b3',
      new Date(),
      new Date(),
      'published'
    ]);
    
    // Insert test purchases
    console.log('Inserting test purchases...');
    await client.query(`
      INSERT INTO purchases (
        id, user_id, lesson_id, amount, status,
        created_at, updated_at, stripe_session_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      uuidv4(),
      testUsers[0].id,
      lessonId,
      1999, // $19.99
      'completed',
      new Date(),
      new Date(),
      'stripe_session_123'
    ]);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Test data seeded successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding test data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

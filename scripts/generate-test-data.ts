#!/usr/bin/env ts-node
/**
 * Test Data Generation Script
 * 
 * This script generates realistic test data for the Teach Niche platform.
 * It supports different dataset sizes and can target specific environments.
 * 
 * Usage:
 *   npm run generate-test-data -- [options]
 * 
 * Options:
 *   --small         Generate a small dataset (default)
 *   --medium        Generate a medium dataset
 *   --large         Generate a large dataset
 *   --dev           Target development environment (default)
 *   --prod          Target production environment
 *   --test          Target test environment
 *   --dry-run       Run without saving to database
 *   --help          Show help
 */

import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import pkg from 'pg';
const { Pool } = pkg;
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';
import { initMockFirebase } from './mock-firebase.ts';
import colors from './utils/colors.ts';

// Define dataset sizes
const DATASET_SIZES = {
  small: {
    users: 15,
    categories: 5,
    lessonsPerInstructor: 3,
    reviewsPerLesson: 5,
    paymentsPerUser: 2
  },
  medium: {
    users: 100,
    categories: 10,
    lessonsPerInstructor: 5,
    reviewsPerLesson: 10,
    paymentsPerUser: 5
  },
  large: {
    users: 1000,
    categories: 20,
    lessonsPerInstructor: 10,
    reviewsPerLesson: 20,
    paymentsPerUser: 10
  }
};

// Define entity interfaces
interface GenerationConfig {
  users: number;
  categories: number;
  lessonsPerInstructor: number;
  reviewsPerLesson: number;
  paymentsPerUser: number;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  isInstructor: boolean;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  categoryId: string;
  price: number;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl: string;
}

interface Review {
  id: string;
  lessonId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface Payment {
  id: string;
  userId: string;
  lessonId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  processingFee: number;
  platformFee: number;
  instructorEarnings: number;
}

// Global variables
let pool: Pool;
let firebase: any;
let datasetSize: 'small' | 'medium' | 'large' = 'small';
let targetEnv: 'development' | 'production' | 'test' = 'development';
let dryRun = false;
let uploadToFirebase = false;
let generatedData: {
  users: User[];
  categories: Category[];
  lessons: Lesson[];
  reviews: Review[];
  payments: Payment[];
} = {
  users: [],
  categories: [],
  lessons: [],
  reviews: [],
  payments: []
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--small')) datasetSize = 'small';
  if (args.includes('--medium')) datasetSize = 'medium';
  if (args.includes('--large')) datasetSize = 'large';
  
  if (args.includes('--dev')) targetEnv = 'development';
  if (args.includes('--prod')) targetEnv = 'production';
  if (args.includes('--test')) targetEnv = 'test';
  
  dryRun = args.includes('--dry-run');
  uploadToFirebase = args.includes('--upload-to-firebase');
  
  // Debug mode for more verbose logging
  const debug = args.includes('--debug');
  
  console.log(`${colors.cyan}Test Data Generation Script${colors.reset}`);
  console.log(`Dataset size: ${colors.yellow}${datasetSize}${colors.reset}`);
  console.log(`Target environment: ${colors.yellow}${targetEnv}${colors.reset}`);
  if (dryRun) console.log(`${colors.yellow}Dry run mode enabled${colors.reset}`);
  if (uploadToFirebase) console.log(`${colors.yellow}Firebase upload enabled${colors.reset}`);
  if (debug) console.log(`${colors.yellow}Debug mode enabled${colors.reset}`);
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${colors.cyan}Test Data Generation Script${colors.reset}

This script generates realistic test data for the Teach Niche platform.
It supports different dataset sizes and can target specific environments.

${colors.yellow}Usage:${colors.reset}
  npm run generate-test-data -- [options]

${colors.yellow}Options:${colors.reset}
  --small              Generate a small dataset (default)
  --medium             Generate a medium dataset
  --large              Generate a large dataset
  --dev                Target development environment (default)
  --prod               Target production environment
  --test               Target test environment
  --dry-run            Run without saving to database
  --upload-to-firebase Upload data to Firebase/Firestore
  --debug              Enable verbose debug logging
  --help               Show this help message
  `);
}

/**
 * Initialize the database connection
 */
async function initDatabase() {
  // Load environment variables
  dotenv.config({ path: `.env.${targetEnv}` });
  
  const dbConfig = {
    host: process.env.CLOUD_SQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.CLOUD_SQL_PORT || process.env.DB_PORT || '5432'),
    database: process.env.CLOUD_SQL_DATABASE || process.env.DB_NAME || `teach_niche_${targetEnv === 'production' ? 'prod' : 'dev'}`,
    user: process.env.CLOUD_SQL_USER || process.env.DB_USER || 'jayminwest',
    password: process.env.CLOUD_SQL_PASSWORD || process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
  
  console.log(`Connecting to database: ${colors.yellow}${dbConfig.database}${colors.reset} on ${colors.yellow}${dbConfig.host}:${dbConfig.port}${colors.reset}`);
  
  if (!dryRun) {
    pool = new Pool(dbConfig);
    try {
      const client = await pool.connect();
      console.log(`${colors.green}Successfully connected to database${colors.reset}`);
      client.release();
      
      // Create database tables
      await createDatabaseTables();
    } catch (error) {
      console.error(`${colors.red}Failed to connect to database:${colors.reset}`, error);
      process.exit(1);
    }
  } else {
    console.log(`${colors.yellow}Skipping database connection in dry run mode${colors.reset}`);
  }
}

/**
 * Create database tables if they don't exist
 */
async function createDatabaseTables() {
  if (dryRun) return;
  
  console.log(`${colors.cyan}Creating database tables if they don't exist...${colors.reset}`);
  
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        photo_url TEXT,
        is_instructor BOOLEAN DEFAULT FALSE,
        bio TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    // Create lessons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        instructor_id UUID NOT NULL REFERENCES users(id),
        category_id UUID NOT NULL REFERENCES categories(id),
        price DECIMAL(10, 2) NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        thumbnail_url TEXT,
        mux_asset_id VARCHAR(255),
        mux_playback_id VARCHAR(255)
      )
    `);
    
    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY,
        lesson_id UUID NOT NULL REFERENCES lessons(id),
        user_id UUID NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP NOT NULL
      )
    `);
    
    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        lesson_id UUID NOT NULL REFERENCES lessons(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        processing_fee DECIMAL(10, 2) NOT NULL,
        platform_fee DECIMAL(10, 2) NOT NULL,
        instructor_earnings DECIMAL(10, 2) NOT NULL
      )
    `);
    
    // Create purchases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        lesson_id UUID NOT NULL REFERENCES lessons(id),
        payment_id UUID NOT NULL REFERENCES payments(id),
        created_at TIMESTAMP NOT NULL
      )
    `);
    
    client.release();
    console.log(`${colors.green}Database tables created successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error creating database tables:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Initialize the real Firebase Admin SDK
 */
function initRealFirebase() {
  try {
    // Load environment variables
    dotenv.config({ path: `.env.${targetEnv}` });
    
    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      // Path to your service account key file
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                './firebase-service-account.json';
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.error(`${colors.red}Firebase service account file not found at ${serviceAccountPath}${colors.reset}`);
        console.log(`${colors.yellow}Falling back to mock implementation${colors.reset}`);
        return initMockFirebase();
      }
      
      // Initialize Firebase Admin with service account
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      
      console.log(`${colors.green}Successfully initialized Firebase Admin SDK${colors.reset}`);
    }
    
    return {
      auth: admin.auth(),
      firestore: admin.firestore(),
      storage: admin.storage()
    };
  } catch (error) {
    console.error(`${colors.red}Failed to initialize Firebase Admin SDK:${colors.reset}`, error);
    console.log(`${colors.yellow}Falling back to mock implementation${colors.reset}`);
    return initMockFirebase();
  }
}

/**
 * Initialize Firebase (real or mock)
 */
function initFirebase() {
  try {
    // Use real Firebase if not in dry run mode and credentials are available
    if (uploadToFirebase && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      firebase = initRealFirebase();
    } else {
      // Use mock implementation for dry runs or when credentials aren't available
      firebase = initMockFirebase();
      if (uploadToFirebase) {
        console.log(`${colors.yellow}Using mock Firebase implementation. To use real Firebase, set FIREBASE_SERVICE_ACCOUNT_PATH in your .env file.${colors.reset}`);
      }
    }
    console.log(`${colors.green}Successfully initialized Firebase${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to initialize Firebase:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Generate users
 */
async function generateUsers(config: GenerationConfig) {
  console.log(`Generating ${colors.yellow}${config.users}${colors.reset} users...`);
  
  const users: User[] = [];
  
  // Ensure at least 30% are instructors
  const instructorCount = Math.ceil(config.users * 0.3);
  
  for (let i = 0; i < config.users; i++) {
    const isInstructor = i < instructorCount;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const user: User = {
      id: randomUUID(),
      email: faker.internet.email({ firstName, lastName }),
      displayName: `${firstName} ${lastName}`,
      photoURL: faker.image.avatar(),
      isInstructor,
      bio: isInstructor ? faker.lorem.paragraphs(2) : faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent()
    };
    
    users.push(user);
    
    if (!dryRun) {
      try {
        // Create user in Firebase Auth (mock)
        await firebase.auth.createUser({
          uid: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        
        // Store user profile in database
        await pool.query(
          `INSERT INTO users (id, email, display_name, photo_url, is_instructor, bio, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [user.id, user.email, user.displayName, user.photoURL, user.isInstructor, user.bio, user.createdAt, user.updatedAt]
        );
      } catch (error) {
        console.error(`${colors.red}Failed to create user:${colors.reset}`, error);
      }
    }
  }
  
  generatedData.users = users;
  console.log(`${colors.green}Generated ${users.length} users${colors.reset}`);
  return users;
}

/**
 * Generate categories
 */
async function generateCategories(config: GenerationConfig) {
  console.log(`Generating ${colors.yellow}${config.categories}${colors.reset} categories...`);
  
  const categories: Category[] = [];
  
  // Define some realistic categories for a teaching platform
  const categoryNames = [
    'Programming',
    'Design',
    'Business',
    'Marketing',
    'Music',
    'Photography',
    'Cooking',
    'Fitness',
    'Language Learning',
    'Mathematics',
    'Science',
    'Art',
    'Writing',
    'Personal Development',
    'Finance',
    'History',
    'Philosophy',
    'Engineering',
    'Education',
    'Health'
  ];
  
  // Use only as many as we need
  const selectedCategories = categoryNames.slice(0, config.categories);
  
  for (let i = 0; i < selectedCategories.length; i++) {
    const category: Category = {
      id: randomUUID(),
      name: selectedCategories[i],
      description: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent()
    };
    
    categories.push(category);
    
    if (!dryRun) {
      try {
        await pool.query(
          `INSERT INTO categories (id, name, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [category.id, category.name, category.description, category.createdAt, category.updatedAt]
        );
      } catch (error) {
        console.error(`${colors.red}Failed to create category:${colors.reset}`, error);
      }
    }
  }
  
  generatedData.categories = categories;
  console.log(`${colors.green}Generated ${categories.length} categories${colors.reset}`);
  return categories;
}

/**
 * Generate lessons
 */
async function generateLessons(users: User[], categories: Category[], config: GenerationConfig) {
  const instructors = users.filter(user => user.isInstructor);
  const totalLessons = instructors.length * config.lessonsPerInstructor;
  
  console.log(`Generating ${colors.yellow}${totalLessons}${colors.reset} lessons...`);
  
  const lessons: Lesson[] = [];
  
  for (const instructor of instructors) {
    for (let i = 0; i < config.lessonsPerInstructor; i++) {
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const price = Math.floor(Math.random() * 10) * 5 + 5; // $5 to $50 in $5 increments
      
      const lesson: Lesson = {
        id: randomUUID(),
        title: faker.lorem.sentence({ min: 3, max: 8 }).replace(/\.$/, ''),
        description: faker.lorem.paragraphs(2),
        instructorId: instructor.id,
        categoryId: categories[categoryIndex].id,
        price,
        content: faker.lorem.paragraphs(10),
        published: Math.random() > 0.1, // 90% are published
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        thumbnailUrl: `https://picsum.photos/seed/${randomUUID()}/640/360`
      };
      
      lessons.push(lesson);
      
      if (!dryRun) {
        try {
          await pool.query(
            `INSERT INTO lessons (id, title, description, instructor_id, category_id, price, content, published, created_at, updated_at, thumbnail_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [lesson.id, lesson.title, lesson.description, lesson.instructorId, lesson.categoryId, lesson.price, 
             lesson.content, lesson.published, lesson.createdAt, lesson.updatedAt, lesson.thumbnailUrl]
          );
        } catch (error) {
          console.error(`${colors.red}Failed to create lesson:${colors.reset}`, error);
        }
      }
    }
  }
  
  generatedData.lessons = lessons;
  console.log(`${colors.green}Generated ${lessons.length} lessons${colors.reset}`);
  return lessons;
}

/**
 * Generate reviews
 */
async function generateReviews(users: User[], lessons: Lesson[], config: GenerationConfig) {
  const students = users.filter(user => !user.isInstructor);
  const publishedLessons = lessons.filter(lesson => lesson.published);
  
  // Calculate total reviews based on lessons and reviews per lesson
  // but cap it to a reasonable number based on available students
  const maxPossibleReviews = students.length * 5; // Assume each student can review up to 5 lessons
  const requestedReviews = publishedLessons.length * config.reviewsPerLesson;
  const totalReviews = Math.min(maxPossibleReviews, requestedReviews);
  
  console.log(`Generating ${colors.yellow}${totalReviews}${colors.reset} reviews...`);
  
  const reviews: Review[] = [];
  const reviewTracker = new Set(); // To prevent duplicate reviews
  
  for (let i = 0; i < totalReviews; i++) {
    // Pick a random student and lesson
    const studentIndex = Math.floor(Math.random() * students.length);
    const lessonIndex = Math.floor(Math.random() * publishedLessons.length);
    
    const student = students[studentIndex];
    const lesson = publishedLessons[lessonIndex];
    
    // Prevent duplicate reviews
    const reviewKey = `${student.id}-${lesson.id}`;
    if (reviewTracker.has(reviewKey)) {
      // Try again
      i--;
      continue;
    }
    
    reviewTracker.add(reviewKey);
    
    // Generate a rating with a bias toward positive reviews
    const ratingDistribution = [3, 4, 4, 5, 5, 5];
    const rating = ratingDistribution[Math.floor(Math.random() * ratingDistribution.length)];
    
    const review: Review = {
      id: randomUUID(),
      lessonId: lesson.id,
      userId: student.id,
      rating,
      comment: faker.lorem.paragraph(),
      createdAt: faker.date.recent({ days: 60 })
    };
    
    reviews.push(review);
    
    if (!dryRun) {
      try {
        await pool.query(
          `INSERT INTO reviews (id, lesson_id, user_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [review.id, review.lessonId, review.userId, review.rating, review.comment, review.createdAt]
        );
      } catch (error) {
        console.error(`${colors.red}Failed to create review:${colors.reset}`, error);
      }
    }
  }
  
  generatedData.reviews = reviews;
  console.log(`${colors.green}Generated ${reviews.length} reviews${colors.reset}`);
  return reviews;
}

/**
 * Generate payments
 */
async function generatePayments(users: User[], lessons: Lesson[], config: GenerationConfig) {
  const students = users.filter(user => !user.isInstructor);
  let publishedLessons = lessons.filter(lesson => lesson.published);
  
  // Verify lessons exist in the database before proceeding
  if (!dryRun) {
    try {
      const { rows } = await pool.query('SELECT id FROM lessons');
      const existingLessonIds = new Set(rows.map(row => row.id));
      
      // Filter lessons to only include those that exist in the database
      publishedLessons = publishedLessons.filter(lesson => existingLessonIds.has(lesson.id));
      
      console.log(`Found ${existingLessonIds.size} lessons in database, ${publishedLessons.length} are published`);
      
      if (publishedLessons.length === 0) {
        console.log(`${colors.yellow}No published lessons found in database, skipping payment generation${colors.reset}`);
        return [];
      }
    } catch (error) {
      console.error(`${colors.red}Failed to verify lessons in database:${colors.reset}`, error);
      return [];
    }
  }
  
  // Calculate total payments
  const totalPayments = Math.min(students.length * config.paymentsPerUser, publishedLessons.length * 10);
  
  console.log(`Generating ${colors.yellow}${totalPayments}${colors.reset} payments...`);
  
  const payments: Payment[] = [];
  const paymentTracker = new Set(); // To prevent duplicate payments
  
  for (let i = 0; i < totalPayments; i++) {
    // Pick a random student and lesson
    const studentIndex = Math.floor(Math.random() * students.length);
    const lessonIndex = Math.floor(Math.random() * publishedLessons.length);
    
    const student = students[studentIndex];
    const lesson = publishedLessons[lessonIndex];
    
    // Prevent duplicate payments
    const paymentKey = `${student.id}-${lesson.id}`;
    if (paymentTracker.has(paymentKey)) {
      // Try again
      i--;
      continue;
    }
    
    paymentTracker.add(paymentKey);
    
    // Calculate fees based on platform rules
    const amount = lesson.price;
    const processingFee = Math.round(amount * 0.029 + 30) / 100; // Stripe fee: 2.9% + $0.30
    const platformFee = Math.round(amount * 0.15 * 100) / 100; // 15% platform fee
    const instructorEarnings = Math.round((amount - platformFee) * 100) / 100;
    
    // Most payments are successful
    const statusOptions: ('completed' | 'pending' | 'failed')[] = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    const payment: Payment = {
      id: randomUUID(),
      userId: student.id,
      lessonId: lesson.id,
      amount,
      status,
      createdAt: faker.date.recent({ days: 90 }),
      processingFee,
      platformFee,
      instructorEarnings
    };
    
    payments.push(payment);
    
    if (!dryRun) {
      try {
        await pool.query(
          `INSERT INTO payments (id, user_id, lesson_id, amount, status, created_at, processing_fee, platform_fee, instructor_earnings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [payment.id, payment.userId, payment.lessonId, payment.amount, payment.status, 
           payment.createdAt, payment.processingFee, payment.platformFee, payment.instructorEarnings]
        );
        
        // If payment is completed, also create a purchase record
        if (payment.status === 'completed') {
          await pool.query(
            `INSERT INTO purchases (id, user_id, lesson_id, payment_id, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [randomUUID(), payment.userId, payment.lessonId, payment.id, payment.createdAt]
          );
        }
      } catch (error) {
        console.error(`${colors.red}Failed to create payment:${colors.reset}`, error);
      }
    }
  }
  
  generatedData.payments = payments;
  console.log(`${colors.green}Generated ${payments.length} payments${colors.reset}`);
  return payments;
}

/**
 * Save generated data to JSON file for reference
 */
function saveDataToJson() {
  const outputDir = path.join(process.cwd(), 'generated-data');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = path.join(outputDir, `${datasetSize}-${targetEnv}-${new Date().toISOString().split('T')[0]}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(generatedData, null, 2));
  console.log(`${colors.green}Saved generated data to ${filename}${colors.reset}`);
}

/**
 * Save data to Firestore
 */
async function saveToFirestore() {
  if (!uploadToFirebase) {
    console.log(`${colors.yellow}Skipping Firestore upload (use --upload-to-firebase to enable)${colors.reset}`);
    return;
  }
  
  console.log(`${colors.cyan}Saving data to Firestore...${colors.reset}`);
  
  // Determine the collection prefix based on environment
  // For Firebase, we don't use a prefix - collections are at the root level
  const collectionPrefix = '';
  
  // Save users
  console.log(`Saving ${generatedData.users.length} users to Firestore...`);
  for (const user of generatedData.users) {
    try {
      await firebase.firestore.collection(`${collectionPrefix}users`).doc(user.id).set({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isInstructor: user.isInstructor,
        bio: user.bio,
        createdAt: firebase.Timestamp.fromDate(user.createdAt),
        updatedAt: firebase.Timestamp.fromDate(user.updatedAt)
      });
    } catch (error) {
      console.error(`${colors.red}Failed to save user to Firestore:${colors.reset}`, error);
    }
  }
  
  // Save categories
  console.log(`Saving ${generatedData.categories.length} categories to Firestore...`);
  for (const category of generatedData.categories) {
    try {
      await firebase.firestore.collection(`${collectionPrefix}categories`).doc(category.id).set({
        name: category.name,
        description: category.description,
        createdAt: firebase.Timestamp.fromDate(category.createdAt),
        updatedAt: firebase.Timestamp.fromDate(category.updatedAt)
      });
    } catch (error) {
      console.error(`${colors.red}Failed to save category to Firestore:${colors.reset}`, error);
    }
  }
  
  // Save lessons
  console.log(`Saving ${generatedData.lessons.length} lessons to Firestore...`);
  for (const lesson of generatedData.lessons) {
    try {
      await firebase.firestore.collection(`${collectionPrefix}lessons`).doc(lesson.id).set({
        title: lesson.title,
        description: lesson.description,
        instructorId: lesson.instructorId,
        categoryId: lesson.categoryId,
        price: lesson.price,
        content: lesson.content,
        published: lesson.published,
        createdAt: firebase.Timestamp.fromDate(lesson.createdAt),
        updatedAt: firebase.Timestamp.fromDate(lesson.updatedAt),
        thumbnailUrl: lesson.thumbnailUrl
      });
    } catch (error) {
      console.error(`${colors.red}Failed to save lesson to Firestore:${colors.reset}`, error);
    }
  }
  
  // Save reviews
  console.log(`Saving ${generatedData.reviews.length} reviews to Firestore...`);
  for (const review of generatedData.reviews) {
    try {
      await firebase.firestore.collection(`${collectionPrefix}reviews`).doc(review.id).set({
        lessonId: review.lessonId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment,
        createdAt: firebase.Timestamp.fromDate(review.createdAt)
      });
    } catch (error) {
      console.error(`${colors.red}Failed to save review to Firestore:${colors.reset}`, error);
    }
  }
  
  // Save payments
  console.log(`Saving ${generatedData.payments.length} payments to Firestore...`);
  for (const payment of generatedData.payments) {
    try {
      await firebase.firestore.collection(`${collectionPrefix}payments`).doc(payment.id).set({
        userId: payment.userId,
        lessonId: payment.lessonId,
        amount: payment.amount,
        status: payment.status,
        createdAt: firebase.Timestamp.fromDate(payment.createdAt),
        processingFee: payment.processingFee,
        platformFee: payment.platformFee,
        instructorEarnings: payment.instructorEarnings
      });
      
      // If payment is completed, also create a purchase record
      if (payment.status === 'completed') {
        const purchaseId = randomUUID();
        await firebase.firestore.collection(`${collectionPrefix}purchases`).doc(purchaseId).set({
          userId: payment.userId,
          lessonId: payment.lessonId,
          paymentId: payment.id,
          createdAt: firebase.Timestamp.fromDate(payment.createdAt)
        });
      }
    } catch (error) {
      console.error(`${colors.red}Failed to save payment to Firestore:${colors.reset}`, error);
    }
  }
  
  console.log(`${colors.green}Successfully saved all data to Firestore in the ${collectionPrefix} namespace!${colors.reset}`);
}

/**
 * Main function
 */
async function main() {
  try {
    parseArgs();
    
    // Initialize services
    await initDatabase();
    
    // Verify database schema
    if (!dryRun) {
      const schemaValid = await verifyDatabaseSchema();
      if (!schemaValid) {
        console.error(`${colors.red}Database schema verification failed. Exiting.${colors.reset}`);
        process.exit(1);
      }
    }
    
    initFirebase();
    
    // Get configuration for selected dataset size
    const config = DATASET_SIZES[datasetSize];
    
    // Generate data in the correct order to maintain referential integrity
    const users = await generateUsers(config);
    const categories = await generateCategories(config);
    const lessons = await generateLessons(users, categories, config);
    const reviews = await generateReviews(users, lessons, config);
    const payments = await generatePayments(users, lessons, config);
    
    // Save data to JSON file for reference
    saveDataToJson();
    
    // Save data to Firestore if requested
    if (uploadToFirebase) {
      await saveToFirestore();
    }
    
    console.log(`${colors.green}Test data generation completed successfully!${colors.reset}`);
    
    // Clean up
    if (!dryRun && pool) {
      await pool.end();
    }
  } catch (error) {
    console.error(`${colors.red}Error generating test data:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
main();

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
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import { initMockFirebase } from './mock-firebase.js';
import colors from './utils/colors';

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
  
  console.log(`${colors.cyan}Test Data Generation Script${colors.reset}`);
  console.log(`Dataset size: ${colors.yellow}${datasetSize}${colors.reset}`);
  console.log(`Target environment: ${colors.yellow}${targetEnv}${colors.reset}`);
  if (dryRun) console.log(`${colors.yellow}Dry run mode enabled${colors.reset}`);
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
  --small         Generate a small dataset (default)
  --medium        Generate a medium dataset
  --large         Generate a large dataset
  --dev           Target development environment (default)
  --prod          Target production environment
  --test          Target test environment
  --dry-run       Run without saving to database
  --help          Show this help message
  `);
}

/**
 * Initialize the database connection
 */
async function initDatabase() {
  // Load environment variables
  dotenv.config({ path: `.env.${targetEnv}` });
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || `teach_niche_${targetEnv === 'production' ? 'prod' : 'dev'}`,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
  
  console.log(`Connecting to database: ${colors.yellow}${dbConfig.database}${colors.reset} on ${colors.yellow}${dbConfig.host}:${dbConfig.port}${colors.reset}`);
  
  if (!dryRun) {
    pool = new Pool(dbConfig);
    try {
      const client = await pool.connect();
      console.log(`${colors.green}Successfully connected to database${colors.reset}`);
      client.release();
    } catch (error) {
      console.error(`${colors.red}Failed to connect to database:${colors.reset}`, error);
      process.exit(1);
    }
  } else {
    console.log(`${colors.yellow}Skipping database connection in dry run mode${colors.reset}`);
  }
}

/**
 * Initialize Firebase (or mock)
 */
function initFirebase() {
  try {
    // In a real implementation, we would initialize Firebase here
    // For now, we'll use our mock implementation
    firebase = initMockFirebase();
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
  const publishedLessons = lessons.filter(lesson => lesson.published);
  
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
 * Main function
 */
async function main() {
  try {
    parseArgs();
    
    // Initialize services
    await initDatabase();
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

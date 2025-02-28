/**
 * Test Data Generation Script
 * 
 * This script generates realistic test data for the Teach Niche platform.
 * It supports different data volumes and ensures referential integrity.
 * It can target different environments (development, test, production).
 */

import { firestore } from '../app/lib/firebase';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as colors from 'colors';
import Mux from '@mux/mux-node';
import dotenv from 'dotenv';

// Configuration
interface GenerationConfig {
  users: number;
  categories: number;
  lessonsPerInstructor: number;
  reviewsPerLesson: number;
  paymentsPerUser: number;
}

const SMALL_DATASET: GenerationConfig = {
  users: 20,
  categories: 5,
  lessonsPerInstructor: 3,
  reviewsPerLesson: 5,
  paymentsPerUser: 2
};

const MEDIUM_DATASET: GenerationConfig = {
  users: 100,
  categories: 10,
  lessonsPerInstructor: 5,
  reviewsPerLesson: 10,
  paymentsPerUser: 5
};

const LARGE_DATASET: GenerationConfig = {
  users: 1000,
  categories: 20,
  lessonsPerInstructor: 10,
  reviewsPerLesson: 20,
  paymentsPerUser: 10
};

// Data structures
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
  mux_asset_id?: string;
  mux_playback_id?: string;
  thumbnailUrl?: string;
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

// Generator functions
async function generateUsers(count: number): Promise<User[]> {
  console.log(`${colors.cyan}Generating ${count} users...${colors.reset}`);
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const isInstructor = Math.random() > 0.7; // 30% are instructors
    
    const user: User = {
      id: uuidv4(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      photoURL: faker.image.avatar(),
      isInstructor,
      bio: isInstructor ? faker.lorem.paragraphs(2) : faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent()
    };
    
    users.push(user);
    
    // Log progress for large datasets
    if (count > 100 && i % 100 === 0) {
      console.log(`  Generated ${i} users...`);
    }
  }
  
  return users;
}

async function generateCategories(count: number): Promise<Category[]> {
  console.log(`${colors.cyan}Generating ${count} categories...${colors.reset}`);
  const categories: Category[] = [];
  
  // Define some realistic category names for a teaching platform
  const categoryNames = [
    "Music", "Programming", "Languages", "Art & Design", "Business", 
    "Cooking", "Fitness", "Photography", "Writing", "Mathematics",
    "Science", "History", "Philosophy", "Engineering", "Marketing",
    "Personal Development", "Crafts", "Dance", "Film & Video", "Education"
  ];
  
  // Use predefined names first, then generate random ones if needed
  for (let i = 0; i < count; i++) {
    const name = i < categoryNames.length 
      ? categoryNames[i] 
      : `${faker.commerce.department()} ${faker.commerce.productAdjective()}`;
      
    const category: Category = {
      id: uuidv4(),
      name,
      description: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent()
    };
    
    categories.push(category);
  }
  
  return categories;
}

async function generateLessons(
  instructors: User[], 
  categories: Category[], 
  lessonsPerInstructor: number,
  useMux: boolean = false
): Promise<Lesson[]> {
  const totalLessons = instructors.length * lessonsPerInstructor;
  console.log(`${colors.cyan}Generating ${totalLessons} lessons...${colors.reset}`);
  
  const lessons: Lesson[] = [];
  
  // Initialize Mux if needed
  let muxVideo: any = null;
  if (useMux) {
    try {
      const { Video } = new Mux({
        tokenId: process.env.MUX_TOKEN_ID || '',
        tokenSecret: process.env.MUX_TOKEN_SECRET || ''
      });
      muxVideo = Video;
      console.log(`${colors.green}Successfully initialized Mux Video API${colors.reset}`);
    } catch (error) {
      console.warn(`${colors.yellow}Failed to initialize Mux Video API, continuing without Mux integration${colors.reset}`);
      console.error(error);
    }
  }
  
  for (const instructor of instructors) {
    for (let i = 0; i < lessonsPerInstructor; i++) {
      const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
      const published = Math.random() > 0.2; // 80% are published
      
      const lesson: Lesson = {
        id: uuidv4(),
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        description: faker.lorem.paragraphs(2),
        instructorId: instructor.id,
        categoryId,
        price: parseFloat(faker.commerce.price({ min: 5, max: 100 })),
        content: faker.lorem.paragraphs(10),
        published,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        thumbnailUrl: faker.image.url({ width: 1280, height: 720 })
      };
      
      // Add Mux asset and playback IDs if Mux is available
      if (muxVideo && published && Math.random() > 0.3) { // Only 70% of published lessons have video
        try {
          // Create a placeholder Mux asset (in a real scenario, you'd upload a video)
          // For test data, we'll just create the asset without actual video content
          const asset = await muxVideo.Assets.create({
            input: [{ url: 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4' }],
            playback_policy: ['public'],
          });
          
          lesson.mux_asset_id = asset.id;
          lesson.mux_playback_id = asset.playback_ids?.[0]?.id;
          
          console.log(`Created Mux asset for lesson: ${lesson.title}`);
        } catch (error) {
          console.warn(`${colors.yellow}Failed to create Mux asset for lesson: ${lesson.title}${colors.reset}`);
          // Continue without Mux integration for this lesson
        }
      }
      
      lessons.push(lesson);
    }
    
    // Log progress for large datasets
    if (instructors.length > 50 && instructors.indexOf(instructor) % 50 === 0) {
      console.log(`  Generated lessons for ${instructors.indexOf(instructor)} instructors...`);
    }
  }
  
  return lessons;
}

async function generateReviews(
  lessons: Lesson[], 
  users: User[], 
  reviewsPerLesson: number
): Promise<Review[]> {
  const totalReviews = lessons.length * reviewsPerLesson;
  console.log(`${colors.cyan}Generating ${totalReviews} reviews...${colors.reset}`);
  
  const reviews: Review[] = [];
  const publishedLessons = lessons.filter(lesson => lesson.published);
  
  for (const lesson of publishedLessons) {
    // Don't let instructors review their own lessons
    const potentialReviewers = users.filter(user => user.id !== lesson.instructorId);
    
    // Determine how many reviews this lesson will have (random up to max)
    const reviewCount = Math.floor(Math.random() * reviewsPerLesson) + 1;
    
    // Create unique set of reviewers for this lesson
    const shuffledReviewers = [...potentialReviewers].sort(() => 0.5 - Math.random());
    const lessonReviewers = shuffledReviewers.slice(0, reviewCount);
    
    for (const reviewer of lessonReviewers) {
      // Generate a weighted rating distribution (more positive than negative)
      const ratingDistribution = [5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 1];
      const rating = ratingDistribution[Math.floor(Math.random() * ratingDistribution.length)];
      
      let comment = '';
      if (rating >= 4) {
        comment = faker.lorem.paragraph({ min: 2, max: 5 });
      } else if (rating >= 3) {
        comment = faker.lorem.paragraph({ min: 1, max: 3 });
      } else {
        comment = faker.lorem.sentences({ min: 1, max: 2 });
      }
      
      const review: Review = {
        id: uuidv4(),
        lessonId: lesson.id,
        userId: reviewer.id,
        rating,
        comment,
        createdAt: faker.date.between({ 
          from: lesson.createdAt, 
          to: new Date() 
        })
      };
      
      reviews.push(review);
    }
    
    // Log progress for large datasets
    if (publishedLessons.length > 100 && publishedLessons.indexOf(lesson) % 100 === 0) {
      console.log(`  Generated reviews for ${publishedLessons.indexOf(lesson)} lessons...`);
    }
  }
  
  return reviews;
}

async function generatePayments(
  lessons: Lesson[],
  users: User[],
  paymentsPerUser: number
): Promise<Payment[]> {
  const totalPayments = users.length * paymentsPerUser;
  console.log(`${colors.cyan}Generating ${totalPayments} payments...${colors.reset}`);
  
  const payments: Payment[] = [];
  const publishedLessons = lessons.filter(lesson => lesson.published);
  
  for (const user of users) {
    // Determine how many payments this user will have (random up to max)
    const paymentCount = Math.floor(Math.random() * paymentsPerUser) + 1;
    
    // Filter out lessons already purchased by this user
    const availableLessons = publishedLessons.filter(lesson => 
      !payments.some(p => p.userId === user.id && p.lessonId === lesson.id) &&
      lesson.instructorId !== user.id
    );
    
    if (availableLessons.length === 0) {
      console.warn(`${colors.yellow}No available lessons for user ${user.id} to purchase${colors.reset}`);
      continue;
    }
    
    // Create unique set of lessons this user purchased
    const shuffledLessons = [...availableLessons].sort(() => 0.5 - Math.random());
    const purchasedLessons = shuffledLessons.slice(0, Math.min(paymentCount, availableLessons.length));
    
    for (const lesson of purchasedLessons) {
      // Skip if user is the instructor of this lesson
      if (user.id === lesson.instructorId) continue;
      
      const amount = lesson.price;
      const processingFee = parseFloat((amount * 0.029 + 0.30).toFixed(2)); // Stripe fee
      const platformFee = parseFloat((amount * 0.15).toFixed(2)); // 15% platform fee
      const instructorEarnings = parseFloat((amount - platformFee).toFixed(2)); // 85% to instructor
      
      // Most payments are successful
      const statusOptions: ('completed' | 'pending' | 'failed')[] = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      const payment: Payment = {
        id: uuidv4(),
        userId: user.id,
        lessonId: lesson.id,
        amount,
        status,
        createdAt: faker.date.between({ 
          from: lesson.createdAt, 
          to: new Date() 
        }),
        processingFee,
        platformFee,
        instructorEarnings
      };
      
      payments.push(payment);
    }
    
    // Log progress for large datasets
    if (users.length > 100 && users.indexOf(user) % 100 === 0) {
      console.log(`  Generated payments for ${users.indexOf(user)} users...`);
    }
  }
  
  return payments;
}

// Save data to Firestore
async function saveToFirestore(
  users: User[],
  categories: Category[],
  lessons: Lesson[],
  reviews: Review[],
  payments: Payment[]
) {
  console.log(`${colors.cyan}Saving data to Firestore...${colors.reset}`);
  
  // Create batch operations for better performance
  const batchSize = 500; // Firestore limit is 500 operations per batch
  let operationCount = 0;
  let batch = firestore.batch();
  
  // Save users
  console.log(`Saving ${users.length} users...`);
  for (const user of users) {
    const userRef = firestore.collection('users').doc(user.id);
    batch.set(userRef, user);
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }
  
  // Save categories
  console.log(`Saving ${categories.length} categories...`);
  for (const category of categories) {
    const categoryRef = firestore.collection('categories').doc(category.id);
    batch.set(categoryRef, category);
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }
  
  // Save lessons
  console.log(`Saving ${lessons.length} lessons...`);
  for (const lesson of lessons) {
    const lessonRef = firestore.collection('lessons').doc(lesson.id);
    batch.set(lessonRef, lesson);
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }
  
  // Save reviews
  console.log(`Saving ${reviews.length} reviews...`);
  for (const review of reviews) {
    const reviewRef = firestore.collection('reviews').doc(review.id);
    batch.set(reviewRef, review);
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }
  
  // Save payments
  console.log(`Saving ${payments.length} payments...`);
  for (const payment of payments) {
    const paymentRef = firestore.collection('payments').doc(payment.id);
    batch.set(paymentRef, payment);
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }
  
  // Commit any remaining operations
  if (operationCount > 0) {
    await batch.commit();
  }
  
  console.log(`${colors.green}Successfully saved all data to Firestore!${colors.reset}`);
}

// Save data to JSON files (for backup or local development)
function saveToJson(
  users: User[],
  categories: Category[],
  lessons: Lesson[],
  reviews: Review[],
  payments: Payment[]
) {
  console.log(`${colors.cyan}Saving data to JSON files...${colors.reset}`);
  
  const outputDir = path.join(__dirname, '../data');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'users.json'), 
    JSON.stringify(users, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'categories.json'), 
    JSON.stringify(categories, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'lessons.json'), 
    JSON.stringify(lessons, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'reviews.json'), 
    JSON.stringify(reviews, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'payments.json'), 
    JSON.stringify(payments, null, 2)
  );
  
  console.log(`${colors.green}Successfully saved all data to JSON files in ${outputDir}!${colors.reset}`);
}

// Main function
async function main() {
  console.log(`${colors.cyan}Test Data Generation Script${colors.reset}`);
  
  // Load environment variables from the appropriate .env file
  dotenv.config({ path: '.env.local' });
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let datasetSize = 'small';
  let saveToDb = true;
  let saveToJsonFiles = true;
  let useMux = false;
  let targetEnvironment: 'development' | 'production' | 'test' = 'development';
  
  for (const arg of args) {
    if (arg === '--small' || arg === '-s') {
      datasetSize = 'small';
    } else if (arg === '--medium' || arg === '-m') {
      datasetSize = 'medium';
    } else if (arg === '--large' || arg === '-l') {
      datasetSize = 'large';
    } else if (arg === '--no-db') {
      saveToDb = false;
    } else if (arg === '--no-json') {
      saveToJsonFiles = false;
    } else if (arg === '--use-mux' || arg === '-m') {
      useMux = true;
    } else if (arg === '--dev') {
      targetEnvironment = 'development';
    } else if (arg === '--prod') {
      targetEnvironment = 'production';
    } else if (arg === '--test') {
      targetEnvironment = 'test';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: npm run generate-test-data -- [options]

Options:
  --small, -s       Generate small dataset (default)
  --medium, -m      Generate medium dataset
  --large, -l       Generate large dataset
  --no-db           Skip saving to database
  --no-json         Skip saving to JSON files
  --use-mux, -m     Create real Mux video assets (requires valid Mux credentials)
  --dev             Target development environment (default)
  --prod            Target production environment
  --test            Target test environment
  --help, -h        Show this help message
      `);
      process.exit(0);
    }
  }
  
  console.log(`Generating ${datasetSize} dataset for ${targetEnvironment} environment with configuration:`, config);

  // Set the NODE_ENV to ensure the correct database is used
  process.env.NODE_ENV = targetEnvironment;
  
  // Load environment-specific .env file
  dotenv.config({ path: `.env.${targetEnvironment}` });
  
  // Select configuration based on dataset size
  let config: GenerationConfig;
  switch (datasetSize) {
    case 'medium':
      config = MEDIUM_DATASET;
      break;
    case 'large':
      config = LARGE_DATASET;
      break;
    default:
      config = SMALL_DATASET;
  }
  
  console.log(`Generating ${datasetSize} dataset with configuration:`, config);
  
  try {
    // Generate data
    const users = await generateUsers(config.users);
    const instructors = users.filter(user => user.isInstructor);
    const categories = await generateCategories(config.categories);
    const lessons = await generateLessons(instructors, categories, config.lessonsPerInstructor, useMux);
    const reviews = await generateReviews(lessons, users, config.reviewsPerLesson);
    const payments = await generatePayments(lessons, users, config.paymentsPerUser);
    
    // Save data
    if (saveToJsonFiles) {
      saveToJson(users, categories, lessons, reviews, payments);
    }
    
    if (saveToDb) {
      await saveToFirestore(users, categories, lessons, reviews, payments);
    }
    
    console.log(`${colors.green}Test data generation completed successfully!${colors.reset}`);
    
    // Print summary
    console.log(`
${colors.cyan}Data Generation Summary:${colors.reset}
- Generated ${users.length} users (${instructors.length} instructors)
- Generated ${categories.length} categories
- Generated ${lessons.length} lessons
- Generated ${reviews.length} reviews
- Generated ${payments.length} payments
    `);
    
  } catch (error) {
    console.error(`${colors.red}Error generating test data:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
main();

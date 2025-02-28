#!/usr/bin/env node
/**
 * Script to migrate Supabase references to Firebase
 * 
 * This script focuses on fixing the most common issues found in the codebase
 * related to Supabase to Firebase migration.
 * 
 * Usage:
 *   node scripts/migrate-supabase-to-firebase.ts [--dry-run] [--path=<path>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Files and directories to ignore
const ignoreFiles = [
  'node_modules',
  '.next',
  '.git',
  'scripts/replace-supabase-references.ts',
  'scripts/check-supabase-references.ts',
  'scripts/migrate-supabase-to-firebase.ts',
];

// Directories to search
const dirsToSearch = ['app', 'components', 'lib', 'pages', 'types'];

// Replacement patterns
const replacements = [
  // Fix firebaseAuth references
  {
    pattern: /import\s+{\s*firebaseAuth\s*}\s+from\s+['"]@\/app\/lib\/firebase['"]/g,
    replacement: "import { getAuth } from 'firebase/auth';\nimport { getApp } from 'firebase/app';",
    description: 'Replace firebaseAuth import with getAuth'
  },
  {
    pattern: /firebaseAuth\.getSession\(\)/g,
    replacement: "new Promise(resolve => {\n  const auth = getAuth(getApp());\n  const unsubscribe = auth.onAuthStateChanged(user => {\n    unsubscribe();\n    resolve({ data: { session: user ? { user } : null }, error: null });\n  });\n})",
    description: 'Replace firebaseAuth.getSession with Firebase onAuthStateChanged'
  },
  
  // Fix supabase references
  {
    pattern: /import\s+{\s*supabase\s*}\s+from\s+['"]@\/app\/lib\/firebase['"]/g,
    replacement: "import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';\nimport { getApp } from 'firebase/app';",
    description: 'Replace supabase import with Firestore imports'
  },
  
  // Fix user.id references
  {
    pattern: /user\.id/g,
    replacement: "user.uid",
    description: 'Replace user.id with user.uid'
  },
  
  // Fix orderBy references
  {
    pattern: /query\s*=\s*query\.orderBy\(/g,
    replacement: "query = query.order(",
    description: 'Replace orderBy with order'
  },
  
  // Fix user_metadata references
  {
    pattern: /user\?.user_metadata/g,
    replacement: "user?.metadata",
    description: 'Replace user_metadata with metadata'
  },
  
  // Fix app_metadata references
  {
    pattern: /user\?.app_metadata/g,
    replacement: "user?.metadata",
    description: 'Replace app_metadata with metadata'
  },
  
  // Fix const user = user; circular references
  {
    pattern: /const\s+user\s*=\s*user;/g,
    replacement: "const currentUser = auth.currentUser;",
    description: 'Fix circular user reference'
  },
  
  // Fix single() method calls
  {
    pattern: /\.single\(\);/g,
    replacement: ";\n// TODO: Implement equivalent of single() for Firebase",
    description: 'Replace single() method calls'
  },
  
  // Fix limit method
  {
    pattern: /query\s*=\s*query\.limit\(/g,
    replacement: "// TODO: Implement limit for Firebase\n  // query = query.limit(",
    description: 'Comment out limit method calls'
  },
  
  // Fix get method
  {
    pattern: /query\.get\(\);/g,
    replacement: "// TODO: Implement get() for Firebase\n  // Temporary placeholder to avoid errors\n  { data: [] };",
    description: 'Replace get() method calls'
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pathArg = args.find(arg => arg.startsWith('--path='));
const specificPath = pathArg ? pathArg.split('=')[1] : null;

// Function to check if a file should be processed
function shouldProcessFile(filePath: string): boolean {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  
  // Check if file should be ignored
  for (const ignorePattern of ignoreFiles) {
    if (relativePath.includes(ignorePattern)) {
      return false;
    }
  }
  
  // Only process TypeScript and JavaScript files
  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}

// Function to process a file
function processFile(filePath: string): void {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // Apply each replacement pattern
    for (const { pattern, replacement, description } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`[${filePath}] Found ${matches.length} instances of: ${description}`);
        
        if (typeof replacement === 'function') {
          // For function-based replacements
          newContent = newContent.replace(pattern, (...args: any[]) => {
            hasChanges = true;
            return replacement(...args);
          });
        } else {
          // For string-based replacements
          const updatedContent = newContent.replace(pattern, replacement);
          if (updatedContent !== newContent) {
            hasChanges = true;
            newContent = updatedContent;
          }
        }
      }
    }
    
    // Write the changes if not in dry-run mode
    if (hasChanges && !dryRun) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`[${filePath}] Updated file with replacements`);
    } else if (hasChanges) {
      console.log(`[${filePath}] Would update file (dry run)`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Function to walk a directory and process files
function walkDir(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip directories that should be ignored
      const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      if (!ignoreFiles.some(ignore => relativePath.includes(ignore))) {
        walkDir(fullPath);
      }
    } else if (shouldProcessFile(fullPath)) {
      processFile(fullPath);
    }
  }
}

// Main function
function main() {
  console.log(`Starting Supabase to Firebase migration${dryRun ? ' (DRY RUN)' : ''}`);
  
  if (specificPath) {
    const fullPath = path.resolve(rootDir, specificPath);
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        walkDir(fullPath);
      } else if (shouldProcessFile(fullPath)) {
        processFile(fullPath);
      } else {
        console.log(`Skipping ${fullPath} (not a processable file)`);
      }
    } else {
      console.error(`Path not found: ${fullPath}`);
      process.exit(1);
    }
  } else {
    // Process all directories in dirsToSearch
    for (const dir of dirsToSearch) {
      const dirPath = path.join(rootDir, dir);
      if (fs.existsSync(dirPath)) {
        walkDir(dirPath);
      }
    }
  }
  
  console.log('Migration process completed');
  console.log('\nNext steps:');
  console.log('1. Run "npm run type-check" to see remaining TypeScript errors');
  console.log('2. Fix specific errors manually, focusing on:');
  console.log('   - Firebase auth user properties (uid vs id)');
  console.log('   - Firestore query methods');
  console.log('   - Missing Firebase imports');
}

main();

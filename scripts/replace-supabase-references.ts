#!/usr/bin/env node
/**
 * Script to replace Supabase references with GCP equivalents
 * 
 * Usage:
 *   node scripts/replace-supabase-references.ts [--dry-run] [--path=<path>]
 * 
 * Options:
 *   --dry-run    Don't make any changes, just report what would be changed
 *   --path       Specify a specific file or directory to process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
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
];

// Directories to search
const dirsToSearch = ['app', 'components', 'lib', 'pages', 'types'];

// Replacement patterns
const replacements = [
  // Import replacements
  {
    pattern: /import\s+.*\s+from\s+['"]@\/app\/lib\/supabase['"]/g,
    replacement: "import { auth, firestore, storage } from '@/app/lib/firebase'",
    description: 'Replace Supabase import with Firebase import'
  },
  {
    pattern: /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
    replacement: "import { initializeApp } from 'firebase/app'",
    description: 'Replace Supabase client import with Firebase app import'
  },
  
  // Client initialization replacements
  {
    pattern: /const\s+supabase\s*=\s*createClient\(.*\)/g,
    replacement: "// Firebase is already initialized in @/app/lib/firebase",
    description: 'Remove Supabase client initialization'
  },
  
  // Auth replacements
  {
    pattern: /supabase\.auth\.signInWithPassword\(\s*{\s*email\s*:\s*([^,}]+),\s*password\s*:\s*([^,}]+)\s*}\s*\)/g,
    replacement: "auth.signInWithEmailAndPassword($1, $2)",
    description: 'Replace Supabase signInWithPassword with Firebase signInWithEmailAndPassword'
  },
  {
    pattern: /supabase\.auth\.signUp\(\s*{\s*email\s*:\s*([^,}]+),\s*password\s*:\s*([^,}]+)(?:,\s*options\s*:\s*{\s*data\s*:\s*{\s*([^}]+)\s*}\s*})?\s*}\s*\)/g,
    replacement: (match, email, password, data) => {
      if (data) {
        return `auth.createUserWithEmailAndPassword(${email}, ${password}).then(userCredential => {
          return firestore.collection('profiles').doc(userCredential.user.uid).set({
            ${data}
          });
        })`;
      }
      return `auth.createUserWithEmailAndPassword(${email}, ${password})`;
    },
    description: 'Replace Supabase signUp with Firebase createUserWithEmailAndPassword'
  },
  {
    pattern: /supabase\.auth\.signOut\(\)/g,
    replacement: "auth.signOut()",
    description: 'Replace Supabase signOut with Firebase signOut'
  },
  
  // Database query replacements
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)/g,
    replacement: "firestore.collection('$1').get().then(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))",
    description: 'Replace Supabase select query with Firestore get'
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.insert\(([^)]+)\)/g,
    replacement: "firestore.collection('$1').add($2)",
    description: 'Replace Supabase insert with Firestore add'
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.update\(([^)]+)\)\.eq\(['"]id['"],\s*([^)]+)\)/g,
    replacement: "firestore.collection('$1').doc($3).update($2)",
    description: 'Replace Supabase update with Firestore update'
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.delete\(\)\.eq\(['"]id['"],\s*([^)]+)\)/g,
    replacement: "firestore.collection('$1').doc($2).delete()",
    description: 'Replace Supabase delete with Firestore delete'
  },
  
  // Storage replacements
  {
    pattern: /supabase\.storage\.from\(['"]([^'"]+)['"]\)\.upload\((['"][^'"]*['"],\s*[^,)]+)(?:,\s*{[^}]*})?\)/g,
    replacement: "storage.ref('$1/$2').put($2)",
    description: 'Replace Supabase storage upload with Firebase Storage upload'
  },
  {
    pattern: /supabase\.storage\.from\(['"]([^'"]+)['"]\)\.getPublicUrl\((['"][^'"]*['"])\)/g,
    replacement: "storage.ref('$1/$2').getDownloadURL()",
    description: 'Replace Supabase getPublicUrl with Firebase getDownloadURL'
  },
  
  // More complex patterns for database queries with filters
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)\.eq\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g,
    replacement: "firestore.collection('$1').where('$3', '==', $4).get().then(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))",
    description: 'Replace Supabase select with eq filter to Firestore where query'
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)\.order\(['"]([^'"]+)['"]\s*(?:,\s*{\s*ascending\s*:\s*(true|false)\s*})?\)/g,
    replacement: (match, table, select, orderField, ascending) => {
      const direction = ascending === 'false' ? 'desc' : 'asc';
      return `firestore.collection('${table}').orderBy('${orderField}', '${direction}').get().then(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))`;
    },
    description: 'Replace Supabase select with order to Firestore orderBy query'
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)\.limit\(([^)]+)\)/g,
    replacement: "firestore.collection('$1').limit($3).get().then(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))",
    description: 'Replace Supabase select with limit to Firestore limit query'
  },
  
  // Complex patterns for destructured query results
  {
    pattern: /const\s+{\s*data\s*(?::\s*([a-zA-Z0-9_]+))?\s*,\s*error\s*}\s*=\s*await\s+supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)\.eq\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g,
    replacement: (match, dataVar, table, select, field, value) => {
      const dataVarName = dataVar || 'data';
      return `let ${dataVarName} = null;\nlet error = null;\ntry {\n  const snapshot = await firestore.collection('${table}').where('${field}', '==', ${value}).get();\n  ${dataVarName} = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));\n} catch (e) {\n  error = e;\n}`;
    },
    description: 'Replace Supabase select with eq filter and destructuring to Firestore where query with try/catch'
  },
  
  // User profile patterns
  {
    pattern: /supabase\.from\(['"]profiles['"]\)\.select\(['"]([^'"]+)['"]\)\.eq\(['"]id['"]\s*,\s*([^)]+)\)\.single\(\)/g,
    replacement: "firestore.collection('profiles').doc($2).get().then(doc => doc.exists ? { data: { ...doc.data(), id: doc.id }, error: null } : { data: null, error: 'Profile not found' })",
    description: 'Replace Supabase profile query with Firestore doc get'
  },
  
  // Transaction patterns
  {
    pattern: /await\s+supabase\.from\(['"]([^'"]+)['"]\)\.insert\(([^)]+)\)\.select\(['"]([^'"]+)['"]\)\.single\(\)/g,
    replacement: "await firestore.collection('$1').add($2).then(docRef => docRef.get()).then(doc => ({ data: { ...doc.data(), id: doc.id }, error: null }))",
    description: 'Replace Supabase insert with select to Firestore add with get'
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
          newContent = newContent.replace(pattern, (...args) => {
            hasChanges = true;
            return replacement(...args);
          });
        } else {
          // For string-based replacements
          newContent = newContent.replace(pattern, replacement);
          if (newContent !== content) {
            hasChanges = true;
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
  console.log(`Starting Supabase to GCP reference replacement${dryRun ? ' (DRY RUN)' : ''}`);
  
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
  
  console.log('Replacement process completed');
}

main();

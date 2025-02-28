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
#!/usr/bin/env ts-node
/**
 * Script to replace Supabase references with GCP equivalents
 * 
 * Usage:
 *   ts-node scripts/replace-supabase-references.ts [--dry-run] [--path=<path>]
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
  
  // More specific replacements for common patterns
  {
    pattern: /const\s+{\s*data\s*(?::\s*([a-zA-Z0-9_]+))?\s*,\s*error\s*}\s*=\s*await\s+supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)/g,
    replacement: (match, dataVar, table, select) => {
      const dataVarName = dataVar || 'data';
      return `let ${dataVarName} = null;\nlet error = null;\ntry {\n  const snapshot = await firestore.collection('${table}').get();\n  ${dataVarName} = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));\n} catch (e) {\n  error = e;\n}`;
    },
    description: 'Replace Supabase select with destructuring to Firestore get with try/catch'
  },
  {
    pattern: /const\s+{\s*data\s*(?::\s*([a-zA-Z0-9_]+))?\s*,\s*error\s*}\s*=\s*await\s+supabase\.from\(['"]([^'"]+)['"]\)\.insert\(([^)]+)\)/g,
    replacement: (match, dataVar, table, data) => {
      const dataVarName = dataVar || 'data';
      return `let ${dataVarName} = null;\nlet error = null;\ntry {\n  const docRef = await firestore.collection('${table}').add(${data});\n  ${dataVarName} = { id: docRef.id, ...${data} };\n} catch (e) {\n  error = e;\n}`;
    },
    description: 'Replace Supabase insert with destructuring to Firestore add with try/catch'
  },
  
  // RPC call replacements
  {
    pattern: /supabase\.rpc\(['"]([^'"]+)['"]\s*(?:,\s*([^)]+))?\)/g,
    replacement: (match, funcName, params) => {
      if (params) {
        return `// TODO: Replace Supabase RPC call with appropriate Firebase function\n// Original: supabase.rpc('${funcName}', ${params})\n// Consider using Firebase Cloud Functions or direct Firestore queries`;
      }
      return `// TODO: Replace Supabase RPC call with appropriate Firebase function\n// Original: supabase.rpc('${funcName}')\n// Consider using Firebase Cloud Functions or direct Firestore queries`;
    },
    description: 'Replace Supabase RPC calls with Firebase alternatives'
  },
  
  // Auth state change replacements
  {
    pattern: /supabase\.auth\.onAuthStateChange\(\s*\(\s*event\s*,\s*session\s*\)\s*=>\s*{/g,
    replacement: "auth.onAuthStateChanged((user) => {",
    description: 'Replace Supabase onAuthStateChange with Firebase onAuthStateChanged'
  },
  
  // User session replacements
  {
    pattern: /supabase\.auth\.getSession\(\)/g,
    replacement: "new Promise(resolve => auth.onAuthStateChanged(user => resolve({ data: { session: user ? { user } : null }, error: null })))",
    description: 'Replace Supabase getSession with Firebase onAuthStateChanged'
  },
  
  // User replacements
  {
    pattern: /session\.user/g,
    replacement: "user",
    description: 'Replace Supabase session.user with Firebase user'
  },
  
  // Add more patterns as needed
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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const excludeDirs = ['node_modules', '.git', '.next', 'out', 'scripts'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

const replacements = [
  {
    pattern: /import\s+.*from\s+['"]@\/app\/lib\/supabase['"]/g,
    replacement: "import { getApp } from 'firebase/app'"
  },
  {
    pattern: /import\s+.*from\s+['"]@supabase\/.*['"]/g,
    replacement: "import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';\nimport { getAuth } from 'firebase/auth';\nimport { getStorage } from 'firebase/storage';"
  },
  {
    pattern: /const\s+supabase\s+=\s+createClient.*/g,
    replacement: "const app = getApp();\nconst db = getFirestore(app);\nconst auth = getAuth(app);\nconst storage = getStorage(app);"
  },
  {
    pattern: /supabase\.auth\.signUp\(\s*\{\s*email\s*:\s*([^,]+),\s*password\s*:\s*([^,]+)(?:,\s*options\s*:\s*\{\s*data\s*:\s*\{\s*full_name\s*:\s*([^}]+)\s*\}\s*\})?\s*\}\s*\)/g,
    replacement: "createUserWithEmailAndPassword(auth, $1, $2).then(userCredential => {\n  return updateProfile(userCredential.user, { displayName: $3 || '' });\n})"
  },
  {
    pattern: /supabase\.auth\.signInWithPassword\(\s*\{\s*email\s*:\s*([^,]+),\s*password\s*:\s*([^}]+)\s*\}\s*\)/g,
    replacement: "signInWithEmailAndPassword(auth, $1, $2)"
  },
  {
    pattern: /supabase\.auth\.signOut\(\)/g,
    replacement: "signOut(auth)"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.select\((['"][^'"]*['"])\)/g,
    replacement: "getDocs(collection(db, '$1')).then(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.insert\(\s*(\{[^}]+\}|\[[^\]]+\])\s*\)/g,
    replacement: "addDoc(collection(db, '$1'), $2)"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.update\(\s*(\{[^}]+\})\s*\)\.eq\(['"]id['"],\s*([^)]+)\)/g,
    replacement: "updateDoc(doc(db, '$1', $3), $2)"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.delete\(\)\.eq\(['"]id['"],\s*([^)]+)\)/g,
    replacement: "deleteDoc(doc(db, '$1', $2))"
  },
  {
    pattern: /supabase\.storage\.from\(['"]([^'"]+)['"]\)\.upload\((['"][^'"]*['"],\s*[^,]+)(?:,\s*\{[^}]*\})?\)/g,
    replacement: "uploadBytes(ref(storage, '$1/' + $2))"
  },
  {
    pattern: /supabase\.storage\.from\(['"]([^'"]+)['"]\)\.getPublicUrl\((['"][^'"]*['"])\)/g,
    replacement: "getDownloadURL(ref(storage, '$1/' + $2))"
  },
  {
    pattern: /supabase\.storage\.from\(['"]([^'"]+)['"]\)\.remove\(\[(['"][^'"]*['"])\]\)/g,
    replacement: "deleteObject(ref(storage, '$1/' + $2))"
  }
];

async function processFile(filePath: string, dryRun: boolean): Promise<boolean> {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    for (const { pattern, replacement } of replacements) {
      content = content.replace(pattern, replacement);
    }
    
    if (content !== originalContent) {
      console.log(`[${dryRun ? 'DRY RUN' : 'REPLACING'}] ${filePath}`);
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

async function walkDir(dir: string, dryRun: boolean): Promise<{ totalFiles: number, changedFiles: number }> {
  let totalFiles = 0;
  let changedFiles = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (excludeDirs.includes(file)) continue;
      const result = await walkDir(filePath, dryRun);
      totalFiles += result.totalFiles;
      changedFiles += result.changedFiles;
    } else if (stat.isFile() && fileExtensions.includes(path.extname(file))) {
      totalFiles++;
      const hasChanges = await processFile(filePath, dryRun);
      if (hasChanges) changedFiles++;
    }
  }
  
  return { totalFiles, changedFiles };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log(`Starting ${dryRun ? 'dry run' : 'replacement'}...`);
  const result = await walkDir(rootDir, dryRun);
  
  console.log(`\nSummary:\nScanned: ${result.totalFiles}\nModified: ${result.changedFiles}`);
  if (dryRun) {
    console.log(`\nDry run complete. Run without --dry-run to apply changes.`);
  } else {
    console.log(`\nMigration complete.`);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

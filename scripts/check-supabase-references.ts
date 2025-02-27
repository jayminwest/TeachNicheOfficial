import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Directories to search
const dirsToSearch = [
  'app',
  'components',
  'lib',
  'pages',
  'utils'
];

// File extensions to check
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to search for
const patterns = [
  'supabase',
  'createClient',
  'NEXT_PUBLIC_SUPABASE',
  'SUPABASE_'
];

// Files to ignore (relative to root)
const ignoreFiles = [
  'scripts/migrate-database.ts',
  'scripts/migrate-storage.ts',
  'scripts/verify-migration.ts',
  '__mocks__/services/supabase.ts'
];

function searchInFile(filePath: string): { file: string, line: number, text: string }[] {
  const results: { file: string, line: number, text: string }[] = [];
  
  // Check if file should be ignored
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  if (ignoreFiles.includes(relativePath)) {
    return results;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (line.includes(pattern)) {
        results.push({
          file: relativePath,
          line: index + 1,
          text: line.trim()
        });
        break; // Only report once per line
      }
    }
  });
  
  return results;
}

function walkDir(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(walkDir(filePath));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

function checkSupabaseReferences() {
  console.log('Checking for Supabase references...');
  
  let allFiles: string[] = [];
  
  // Get all files to check
  for (const dir of dirsToSearch) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      allFiles = allFiles.concat(walkDir(dirPath));
    }
  }
  
  console.log(`Scanning ${allFiles.length} files...`);
  
  // Search in all files
  let totalReferences = 0;
  const allResults: { file: string, line: number, text: string }[] = [];
  
  allFiles.forEach(file => {
    const results = searchInFile(file);
    if (results.length > 0) {
      allResults.push(...results);
      totalReferences += results.length;
    }
  });
  
  // Group results by file
  const fileGroups = allResults.reduce((acc, result) => {
    if (!acc[result.file]) {
      acc[result.file] = [];
    }
    acc[result.file].push(result);
    return acc;
  }, {} as Record<string, typeof allResults>);
  
  // Print results
  if (totalReferences === 0) {
    console.log('✅ No Supabase references found outside of migration scripts.');
  } else {
    console.log(`❌ Found ${totalReferences} Supabase references in ${Object.keys(fileGroups).length} files:`);
    
    for (const [file, results] of Object.entries(fileGroups)) {
      console.log(`\n${file}:`);
      results.forEach(result => {
        console.log(`  Line ${result.line}: ${result.text}`);
      });
    }
    
    console.log('\nThese references should be updated to use the GCP services.');
  }
}

checkSupabaseReferences();

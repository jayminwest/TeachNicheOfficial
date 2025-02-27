#!/usr/bin/env tsx

/**
 * Script to find and update Supabase references in the codebase
 * 
 * This script:
 * 1. Finds all files with Supabase references
 * 2. Generates a migration plan for each file
 * 3. Optionally applies automated replacements for common patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = path.resolve(__dirname, '..');
const excludeDirs = ['node_modules', '.next', 'out', '.git', 'terraform'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md'];

// Replacement patterns
const replacementPatterns = [
  {
    pattern: /import\s+.*\s+from\s+['"]@\/app\/lib\/supabase['"]/g,
    replacement: "import { firebaseAuth, firebaseDb, firebaseStorage } from '@/app/lib/firebase'",
    description: 'Replace Supabase import with Firebase import'
  },
  {
    pattern: /createClientComponentClient/g,
    replacement: 'getFirebaseAuth',
    description: 'Replace Supabase client creation with Firebase auth'
  },
  {
    pattern: /supabase\.auth\./g,
    replacement: 'firebaseAuth.',
    description: 'Replace Supabase auth with Firebase auth'
  },
  {
    pattern: /supabase\.from\(['"](\w+)['"]\)/g,
    replacement: 'firebaseDb.collection("$1")',
    description: 'Replace Supabase table queries with Firestore collection queries'
  },
  {
    pattern: /supabase\.storage\.from\(['"](\w+)['"]\)/g,
    replacement: 'firebaseStorage.ref("$1")',
    description: 'Replace Supabase storage with Firebase storage'
  }
];

// Find files with Supabase references
function findFilesWithSupabaseReferences() {
  console.log('Searching for files with Supabase references...');
  
  try {
    // Use grep to find files with Supabase references
    const grepCommand = `grep -r --include="*.{ts,tsx,js,jsx,md}" "supabase\\|@supabase" ${rootDir} | grep -v "${excludeDirs.join('\\|')}"`;
    const grepOutput = execSync(grepCommand, { encoding: 'utf-8' });
    
    // Parse grep output to get file paths
    const fileMatches = grepOutput.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const colonIndex = line.indexOf(':');
        return line.substring(0, colonIndex);
      })
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    
    console.log(`Found ${fileMatches.length} files with Supabase references`);
    return fileMatches;
  } catch (error) {
    console.error('Error finding files with Supabase references:', error);
    return [];
  }
}

// Analyze file for Supabase references
function analyzeFile(filePath) {
  console.log(`Analyzing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const references = [];
    
    // Check for imports
    const importMatches = content.match(/import\s+.*\s+from\s+['"]@\/app\/lib\/supabase['"]/g) || [];
    importMatches.forEach(match => {
      references.push({
        type: 'import',
        match,
        line: content.substring(0, content.indexOf(match)).split('\n').length
      });
    });
    
    // Check for createClientComponentClient
    const clientMatches = content.match(/createClientComponentClient/g) || [];
    clientMatches.forEach(match => {
      references.push({
        type: 'client',
        match,
        line: content.substring(0, content.indexOf(match)).split('\n').length
      });
    });
    
    // Check for supabase.auth
    const authMatches = content.match(/supabase\.auth\./g) || [];
    authMatches.forEach(match => {
      references.push({
        type: 'auth',
        match,
        line: content.substring(0, content.indexOf(match)).split('\n').length
      });
    });
    
    // Check for supabase.from
    const fromMatches = content.match(/supabase\.from\(['"](\w+)['"]\)/g) || [];
    fromMatches.forEach(match => {
      references.push({
        type: 'database',
        match,
        line: content.substring(0, content.indexOf(match)).split('\n').length,
        table: match.match(/supabase\.from\(['"](\w+)['"]\)/)[1]
      });
    });
    
    // Check for supabase.storage
    const storageMatches = content.match(/supabase\.storage\.from\(['"](\w+)['"]\)/g) || [];
    storageMatches.forEach(match => {
      references.push({
        type: 'storage',
        match,
        line: content.substring(0, content.indexOf(match)).split('\n').length,
        bucket: match.match(/supabase\.storage\.from\(['"](\w+)['"]\)/)[1]
      });
    });
    
    return {
      path: filePath,
      references,
      content
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return {
      path: filePath,
      references: [],
      content: ''
    };
  }
}

// Generate migration plan for a file
function generateMigrationPlan(fileAnalysis) {
  const { path, references, content } = fileAnalysis;
  
  if (references.length === 0) {
    return null;
  }
  
  console.log(`Generating migration plan for ${path} (${references.length} references)`);
  
  const plan = {
    path,
    referenceCount: references.length,
    changes: []
  };
  
  // Group references by type
  const importRefs = references.filter(ref => ref.type === 'import');
  const clientRefs = references.filter(ref => ref.type === 'client');
  const authRefs = references.filter(ref => ref.type === 'auth');
  const dbRefs = references.filter(ref => ref.type === 'database');
  const storageRefs = references.filter(ref => ref.type === 'storage');
  
  // Add changes to plan
  if (importRefs.length > 0) {
    plan.changes.push({
      type: 'import',
      count: importRefs.length,
      lines: importRefs.map(ref => ref.line),
      recommendation: "Replace Supabase imports with Firebase imports"
    });
  }
  
  if (clientRefs.length > 0) {
    plan.changes.push({
      type: 'client',
      count: clientRefs.length,
      lines: clientRefs.map(ref => ref.line),
      recommendation: "Replace createClientComponentClient with getFirebaseAuth"
    });
  }
  
  if (authRefs.length > 0) {
    plan.changes.push({
      type: 'auth',
      count: authRefs.length,
      lines: authRefs.map(ref => ref.line),
      recommendation: "Replace supabase.auth with firebaseAuth"
    });
  }
  
  if (dbRefs.length > 0) {
    const tables = [...new Set(dbRefs.map(ref => ref.table))];
    plan.changes.push({
      type: 'database',
      count: dbRefs.length,
      lines: dbRefs.map(ref => ref.line),
      tables,
      recommendation: "Replace supabase.from queries with Firestore collection queries"
    });
  }
  
  if (storageRefs.length > 0) {
    const buckets = [...new Set(storageRefs.map(ref => ref.bucket))];
    plan.changes.push({
      type: 'storage',
      count: storageRefs.length,
      lines: storageRefs.map(ref => ref.line),
      buckets,
      recommendation: "Replace supabase.storage with Firebase storage"
    });
  }
  
  return plan;
}

// Apply automated replacements to a file
function applyAutomatedReplacements(filePath, dryRun = true) {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Applying automated replacements to ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changesApplied = 0;
    
    for (const { pattern, replacement, description } of replacementPatterns) {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      
      if (content !== originalContent) {
        changesApplied++;
        console.log(`- Applied: ${description}`);
      }
    }
    
    if (changesApplied > 0 && !dryRun) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Saved ${changesApplied} changes to ${filePath}`);
    } else if (changesApplied > 0) {
      console.log(`[DRY RUN] Would save ${changesApplied} changes to ${filePath}`);
    } else {
      console.log(`No automated replacements applied to ${filePath}`);
    }
    
    return changesApplied;
  } catch (error) {
    console.error(`Error applying automated replacements to ${filePath}:`, error);
    return 0;
  }
}

// Main function
async function main() {
  console.log('Starting Supabase reference update script...');
  
  // Find files with Supabase references
  const files = findFilesWithSupabaseReferences();
  
  if (files.length === 0) {
    console.log('No files with Supabase references found');
    return;
  }
  
  // Analyze files and generate migration plans
  const fileAnalyses = files.map(analyzeFile);
  const migrationPlans = fileAnalyses
    .map(generateMigrationPlan)
    .filter(plan => plan !== null);
  
  console.log(`\nGenerated migration plans for ${migrationPlans.length} files`);
  
  // Save migration plans to a file
  const migrationPlanPath = path.join(__dirname, 'supabase-migration-plans.json');
  fs.writeFileSync(
    migrationPlanPath, 
    JSON.stringify(migrationPlans, null, 2), 
    'utf-8'
  );
  console.log(`Migration plans saved to ${migrationPlanPath}`);
  
  // Apply automated replacements (dry run by default)
  console.log('\nPerforming dry run of automated replacements...');
  const dryRun = true; // Set to false to actually apply changes
  let totalChanges = 0;
  
  for (const file of files) {
    const changesApplied = applyAutomatedReplacements(file, dryRun);
    totalChanges += changesApplied;
  }
  
  console.log(`\nDry run complete. ${totalChanges} total changes would be applied.`);
  console.log('To apply changes, edit this script to set dryRun = false and run again.');
  
  // Generate summary report
  console.log('\n--- Migration Summary ---');
  console.log(`Total files with Supabase references: ${files.length}`);
  console.log(`Files with migration plans: ${migrationPlans.length}`);
  console.log(`Total references found: ${migrationPlans.reduce((sum, plan) => sum + plan.referenceCount, 0)}`);
  
  // Group by reference type
  const referenceTypes = migrationPlans.flatMap(plan => plan.changes.map(change => change.type));
  const typeCounts = referenceTypes.reduce((counts, type) => {
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  
  console.log('\nReference types:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  console.log('\nNext steps:');
  console.log('1. Review the migration plans in supabase-migration-plans.json');
  console.log('2. Update the replacement patterns in this script if needed');
  console.log('3. Run this script with dryRun = false to apply automated replacements');
  console.log('4. Manually update complex cases that cannot be automated');
  console.log('5. Test the application thoroughly after updates');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

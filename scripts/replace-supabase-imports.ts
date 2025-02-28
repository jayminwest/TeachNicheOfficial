/**
 * Script to replace Supabase imports with Firebase equivalents
 */
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Replacement patterns
const replacements = [
  {
    from: /import\s+.*\s+from\s+['"]@\/app\/services\/supabase['"]/g,
    to: "import { db, auth, storage } from '@/app/lib/firebase'"
  },
  {
    from: /import\s+.*\s+from\s+['"]@supabase\/supabase-js['"]/g,
    to: "import { User } from 'firebase/auth'"
  },
  {
    from: /import\s+.*\s+from\s+['"]@supabase\/auth-helpers-nextjs['"]/g,
    to: "import { getAuth } from 'firebase/auth'"
  },
  {
    from: /const\s+supabase\s*=\s*createRouteHandlerClient/g,
    to: "const auth = getAuth()"
  },
  {
    from: /supabase\.from\(['"](.*)['"]\)\.select/g,
    to: "db.collection('$1').get()"
  },
  {
    from: /supabase\.from\(['"](.*)['"]\)\.insert/g,
    to: "db.collection('$1').add"
  },
  {
    from: /supabase\.from\(['"](.*)['"]\)\.update/g,
    to: "db.collection('$1').doc(id).update"
  },
  {
    from: /supabase\.from\(['"](.*)['"]\)\.delete/g,
    to: "db.collection('$1').doc(id).delete"
  },
  {
    from: /supabase\.storage\.from\(['"](.*)['"]\)\.upload/g,
    to: "storage.ref(`$1/${path}`).put"
  },
  {
    from: /supabase\.storage\.from\(['"](.*)['"]\)\.getPublicUrl/g,
    to: "storage.ref(`$1/${path}`).getDownloadURL"
  },
  {
    from: /supabase\.auth\.getUser/g,
    to: "auth.currentUser"
  }
];

async function replaceInFile(filePath: string): Promise<boolean> {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const { from, to } of replacements) {
      const originalContent = content;
      content = content.replace(from, to);
      
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    const files = await glob('app/**/*.{ts,tsx,js,jsx}', { ignore: ['**/node_modules/**'] });
    console.log(`Found ${files.length} files to process`);
    
    let modifiedCount = 0;
    
    for (const file of files) {
      const modified = await replaceInFile(file);
      if (modified) {
        modifiedCount++;
      }
    }
    
    console.log(`\nCompleted! Modified ${modifiedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

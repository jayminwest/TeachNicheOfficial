import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envExamplePath = path.join(__dirname, '..', '.env.example');

const envVarsToRemove = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET'
];

const envVarsToAdd = [
  'NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id',
  'NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id',
  'FIREBASE_ADMIN_PROJECT_ID=your-project-id',
  'FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email',
  'FIREBASE_ADMIN_PRIVATE_KEY=your-private-key'
];

function updateEnvExample() {
  try {
    let envContent = fs.existsSync(envExamplePath) ? fs.readFileSync(envExamplePath, 'utf8') : '';
    
    for (const envVar of envVarsToRemove) {
      const regex = new RegExp(`^${envVar}=.*$`, 'gm');
      envContent = envContent.replace(regex, '');
    }
    
    envContent = envContent.replace(/\n\n+/g, '\n\n');
    envContent += '\n# Firebase\n' + envVarsToAdd.join('\n') + '\n';
    
    fs.writeFileSync(envExamplePath, envContent, 'utf8');
    console.log('.env.example updated. Update your .env files with Firebase values.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateEnvExample();

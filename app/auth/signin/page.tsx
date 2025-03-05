import { redirect } from 'next/navigation';

export default function SignInPage() {
  // Redirect to the main auth page which handles sign-in
  return redirect('/auth');
}

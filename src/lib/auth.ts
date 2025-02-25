import { auth } from '@/firebase/config';
import { User } from 'firebase/auth';

export async function getSession(): Promise<{ user: User | null }> {
  const user = auth.currentUser;
  return { user };
}

export async function signOut() {
  await auth.signOut();
}

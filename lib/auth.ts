import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET is required');
export type SessionUser = { id: string; email: string; name: string };

export function signToken(user: SessionUser) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    SECRET!,
    { expiresIn: '7d' }
  );
}
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  try { return jwt.verify(token, SECRET!) as SessionUser; } catch { return null; }
}
export function verifyToken(token: string): SessionUser | null {
  try { return jwt.verify(token, SECRET!) as SessionUser; } catch { return null; }
}

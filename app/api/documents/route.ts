import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { workspaceId?: unknown; title?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const workspaceId = String(body.workspaceId ?? '');
  const title = String(body.title ?? 'Untitled page').trim().slice(0, 120) || 'Untitled page';
  const member = await prisma.membership.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!member || !['OWNER', 'EDITOR'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and editors can create documents' }, { status: 403 });
  }

  const doc = await prisma.document.create({ data: { workspaceId, title } });
  return NextResponse.json(doc, { status: 201 });
}

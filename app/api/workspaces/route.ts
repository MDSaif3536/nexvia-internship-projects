import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: {
      documents: { orderBy: { updatedAt: 'desc' } },
      memberships: { where: { userId: user.id }, select: { role: true } },
    },
  });
  return NextResponse.json(workspaces);
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { name?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const name = String(body.name ?? '').trim().slice(0, 80);
  if (!name) return NextResponse.json({ error: 'Workspace name required' }, { status: 400 });
  const workspace = await prisma.workspace.create({
    data: {
      name,
      memberships: { create: { userId: user.id, role: 'OWNER' } },
      documents: { create: { title: 'Untitled page' } },
    },
  });
  return NextResponse.json(workspace, { status: 201 });
}

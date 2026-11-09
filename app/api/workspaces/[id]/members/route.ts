import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };
const validRoles: Role[] = ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'];

async function getMembership(workspaceId: string, userId: string) {
  return prisma.membership.findUnique({
    where: { userId_workspaceId: { workspaceId, userId } },
  });
}

async function requireOwner(workspaceId: string, userId: string) {
  const membership = await getMembership(workspaceId, userId);
  return membership?.role === 'OWNER' ? membership : null;
}

// Members can see the team list; only owners can change it.
export async function GET(_: Request, ctx: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: workspaceId } = await ctx.params;
  const membership = await getMembership(workspaceId, user.id);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const members = await prisma.membership.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ currentRole: membership.role, currentMembershipId: membership.id, members });
}

// Add an existing CollabSpace account to the workspace by email.
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: workspaceId } = await ctx.params;
  if (!(await requireOwner(workspaceId, user.id))) {
    return NextResponse.json({ error: 'Only workspace owners can invite members' }, { status: 403 });
  }

  let body: { email?: unknown; role?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const email = String(body.email ?? '').trim().toLowerCase();
  const role = String(body.role ?? 'EDITOR') as Role;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const invitedUser = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (!invitedUser) return NextResponse.json({ error: 'No account found for this email. Ask them to register first.' }, { status: 404 });
  const existing = await getMembership(workspaceId, invitedUser.id);
  if (existing) return NextResponse.json({ error: 'This user is already a workspace member' }, { status: 409 });

  const membership = await prisma.membership.create({
    data: { workspaceId, userId: invitedUser.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(membership, { status: 201 });
}

// Update a member's role. The acting owner cannot downgrade their own owner role.
export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: workspaceId } = await ctx.params;
  if (!(await requireOwner(workspaceId, user.id))) {
    return NextResponse.json({ error: 'Only workspace owners can manage roles' }, { status: 403 });
  }

  let body: { membershipId?: unknown; role?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const membershipId = String(body.membershipId ?? '');
  const role = String(body.role ?? '') as Role;
  if (!membershipId || !validRoles.includes(role)) return NextResponse.json({ error: 'Membership and valid role are required' }, { status: 400 });

  const target = await prisma.membership.findFirst({ where: { id: membershipId, workspaceId } });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (target.userId === user.id && target.role === 'OWNER' && role !== 'OWNER') {
    return NextResponse.json({ error: 'You cannot remove your own owner role' }, { status: 400 });
  }
  if (target.role === 'OWNER' && role !== 'OWNER') {
    const ownerCount = await prisma.membership.count({ where: { workspaceId, role: 'OWNER' } });
    if (ownerCount <= 1) return NextResponse.json({ error: 'A workspace must have at least one owner' }, { status: 400 });
  }

  const updated = await prisma.membership.update({ where: { id: membershipId }, data: { role }, include: { user: { select: { id: true, name: true, email: true } } } });
  return NextResponse.json(updated);
}

// Remove a member; never allow removal of the final owner.
export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: workspaceId } = await ctx.params;
  if (!(await requireOwner(workspaceId, user.id))) {
    return NextResponse.json({ error: 'Only workspace owners can remove members' }, { status: 403 });
  }

  let body: { membershipId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const membershipId = String(body.membershipId ?? '');
  const target = await prisma.membership.findFirst({ where: { id: membershipId, workspaceId } });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (target.userId === user.id && target.role === 'OWNER') {
    return NextResponse.json({ error: 'You cannot remove yourself while you are an owner' }, { status: 400 });
  }
  if (target.role === 'OWNER') {
    const ownerCount = await prisma.membership.count({ where: { workspaceId, role: 'OWNER' } });
    if (ownerCount <= 1) return NextResponse.json({ error: 'A workspace must have at least one owner' }, { status: 400 });
  }

  await prisma.membership.delete({ where: { id: membershipId } });
  return NextResponse.json({ success: true });
}

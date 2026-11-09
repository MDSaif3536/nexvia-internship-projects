import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { verifyToken } from '../lib/auth';
import { prisma } from '../lib/prisma';

const port = Number(process.env.COLLAB_PORT || 1234);
const wss = new WebSocketServer({ port });

// y-websocket's outer message type 0 is Yjs sync. Its inner types are
// 0=SyncStep1 (read request), 1=SyncStep2 (client state), 2=Update (edit).
// Commenters and viewers may request state and send awareness, but may not
// send client state or document updates to the shared Y.Doc.
function isReadOnlySafeFrame(data: unknown): boolean {
  let bytes: Uint8Array;
  if (data instanceof Uint8Array) bytes = data;
  else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
  else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  else return false;

  let offset = 0;
  const readVarUint = (): number | null => {
    let value = 0;
    let multiplier = 1;
    for (let i = 0; i < 5; i++) {
      if (offset >= bytes.length) return null;
      const byte = bytes[offset++];
      value += (byte & 0x7f) * multiplier;
      if ((byte & 0x80) === 0) return value;
      multiplier *= 128;
    }
    return null;
  };

  const outerType = readVarUint();
  if (outerType === null) return false;
  if (outerType !== 0) return true; // awareness (outer type 1) is allowed
  const syncType = readVarUint();
  return syncType === 0; // only SyncStep1 is safe for read-only clients
}

wss.on('connection', async (conn, req) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = requestUrl.searchParams.get('token');
    const user = token ? verifyToken(token) : null;
    const room = requestUrl.pathname.replace(/^\/+/, '');
    if (!user || !room) {
      conn.close(1008, 'Unauthorized');
      return;
    }

    const doc = await prisma.document.findFirst({
      where: { id: room, workspace: { memberships: { some: { userId: user.id } } } },
      select: { id: true, workspaceId: true },
    });
    if (!doc) {
      conn.close(1008, 'No access');
      return;
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: doc.workspaceId } },
      select: { role: true },
    });
    if (!membership) {
      conn.close(1008, 'No access');
      return;
    }
    let canWrite = membership.role === 'OWNER' || membership.role === 'EDITOR';

    // Recheck access periodically so removing a member or changing their role
    // also affects already-open sockets, not just new connections.
    const accessInterval = setInterval(async () => {
      try {
        const latest = await prisma.membership.findUnique({
          where: { userId_workspaceId: { userId: user.id, workspaceId: doc.workspaceId } },
          select: { role: true },
        });
        if (!latest) {
          clearInterval(accessInterval);
          conn.close(1008, 'Workspace access revoked');
          return;
        }
        canWrite = latest.role === 'OWNER' || latest.role === 'EDITOR';
      } catch (error) {
        console.error('Could not recheck collaboration access:', error);
      }
    }, 5000);
    conn.once('close', () => clearInterval(accessInterval));

    // Wrap the socket's listener registration so inbound messages are filtered
    // before y-websocket's standard handler can apply them to the shared Y.Doc.
    const filteredConn = new Proxy(conn, {
      get(target, property, receiver) {
        if (property === 'on') {
          return (event: string, listener: (...args: any[]) => void) => {
            if (event === 'message') {
              target.on('message', (data: unknown, isBinary: boolean) => {
                if (canWrite || isReadOnlySafeFrame(data)) listener(data, isBinary);
              });
              return receiver;
            }
            const result = target.on(event as any, listener as any);
            return result === target ? receiver : result;
          };
        }
        const value = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });

    setupWSConnection(filteredConn, req, { docName: room });
  } catch (error) {
    console.error('Collaboration connection error:', error);
    conn.close(1011, 'Server error');
  }
});

console.log(`Yjs WebSocket server listening on ${port}`);

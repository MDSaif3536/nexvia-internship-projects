'use client';
import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

type Props = { documentId: string; userName: string; userId: string };
type Role = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
type CommentItem = { id: string; body: string; createdAt: string; author: { name: string } };
type SnapshotItem = { id: string; label: string | null; content: any; createdAt: string };

export default function Editor({ documentId, userName, userId }: Props) {
  const [docTitle, setDocTitle] = useState('Loading…');
  const [role, setRole] = useState<Role>('VIEWER');
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [comment, setComment] = useState('');
  const [snaps, setSnaps] = useState<SnapshotItem[]>([]);
  const [status, setStatus] = useState('Connecting');
  const [message, setMessage] = useState('');

  const canEdit = role === 'OWNER' || role === 'EDITOR';
  const canComment = role !== 'VIEWER';

  useEffect(() => {
    let p: WebsocketProvider | undefined;
    let ydoc: Y.Doc | undefined;
    let alive = true;

    (async () => {
      try {
        const metaResponse = await fetch(`/api/documents/${documentId}`);
        const meta = await metaResponse.json();
        if (!alive || !metaResponse.ok || meta.error) {
          location.href = '/workspaces';
          return;
        }
        setDocTitle(meta.title);
        setRole(meta.role as Role);

        const tokenResponse = await fetch('/api/collab-token');
        const tokenData = await tokenResponse.json();
        if (!alive || !tokenResponse.ok || !tokenData.token) {
          setStatus('Unauthorized');
          return;
        }

        ydoc = new Y.Doc();
        p = new WebsocketProvider(
          process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:1234',
          documentId,
          ydoc,
          { params: { token: tokenData.token } },
        );
        p.on('status', (event: { status: string }) => setStatus(event.status === 'connected' ? 'Live' : event.status));
        if (alive) setProvider(p);
        await loadComments();
        await loadSnapshots();
      } catch {
        if (alive) setStatus('Connection error');
      }
    })();

    return () => {
      alive = false;
      p?.destroy();
      ydoc?.destroy();
    };
  }, [documentId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Placeholder.configure({ placeholder: canEdit ? 'Start writing together…' : 'This document is read-only.' }),
      ...(provider
        ? [
            Collaboration.configure({ document: provider.doc }),
            CollaborationCaret.configure({ provider, user: { name: userName, color: colorFrom(userId) } }),
          ]
        : []),
    ],
    content: '',
    editable: canEdit,
    immediatelyRender: false,
  }, [provider, canEdit]);

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  async function loadComments() {
    const response = await fetch(`/api/documents/${documentId}/comments`);
    if (response.ok) setComments(await response.json());
  }

  async function loadSnapshots() {
    const response = await fetch(`/api/documents/${documentId}/snapshots`);
    if (response.ok) setSnaps(await response.json());
  }

  async function postComment(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    const response = await fetch(`/api/documents/${documentId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: comment }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setComment('');
      await loadComments();
    } else setMessage(data.error || 'Could not add comment.');
  }

  async function snapshot() {
    if (!canEdit) return;
    const content = editor?.getJSON();
    if (!content) return;
    const response = await fetch(`/api/documents/${documentId}/snapshots`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, label: 'Saved from editor' }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setMessage('Snapshot saved.');
      await loadSnapshots();
    } else setMessage(data.error || 'Could not save snapshot.');
  }

  async function saveTitle() {
    if (!canEdit) return;
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: docTitle }),
    });
    if (!response.ok) setMessage('Could not save document title.');
  }

  function restoreSnapshot(snapshotItem: SnapshotItem) {
    if (!canEdit || !editor) return;
    const confirmed = window.confirm(`Restore “${snapshotItem.label || 'this snapshot'}” into the current document? This will replace the current editor content for everyone connected.`);
    if (!confirmed) return;
    editor.commands.setContent(snapshotItem.content);
    setMessage('Snapshot content restored in the editor.');
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/workspaces">← CollabSpace</a>
        <div className="row">
          <span className="muted">● {status} · {role}</span>
          <button className="secondary" onClick={snapshot} disabled={!canEdit}>Save snapshot</button>
        </div>
      </header>
      {message && <p role="status" className="muted">{message}</p>}
      <div className="split">
        <section className="panel">
          <input
            value={docTitle}
            onChange={event => setDocTitle(event.target.value)}
            onBlur={saveTitle}
            readOnly={!canEdit}
            aria-label="Document title"
            style={{ fontSize: 25, fontWeight: 700, border: 'none', padding: '8px 0' }}
          />
          <div className="toolbar">
            <button className="secondary" disabled={!canEdit} onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
            <button className="secondary" disabled={!canEdit} onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
            <button className="secondary" disabled={!canEdit} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>Heading</button>
            <button className="secondary" disabled={!canEdit} onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bullet list</button>
            <button className="secondary" disabled={!canEdit} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
          </div>
          <div className="editor"><EditorContent editor={editor} /></div>
          <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Live sync uses Yjs CRDT. Presence cursor names/colors are visible when connected.
            {!canEdit && ' Your role allows viewing only; editing controls are disabled.'}
          </p>
        </section>
        <aside className="stack">
          <section className="panel">
            <h3>Comments</h3>
            <form onSubmit={postComment} className="stack">
              <textarea placeholder={canComment ? 'Write a comment…' : 'Your role is view-only.'} value={comment} onChange={event => setComment(event.target.value)} rows={3} disabled={!canComment} />
              <button disabled={!canComment || !comment.trim()}>Add comment</button>
            </form>
            <div className="stack" style={{ marginTop: 14 }}>
              {comments.map(item => <div className="comment" key={item.id}>
                <strong>{item.author.name}</strong>
                <p style={{ margin: '6px 0' }}>{item.body}</p>
                <small className="muted">{new Date(item.createdAt).toLocaleString()}</small>
              </div>)}
            </div>
          </section>
          <section className="panel">
            <h3>Version history</h3>
            <p className="muted">Snapshots save editor JSON content and can be restored by owners and editors.</p>
            {snaps.map(item => <div className="comment" key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.label || 'Snapshot'}</strong>
              <div className="muted">{new Date(item.createdAt).toLocaleString()}</div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="secondary" onClick={() => {
                  const blob = new Blob([JSON.stringify(item.content, null, 2)], { type: 'application/json' });
                  const anchor = document.createElement('a');
                  anchor.href = URL.createObjectURL(blob);
                  anchor.download = `snapshot-${item.id}.json`;
                  anchor.click();
                  URL.revokeObjectURL(anchor.href);
                }}>Download JSON</button>
                <button className="secondary" disabled={!canEdit} onClick={() => restoreSnapshot(item)}>Restore</button>
              </div>
            </div>)}
          </section>
        </aside>
      </div>
    </main>
  );
}

function colorFrom(value: string) {
  let hue = 0;
  for (let index = 0; index < value.length; index++) hue = (hue * 31 + value.charCodeAt(index)) % 360;
  return `hsl(${hue},70%,45%)`;
}

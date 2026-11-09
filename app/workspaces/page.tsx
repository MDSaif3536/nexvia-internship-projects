'use client';
import { useEffect, useState } from 'react';

type Doc = { id: string; title: string; updatedAt: string };
type Workspace = { id: string; name: string; documents: Doc[]; memberships: { role: Role }[] };
type Role = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
type Member = { id: string; role: Role; user: { id: string; name: string; email: string } };
const roles: Role[] = ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'];

export default function Workspaces() {
  const [items, setItems] = useState<Workspace[]>([]);
  const [name, setName] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [selected, setSelected] = useState('');
  const [manageWorkspace, setManageWorkspace] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>('VIEWER');
  const [currentMembershipId, setCurrentMembershipId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('EDITOR');
  const [teamMessage, setTeamMessage] = useState('');

  async function load() {
    const response = await fetch('/api/workspaces');
    if (response.status === 401) { location.href = '/login'; return; }
    if (response.ok) setItems(await response.json());
  }
  useEffect(() => { void load(); }, []);

  async function createWorkspace(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/workspaces', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    if (response.ok) { setName(''); await load(); }
  }

  async function createDoc(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: selected, title: docTitle }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setDocTitle(''); await load(); }
    else setTeamMessage(data.error || 'Could not create page.');
  }

  async function loadMembers(workspaceId: string) {
    setTeamMessage('');
    const response = await fetch(`/api/workspaces/${workspaceId}/members`);
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setMembers(data.members || []);
      setCurrentRole(data.currentRole || 'VIEWER');
      setCurrentMembershipId(data.currentMembershipId || '');
      setManageWorkspace(workspaceId);
    } else setTeamMessage(data.error || 'Could not load members.');
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!manageWorkspace) return;
    setTeamMessage('');
    const response = await fetch(`/api/workspaces/${manageWorkspace}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setInviteEmail(''); setTeamMessage('Member added successfully.'); await loadMembers(manageWorkspace); }
    else setTeamMessage(data.error || 'Could not add member.');
  }

  async function updateRole(member: Member, role: Role) {
    setTeamMessage('');
    const response = await fetch(`/api/workspaces/${manageWorkspace}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId: member.id, role }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setTeamMessage('Member role updated.'); await loadMembers(manageWorkspace); }
    else setTeamMessage(data.error || 'Could not update role.');
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Remove ${member.user.name} (${member.user.email}) from this workspace?`)) return;
    setTeamMessage('');
    const response = await fetch(`/api/workspaces/${manageWorkspace}/members`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ membershipId: member.id }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setTeamMessage('Member removed.'); await loadMembers(manageWorkspace); }
    else setTeamMessage(data.error || 'Could not remove member.');
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">✦ CollabSpace</div>
        <button className="secondary" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/login'; }}>Log out</button>
      </header>
      <h1 className="page-title">Your workspaces</h1>
      <p className="muted">Team spaces and shared pages, all in one place.</p>
      <section className="panel" style={{ margin: '20px 0' }}>
        <form className="row" onSubmit={createWorkspace}>
          <input style={{ maxWidth: 400 }} placeholder="New workspace name" value={name} onChange={event => setName(event.target.value)} required />
          <button>Create workspace</button>
        </form>
      </section>

      {items.length === 0 ? <div className="panel">Loading workspaces…</div> : <div className="grid">
        {items.map(workspace => <section className="panel" key={workspace.id}>
          <h2>{workspace.name}</h2>
          <div className="stack">
            {workspace.documents.map(doc => <a className="comment" key={doc.id} href={`/documents/${doc.id}`}>
              📄 {doc.title}<div className="muted" style={{ fontSize: 12 }}>Open page →</div>
            </a>)}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="secondary" disabled={!['OWNER', 'EDITOR'].includes(workspace.memberships?.[0]?.role || 'VIEWER')} onClick={() => setSelected(selected === workspace.id ? '' : workspace.id)}>＋ Add page</button>
            <button className="secondary" onClick={() => manageWorkspace === workspace.id ? setManageWorkspace('') : void loadMembers(workspace.id)}>
              {manageWorkspace === workspace.id ? 'Close team' : 'Manage team'}
            </button>
          </div>
          {selected === workspace.id && <form className="stack" style={{ marginTop: 10 }} onSubmit={createDoc}>
            <input placeholder="Page title" value={docTitle} onChange={event => setDocTitle(event.target.value)} required />
            <button>Create page</button>
          </form>}
          {manageWorkspace === workspace.id && <div className="stack" style={{ marginTop: 16 }}>
            <h3>Workspace members</h3>
            {currentRole === 'OWNER' && <form className="stack" onSubmit={inviteMember}>
              <input type="email" placeholder="Registered user's email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} required />
              <div className="row">
                <select value={inviteRole} onChange={event => setInviteRole(event.target.value as Role)} aria-label="Role for new member">
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <button>Add member</button>
              </div>
              <p className="muted" style={{ fontSize: 12 }}>The person must already have a CollabSpace account. This adds them directly; it does not send an email.</p>
            </form>}
            {members.map(member => <div className="comment" key={member.id}>
              <strong>{member.user.name}</strong>
              <div className="muted" style={{ fontSize: 12 }}>{member.user.email}</div>
              <div className="row" style={{ marginTop: 8 }}>
                {currentRole === 'OWNER' && member.id !== currentMembershipId
                  ? <select value={member.role} onChange={event => void updateRole(member, event.target.value as Role)} aria-label={`Role for ${member.user.name}`}>
                      {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  : <span className="muted">Role: {member.role}{member.id === currentMembershipId ? ' (you)' : ''}</span>}
                {currentRole === 'OWNER' && member.id !== currentMembershipId && <button className="danger" onClick={() => void removeMember(member)}>Remove</button>}
              </div>
            </div>)}
          </div>}
          {teamMessage && manageWorkspace === workspace.id && <p role="status" className="muted" style={{ marginTop: 10 }}>{teamMessage}</p>}
        </section>)}
      </div>}
    {teamMessage && !manageWorkspace && <p role="status" className="muted">{teamMessage}</p>}
  </main>
  );
}

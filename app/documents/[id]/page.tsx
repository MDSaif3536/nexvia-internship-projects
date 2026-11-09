import {getSession} from '@/lib/auth';import {redirect} from 'next/navigation';import Editor from '@/components/Editor';
export default async function DocumentPage({params}:{params:Promise<{id:string}>}){const user=await getSession();if(!user)redirect('/login');const {id}=await params;return <Editor documentId={id} userName={user.name} userId={user.id}/>;}

import {prisma} from '../lib/prisma';import bcrypt from 'bcryptjs';
async function main(){const email='demo@collabspace.local';const user=await prisma.user.upsert({where:{email},update:{},create:{name:'Demo User',email,passwordHash:await bcrypt.hash('demo-password-123',12)}});const ws=await prisma.workspace.create({data:{name:'Demo Team',memberships:{create:{userId:user.id,role:'OWNER'}},documents:{create:[{title:'Team notes'},{title:'Product ideas'}]}}});console.log('Demo account: demo@collabspace.local / demo-password-123',ws.id);}
main().finally(()=>prisma.$disconnect());

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'login.test@example.com';
  const password = process.argv[3] || 'Test@1234';
  const name = process.argv[4] || 'Login Test';

  const passwordHash = bcrypt.hashSync(password, 10);
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 3);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    if (exists.password) {
      console.log(`User with email ${email} already exists and has a password set. Skip creation.`);
      return;
    }
    const updated = await prisma.user.update({
      where: { email },
      data: { password: passwordHash },
    });
    console.log(`Updated existing user ${email} with password.`);
    console.log(updated);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      initials,
      role: 'Tester',
      department: 'QA',
      status: 'Active',
    },
  });

  console.log('Created user:', user);
  console.log(`Login credentials -> email: ${email}, password: ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });

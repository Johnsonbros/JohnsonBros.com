
import { db } from '../server/db';
import { adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    console.log('Resetting admin password...');
    const email = 'admin@example.com';
    const password = 'secure_password_here';

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Check if user exists
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

    if (user) {
        console.log(`Updating existing user ${email}...`);
        await db.update(adminUsers)
            .set({ passwordHash: hash, isActive: true, lockedUntil: null, failedLoginAttempts: 0 })
            .where(eq(adminUsers.email, email));
        console.log('Password updated.');
    } else {
        console.log(`Creating new user ${email}...`);
        await db.insert(adminUsers).values({
            email,
            passwordHash: hash,
            firstName: 'Admin',
            lastName: 'User',
            role: 'super_admin',
            isActive: true
        });
        console.log('User created.');
    }
    process.exit(0);
}

resetAdmin().catch(console.error);

#!/usr/bin/env tsx

import { db } from '../server/db';
import { adminUsers, adminPermissions } from '@shared/schema';
import { hashPassword } from '../server/src/auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import * as readline from 'readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function setupAdmin() {
  console.log('=== Admin Setup Script ===\n');

  try {
    // Check if environment variables are set
    const envEmail = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const envPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD;
    const envName = process.env.SUPER_ADMIN_NAME;
    const envFirstName = process.env.ADMIN_FIRST_NAME;
    const envLastName = process.env.ADMIN_LAST_NAME;
    
    if (envEmail && envPassword) {
      console.log('📋 Environment variables detected. Using them for setup...\n');
    }

    // Check if any admins exist
    const existingAdmins = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.role, 'super_admin'))
      .limit(1);

    if (existingAdmins.length > 0) {
      console.log('⚠️  A super admin already exists.');
      
      // If env vars are set and admin exists, skip creation
      if (envEmail && envPassword) {
        console.log('Skipping creation as super admin already exists.');
        process.exit(0);
      }
      
      const overwrite = await rl.question('Do you want to create another super admin? (y/N): ');
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }

    // Collect admin information (use env vars as defaults)
    let email: string;
    let firstName: string;
    let lastName: string;
    let password: string;

    if (envEmail) {
      email = envEmail;
      console.log(`Using email from environment: ${email}`);
    } else {
      console.log('\nPlease provide the following information:\n');
      email = await rl.question('Email address: ');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }

    // Handle name parsing
    if (envName) {
      const nameParts = envName.split(' ');
      firstName = nameParts[0] || 'Admin';
      lastName = nameParts.slice(1).join(' ') || 'User';
      console.log(`Using name from SUPER_ADMIN_NAME: ${firstName} ${lastName}`);
    } else if (envFirstName || envLastName) {
      firstName = envFirstName || await rl.question('First name: ');
      lastName = envLastName || await rl.question('Last name: ');
    } else {
      firstName = await rl.question('First name: ');
      lastName = await rl.question('Last name: ');
    }

    if (!firstName || firstName.length < 1) {
      throw new Error('First name is required');
    }
    if (!lastName || lastName.length < 1) {
      throw new Error('Last name is required');
    }

    // Handle password
    if (envPassword) {
      password = envPassword;
      console.log('Using password from environment variable');
      if (password.length < 12) {
        throw new Error('Password from environment must be at least 12 characters');
      }
    } else {
      // Generate secure password or allow custom
      const useCustomPassword = await rl.question('Use custom password? (y/N): ');
      
      if (useCustomPassword.toLowerCase() === 'y') {
        password = await rl.question('Password (min 12 characters): ');
        if (password.length < 12) {
          throw new Error('Password must be at least 12 characters');
        }
      } else {
        // Generate secure random password
        password = crypto.randomBytes(16).toString('base64');
        console.log(`\n🔐 Generated secure password: ${password}`);
        console.log('⚠️  SAVE THIS PASSWORD - IT WILL NOT BE SHOWN AGAIN\n');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const [newAdmin] = await db.insert(adminUsers).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'super_admin',
      isActive: true,
      lastLoginAt: null,
    }).returning();

    // Initialize permissions for super_admin if not exists
    const existingPermissions = await db.select()
      .from(adminPermissions)
      .where(eq(adminPermissions.role, 'super_admin'))
      .limit(1);

    if (existingPermissions.length === 0) {
      await db.insert(adminPermissions).values({
        role: 'super_admin',
        permissions: [
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'dashboard.view', 'dashboard.customize',
          'reports.view', 'reports.create', 'reports.export',
          'blog.view', 'blog.create', 'blog.edit', 'blog.delete',
          'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign',
          'ai.chat', 'ai.generate_documents',
          'customers.view', 'customers.edit',
          'jobs.view', 'jobs.edit',
          'billing.view', 'billing.edit',
          'settings.view', 'settings.edit',
          'google_ads.view', 'google_ads.edit',
          'analytics.view',
        ],
      });
    }

    console.log('\n✅ Super admin created successfully!');
    console.log('\nAdmin Details:');
    console.log('─────────────');
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Role: super_admin`);
    console.log('\nYou can now login at /admin with these credentials.\n');

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run setup
setupAdmin();
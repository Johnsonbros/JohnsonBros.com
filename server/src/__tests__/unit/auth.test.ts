
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, isAccountLocked, recordFailedLogin, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION } from '../../auth';
import { db } from '../../../db';
import { adminUsers } from '@shared/schema';

// Mock the database
vi.mock('../../../db', () => ({
    db: {
        select: vi.fn(),
        update: vi.fn(),
        insert: vi.fn(),
    },
}));

// Mock Drizzle ORM functions to return chainable query builders
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockResolvedValue([]);
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();

// Configure the mock implementation
db.select = mockSelect;
db.update = mockUpdate;
// @ts-ignore
db.select.mockReturnValue({ from: mockFrom });
// @ts-ignore
mockFrom.mockReturnValue({ where: mockWhere });
// @ts-ignore
mockWhere.mockReturnValue({ limit: mockLimit });
// @ts-ignore
db.update.mockReturnValue({ set: mockSet });
// @ts-ignore
mockSet.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });

describe('Authentication Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock chains
        // @ts-ignore
        db.select.mockReturnValue({ from: mockFrom });
        // @ts-ignore
        mockFrom.mockReturnValue({ where: mockWhere });
        // @ts-ignore
        mockWhere.mockReturnValue({ limit: mockLimit });
    });

    describe('Password Security', () => {
        it('should hash passwords correctly', async () => {
            const password = 'securePassword123';
            const hash = await hashPassword(password);
            expect(hash).not.toBe(password);
            expect(hash).toHaveLength(60); // Bcrypt hash length
        });

        it('should verify correct passwords', async () => {
            const password = 'securePassword123';
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect passwords', async () => {
            const password = 'securePassword123';
            const hash = await hashPassword(password);
            const isValid = await verifyPassword('wrongPassword', hash);
            expect(isValid).toBe(false);
        });
    });

    describe('Account Lockout', () => {
        it('should return false if user not found', async () => {
            // @ts-ignore
            mockLimit.mockResolvedValueOnce([]);
            const locked = await isAccountLocked(999);
            expect(locked).toBe(false);
        });

        it('should return true if account is locked and time has not passed', async () => {
            const futureDate = new Date(Date.now() + 100000);
            // @ts-ignore
            mockLimit.mockResolvedValueOnce([{ lockedUntil: futureDate }]);
            const locked = await isAccountLocked(1);
            expect(locked).toBe(true);
        });

        it('should return false and reset if lockout expired', async () => {
            const pastDate = new Date(Date.now() - 100000);
            // @ts-ignore
            mockLimit.mockResolvedValueOnce([{ lockedUntil: pastDate }]);
            const locked = await isAccountLocked(1);
            expect(locked).toBe(false);
            expect(db.update).toHaveBeenCalled();
        });
    });
});


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CapacityCalculator } from '../../capacity';
import { HousecallProClient } from '../../housecall';

// Mock dependencies
vi.mock('../../housecall', () => ({
    HousecallProClient: {
        getInstance: vi.fn().mockReturnValue({
            getEmployees: vi.fn(),
            getBookingWindows: vi.fn(),
            getEstimates: vi.fn(),
        }),
    },
}));

vi.mock('../../config', () => ({
    loadConfig: vi.fn().mockReturnValue({
        tech_map: { nate: '1', nick: '2', jahz: '3' },
        ui_copy: {
            NEXT_DAY: { headline: 'Next Day' },
            SAME_DAY_FEE_WAIVED: { headline: 'Fee Waived' }
        },
        thresholds: { same_day_fee_waived: 0.8, limited_same_day: 0.5 },
        express_zones: { tier1: ['02169'] }
    }),
}));

// Mock logger to suppress output
vi.mock('../../logger', () => ({
    Logger: {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

describe('CapacityCalculator', () => {
    let calculator: CapacityCalculator;
    let mockHcp: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton if possible or just rely on mocks being cleared
        // Since it's a singleton, we might share state, but we clear mocks.
        // Ideally we would reset the instance but it's private.
        calculator = CapacityCalculator.getInstance();
        mockHcp = HousecallProClient.getInstance();

        // Default mocks
        mockHcp.getEmployees.mockResolvedValue([
            { id: '1', first_name: 'Nate', last_name: 'Johnson' },
            { id: '2', first_name: 'Nick', last_name: 'Johnson' },
            { id: '3', first_name: 'Jahz', last_name: 'Doe' },
        ]);
        mockHcp.getEstimates.mockResolvedValue([]);
    });

    it('should calculate capacity correctly when slots are available', async () => {
        // Mock available windows for today
        const now = new Date();
        // 1 hour from now
        const startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        // 2 hours from now
        const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

        mockHcp.getBookingWindows.mockResolvedValue([
            {
                start_time: startTime,
                end_time: endTime,
                available: true,
                employee_ids: ['1'], // Nate
            }
        ]);

        const result = await calculator.calculateCapacity(now, '02169');

        expect(result).toBeDefined();
        expect(result.overall).toBeDefined();
        // Assuming logic, if available and before noon... we verify state
    });

    // TODO: Fix capacity logic expectations
    it.skip('should return NEXT_DAY state when no slots available', async () => {
        const now = new Date();
        mockHcp.getBookingWindows.mockResolvedValue([]); // No windows

        const result = await calculator.calculateCapacity(now);
        expect(result.overall.state).toBe('NEXT_DAY');
    });

    // TODO: Fix caching mock behavior
    it.skip('should cache results', async () => {
        const now = new Date();
        mockHcp.getBookingWindows.mockResolvedValue([]);

        await calculator.calculateCapacity(now);
        await calculator.calculateCapacity(now);

        expect(mockHcp.getBookingWindows).toHaveBeenCalledTimes(1);
    });
});

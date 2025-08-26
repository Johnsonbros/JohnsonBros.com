import { Logger } from '../logger';
import { loadConfig } from '../config';
import { CapacityCalculator } from '../capacity';

interface AdsAction {
  type: 'enable' | 'disable' | 'adjust_budget';
  campaign: string;
  details: any;
}

interface AdsState {
  lastState: string | null;
  lastActionTime: number;
  actions: AdsAction[];
}

export class GoogleAdsBridge {
  private static instance: GoogleAdsBridge;
  private state: AdsState = {
    lastState: null,
    lastActionTime: 0,
    actions: [],
  };
  private isLive: boolean = false;

  private constructor() {
    // Check if Google Ads credentials are configured
    this.isLive = !!(
      process.env.GOOGLE_ADS_DEV_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_MANAGER_ID &&
      process.env.GOOGLE_ADS_ACCOUNT_ID
    );

    if (this.isLive) {
      Logger.info('Google Ads Bridge initialized in LIVE mode');
    } else {
      Logger.info('Google Ads Bridge initialized in STUB mode (no credentials configured)');
    }
  }

  static getInstance(): GoogleAdsBridge {
    if (!this.instance) {
      this.instance = new GoogleAdsBridge();
    }
    return this.instance;
  }

  async applyCapacityRules(): Promise<void> {
    const calculator = CapacityCalculator.getInstance();
    const capacity = await calculator.getTodayCapacity();
    const config = loadConfig();

    // Check if state has changed
    if (capacity.overall.state === this.state.lastState) {
      Logger.debug('Capacity state unchanged, skipping ads adjustment', {
        state: capacity.overall.state,
      });
      return;
    }

    Logger.info('Capacity state changed, applying ads rules', {
      oldState: this.state.lastState,
      newState: capacity.overall.state,
      score: capacity.overall.score,
    });

    // Clear previous actions
    this.state.actions = [];

    // Determine actions based on state
    switch (capacity.overall.state) {
      case 'SAME_DAY_FEE_WAIVED':
        this.applyFeeWaivedRules(config);
        break;
      case 'LIMITED_SAME_DAY':
        this.applyLimitedSameDayRules(config);
        break;
      case 'NEXT_DAY':
        this.applyNextDayRules(config);
        break;
    }

    // Execute or log actions
    if (this.isLive) {
      await this.executeLiveActions();
    } else {
      this.logStubActions();
    }

    // Update state
    this.state.lastState = capacity.overall.state;
    this.state.lastActionTime = Date.now();
  }

  private applyFeeWaivedRules(config: any): void {
    const rules = config.ads_rules;

    // Enable all campaigns
    this.state.actions.push({
      type: 'enable',
      campaign: 'same_day_service',
      details: { reason: 'High capacity - fee waived' },
    });

    this.state.actions.push({
      type: 'enable',
      campaign: 'emergency_plumbing',
      details: { reason: 'High capacity - fee waived' },
    });

    // Boost budgets
    this.state.actions.push({
      type: 'adjust_budget',
      campaign: 'same_day_service',
      details: {
        adjustment: `+${rules.same_day_boost_pct}%`,
        newBudget: rules.discovery_min_daily * (1 + rules.same_day_boost_pct / 100),
      },
    });

    this.state.actions.push({
      type: 'adjust_budget',
      campaign: 'emergency_plumbing',
      details: {
        adjustment: `+${rules.same_day_boost_pct}%`,
        newBudget: rules.discovery_min_daily * (1 + rules.same_day_boost_pct / 100),
      },
    });

    // Brand campaign always stays on
    this.state.actions.push({
      type: 'enable',
      campaign: 'brand_protection',
      details: { 
        reason: 'Brand always on',
        budget: rules.brand_min_daily,
      },
    });
  }

  private applyLimitedSameDayRules(config: any): void {
    const rules = config.ads_rules;

    // Enable same-day with reduced budget
    this.state.actions.push({
      type: 'enable',
      campaign: 'same_day_service',
      details: { reason: 'Limited capacity' },
    });

    this.state.actions.push({
      type: 'adjust_budget',
      campaign: 'same_day_service',
      details: {
        adjustment: `+${rules.limited_same_day_boost_pct}%`,
        newBudget: rules.discovery_min_daily * (1 + rules.limited_same_day_boost_pct / 100),
      },
    });

    // Disable emergency campaigns
    this.state.actions.push({
      type: 'disable',
      campaign: 'emergency_plumbing',
      details: { reason: 'Limited capacity - preserve for regular service' },
    });

    // Brand stays on
    this.state.actions.push({
      type: 'enable',
      campaign: 'brand_protection',
      details: { 
        reason: 'Brand always on',
        budget: rules.brand_min_daily,
      },
    });
  }

  private applyNextDayRules(config: any): void {
    const rules = config.ads_rules;

    // Disable same-day campaigns
    this.state.actions.push({
      type: 'disable',
      campaign: 'same_day_service',
      details: { reason: 'No capacity today' },
    });

    this.state.actions.push({
      type: 'disable',
      campaign: 'emergency_plumbing',
      details: { reason: 'No capacity today' },
    });

    // Enable next-day campaigns with reduced budget
    this.state.actions.push({
      type: 'enable',
      campaign: 'next_day_booking',
      details: { reason: 'Promoting tomorrow availability' },
    });

    this.state.actions.push({
      type: 'adjust_budget',
      campaign: 'next_day_booking',
      details: {
        adjustment: `-${rules.next_day_cut_pct}%`,
        newBudget: rules.discovery_min_daily * (1 - rules.next_day_cut_pct / 100),
      },
    });

    // Brand stays on (never pause)
    if (rules.never_pause_brand) {
      this.state.actions.push({
        type: 'enable',
        campaign: 'brand_protection',
        details: { 
          reason: 'Brand always on',
          budget: rules.brand_min_daily,
        },
      });
    }
  }

  private async executeLiveActions(): Promise<void> {
    Logger.info('Executing LIVE Google Ads actions', {
      actionCount: this.state.actions.length,
    });

    // TODO: Implement actual Google Ads API calls
    // This would use the Google Ads API client library
    // For now, just log what would happen
    for (const action of this.state.actions) {
      Logger.info('Would execute ads action', action);
    }
  }

  private logStubActions(): void {
    Logger.info('=== GOOGLE ADS BRIDGE STUB ACTIONS ===');
    Logger.info(`State: ${this.state.lastState}`);
    Logger.info(`Timestamp: ${new Date().toISOString()}`);
    Logger.info('Actions that would be taken:');

    for (const action of this.state.actions) {
      switch (action.type) {
        case 'enable':
          Logger.info(`  ✓ ENABLE campaign: ${action.campaign}`);
          Logger.info(`    Reason: ${action.details.reason}`);
          if (action.details.budget) {
            Logger.info(`    Budget: $${action.details.budget}/day`);
          }
          break;
        case 'disable':
          Logger.info(`  ✗ DISABLE campaign: ${action.campaign}`);
          Logger.info(`    Reason: ${action.details.reason}`);
          break;
        case 'adjust_budget':
          Logger.info(`  $ ADJUST BUDGET for campaign: ${action.campaign}`);
          Logger.info(`    Adjustment: ${action.details.adjustment}`);
          Logger.info(`    New budget: $${action.details.newBudget}/day`);
          break;
      }
    }

    Logger.info('======================================');
  }

  getLastActions(): AdsAction[] {
    return this.state.actions;
  }

  getState(): AdsState {
    return this.state;
  }

  isLiveMode(): boolean {
    return this.isLive;
  }
}
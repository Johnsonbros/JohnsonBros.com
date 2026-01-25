import { db } from '../db';
import { promotions } from '@shared/schema';

export const PROMOTIONS_DATA = [
  {
    name: "The Family Discount",
    type: "bundle",
    code: "FAMILY99",
    description: "Annual membership program for $99/year. Members receive priority scheduling, waived service call fees on every visit, 10% discount on all repair work, and one referral gift per year. Perfect for homeowners who want peace of mind and savings on all their plumbing needs.",
    shortDescription: "$99/year membership with priority service & 10% off all work",
    discountType: "waived_fee",
    discountValue: 99,
    applicableServices: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Membership valid for one year from purchase date. Service fee waiver applies to standard service calls only. 10% discount applies to labor and parts. Cannot be combined with other discounts unless marked as stackable.",
    restrictions: "One membership per household. Must be renewed annually.",
    priority: 100,
    isStackable: false,
    isActive: true,
    isFeatured: true,
    metadata: {
      benefits: [
        "Priority scheduling - jump to the front of the line",
        "Waived $99 service call fee on every visit",
        "10% discount on all labor and parts",
        "One referral gift per year (give a friend $50 off)",
        "Annual plumbing inspection included"
      ],
      annual_value_estimate: 500,
      target_audience: "homeowners"
    }
  },
  {
    name: "Winter Freeze Prevention Special",
    type: "seasonal",
    code: "WINTER25",
    description: "Protect your pipes this winter! Get 15% off pipe insulation and freeze prevention services. Our technicians will inspect vulnerable pipes and install insulation to prevent costly freeze damage. Includes a free water heater efficiency check.",
    shortDescription: "15% off pipe insulation & freeze prevention",
    discountType: "percentage",
    discountValue: 15,
    applicableServices: ["pipe_repair", "general_plumbing"],
    terms: "Valid for pipe insulation and freeze prevention services only. Cannot be combined with The Family Discount.",
    restrictions: "Offer valid November through March. New customers only.",
    priority: 80,
    isStackable: false,
    isActive: true,
    isFeatured: true,
    startDate: new Date('2025-11-01'),
    endDate: new Date('2026-03-31'),
    metadata: {
      season: "winter",
      services_included: ["pipe insulation", "heat tape installation", "water heater check"],
      typical_savings: 75
    }
  },
  {
    name: "First-Time Customer Discount",
    type: "coupon",
    code: "WELCOME50",
    description: "New to Johnson Bros. Plumbing? Welcome! Enjoy $50 off your first service call. We're confident you'll love our professional service and become a customer for life.",
    shortDescription: "$50 off your first service",
    discountType: "fixed_amount",
    discountValue: 50,
    minimumPurchase: 150,
    applicableServices: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Valid for first-time customers only. Minimum service of $150 required. One use per household.",
    restrictions: "Cannot be combined with other offers. Valid for residential customers only.",
    priority: 90,
    isStackable: false,
    isActive: true,
    isFeatured: true,
    metadata: {
      target_audience: "new_customers",
      conversion_goal: "first_booking"
    }
  },
  {
    name: "Water Heater Replacement Rebate",
    type: "rebate",
    code: null,
    description: "Replace your old water heater and receive a $100 rebate! Upgrade to an energy-efficient model and save on your utility bills while enjoying endless hot water. We handle the installation and haul away your old unit for free.",
    shortDescription: "$100 rebate on new water heater installation",
    discountType: "fixed_amount",
    discountValue: 100,
    minimumPurchase: 800,
    applicableServices: ["water_heater_service"],
    terms: "Rebate applied after installation. Valid for tank or tankless water heater replacements. Old unit removal included.",
    restrictions: "Must be a full replacement, not repair. Available while funding lasts.",
    priority: 70,
    isStackable: true,
    isActive: true,
    isFeatured: false,
    metadata: {
      rebate_type: "post_service",
      eligible_products: ["tank water heater", "tankless water heater", "hybrid water heater"],
      environmental_benefit: "Energy efficient upgrade"
    }
  },
  {
    name: "Senior Citizen Discount",
    type: "deal",
    code: "SENIOR10",
    description: "We appreciate our senior community! Customers 65 and older receive 10% off all services. Just mention this discount when booking or show valid ID to your technician.",
    shortDescription: "10% off for customers 65+",
    discountType: "percentage",
    discountValue: 10,
    applicableServices: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair", "general_plumbing"],
    terms: "Valid for customers 65 years and older. Must provide valid ID upon request.",
    restrictions: "Cannot be combined with The Family Discount. One discount per service.",
    priority: 60,
    isStackable: false,
    isActive: true,
    isFeatured: false,
    metadata: {
      age_requirement: 65,
      verification: "valid_id"
    }
  },
  {
    name: "Military & First Responder Discount",
    type: "deal",
    code: "HERO15",
    description: "Thank you for your service! Active military, veterans, police, firefighters, and EMTs receive 15% off all services. We're honored to serve those who serve our community.",
    shortDescription: "15% off for military & first responders",
    discountType: "percentage",
    discountValue: 15,
    applicableServices: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair", "general_plumbing"],
    terms: "Valid for active military, veterans, police, firefighters, and EMTs. Valid ID or proof of service required.",
    restrictions: "Cannot be combined with other percentage discounts.",
    priority: 65,
    isStackable: false,
    isActive: true,
    isFeatured: false,
    metadata: {
      eligible_groups: ["active_military", "veterans", "police", "firefighters", "emts", "paramedics"],
      verification: "valid_id_or_badge"
    }
  },
  {
    name: "Drain Cleaning Bundle",
    type: "bundle",
    code: "DRAIN2FOR1",
    description: "Got multiple slow drains? Book our drain cleaning bundle - get your second drain cleaned at 50% off! Perfect for kitchen and bathroom combos or multiple bathroom homes.",
    shortDescription: "50% off second drain cleaning",
    discountType: "percentage",
    discountValue: 50,
    applicableServices: ["drain_cleaning"],
    terms: "Second drain must be cleaned during the same service visit. Both drains must be at the same property.",
    restrictions: "Cannot be combined with other drain cleaning offers.",
    priority: 55,
    isStackable: false,
    isActive: true,
    isFeatured: false,
    metadata: {
      bundle_type: "multi_service",
      typical_savings: 75
    }
  },
  {
    name: "Referral Reward",
    type: "deal",
    code: "REFER50",
    description: "Love our service? Refer a friend and you both win! Your friend gets $50 off their first service, and you receive a $50 credit toward your next service call.",
    shortDescription: "Give $50, Get $50 referral program",
    discountType: "fixed_amount",
    discountValue: 50,
    applicableServices: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Referral must complete a paid service of $100 or more. Credit applied to referrer's next service.",
    restrictions: "Referral must be a new customer. Unlimited referrals allowed.",
    priority: 50,
    isStackable: true,
    isActive: true,
    isFeatured: false,
    metadata: {
      program_type: "referral",
      reward_structure: {
        referrer: 50,
        referee: 50
      }
    }
  }
];

export async function seedPromotions(): Promise<void> {
  console.log('Seeding promotions data...');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const promo of PROMOTIONS_DATA) {
    try {
      await db.insert(promotions).values(promo as any).onConflictDoNothing();
      inserted++;
    } catch (error: any) {
      if (error.code === '23505') {
        skipped++;
      } else {
        console.error(`Failed to insert promotion ${promo.name}:`, error.message);
      }
    }
  }
  
  console.log(`Promotions seeded: ${inserted} inserted, ${skipped} skipped (already exist)`);
}

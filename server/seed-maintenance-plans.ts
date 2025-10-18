import { db } from "./db";
import { 
  maintenancePlans, 
  emailTemplates,
  upsellOffers 
} from "@shared/schema";

async function seedMaintenancePlans() {
  console.log("🌱 Seeding maintenance plans...");

  // Seed maintenance plans
  await db.insert(maintenancePlans).values([
    {
      name: "Basic Plan",
      tier: "basic",
      price: 99,
      billingCycle: "annual",
      inspectionsPerYear: 1,
      discountPercentage: 0,
      priorityLevel: "priority",
      features: [
        "Annual plumbing inspection",
        "Priority scheduling",
        "$99 diagnostic fee waived",
        "Email reminders for maintenance",
        "Basic plumbing tips newsletter"
      ],
      description: "Essential coverage for peace of mind",
      isActive: true
    },
    {
      name: "Standard Plan",
      tier: "standard",
      price: 199,
      billingCycle: "annual",
      inspectionsPerYear: 2,
      discountPercentage: 10,
      priorityLevel: "priority",
      features: [
        "Bi-annual plumbing inspections",
        "Priority scheduling",
        "10% discount on all services",
        "$99 diagnostic fee waived",
        "Email & SMS maintenance reminders",
        "Quarterly plumbing tips",
        "Seasonal maintenance checklist"
      ],
      description: "Most popular plan with significant savings",
      isActive: true
    },
    {
      name: "Premium Plan",
      tier: "premium",
      price: 399,
      billingCycle: "annual",
      inspectionsPerYear: 4,
      discountPercentage: 20,
      priorityLevel: "emergency",
      features: [
        "Quarterly plumbing inspections",
        "Emergency priority scheduling",
        "20% discount on all services",
        "$99 diagnostic fee waived",
        "24/7 emergency hotline",
        "Annual water heater flush included",
        "Personalized maintenance plan",
        "Exclusive member perks",
        "Free service call (up to $150 value)"
      ],
      description: "Complete protection with maximum benefits",
      isActive: true
    }
  ]).onConflictDoNothing();

  // Seed email templates
  await db.insert(emailTemplates).values([
    {
      name: "24hr_followup",
      subject: "How was your recent plumbing service?",
      content: `
        <h2>Thank you for choosing Johnson Bros. Plumbing!</h2>
        <p>Hi {{firstName}},</p>
        <p>We hope your {{serviceName}} service yesterday went smoothly. Your satisfaction is our top priority.</p>
        <p><strong>Quick Survey:</strong> How would you rate your experience? [Rate Now Button]</p>
        <h3>Keep Your Plumbing in Top Shape</h3>
        <p>Did you know that regular maintenance can prevent 75% of emergency plumbing issues?</p>
        <p>Consider our maintenance plans starting at just $99/year:</p>
        <ul>
          <li>Annual inspections</li>
          <li>Priority scheduling</li>
          <li>Member discounts</li>
        </ul>
        <p>[Learn More About Maintenance Plans]</p>
      `,
      triggerType: "post_service",
      triggerDelay: 24,
      category: "followup",
      variables: ["firstName", "serviceName", "serviceDate"],
      isActive: true
    },
    {
      name: "7day_followup",
      subject: "Save on future plumbing services with a maintenance plan",
      content: `
        <h2>Protect Your Home with a Maintenance Plan</h2>
        <p>Hi {{firstName}},</p>
        <p>It's been a week since your service visit. We wanted to share an exclusive offer just for you.</p>
        <h3>Special Offer: 10% Off Your First Year</h3>
        <p>Join our maintenance plan family and enjoy:</p>
        <ul>
          <li>Priority scheduling when you need us</li>
          <li>Up to 20% off all services</li>
          <li>Free annual inspections</li>
          <li>Peace of mind year-round</li>
        </ul>
        <p>Use code: SAVE10 at checkout</p>
        <p>[Choose Your Plan]</p>
      `,
      triggerType: "post_service",
      triggerDelay: 168, // 7 days in hours
      category: "upsell",
      variables: ["firstName", "lastServiceDate"],
      isActive: true
    },
    {
      name: "30day_followup",
      subject: "Seasonal plumbing reminder for your home",
      content: `
        <h2>Time for Seasonal Plumbing Maintenance</h2>
        <p>Hi {{firstName}},</p>
        <p>As the season changes, it's important to check your plumbing system.</p>
        <h3>Recommended Services This Month:</h3>
        <ul>
          <li>Water heater inspection</li>
          <li>Drain cleaning</li>
          <li>Pipe insulation check</li>
        </ul>
        <p>As a valued customer, you get 5% off any service this month.</p>
        <p>[Schedule Service]</p>
        <p>P.S. Did you know maintenance plan members get these services at up to 20% off?</p>
      `,
      triggerType: "post_service",
      triggerDelay: 720, // 30 days in hours
      category: "reminder",
      variables: ["firstName"],
      isActive: true
    }
  ]).onConflictDoNothing();

  // Seed upsell offers
  await db.insert(upsellOffers).values([
    {
      triggerService: "drain-cleaning",
      upsellService: "camera-inspection",
      bundlePrice: 249,
      savingsAmount: 50,
      displayOrder: 1,
      title: "Add Camera Inspection",
      description: "See exactly what's in your pipes with our high-tech camera inspection. Bundle with drain cleaning and save $50!",
      isActive: true
    },
    {
      triggerService: "water-heater",
      upsellService: "maintenance-plan",
      bundlePrice: null,
      savingsAmount: 99,
      displayOrder: 1,
      title: "Protect with a Maintenance Plan",
      description: "Keep your water heater running efficiently year-round. Sign up today and we'll waive the $99 diagnostic fee!",
      isActive: true
    },
    {
      triggerService: "pipe-repair",
      upsellService: "whole-home-inspection",
      bundlePrice: 299,
      savingsAmount: 75,
      displayOrder: 1,
      title: "Add Whole Home Inspection",
      description: "One pipe issue could mean more problems. Get a complete home plumbing inspection and save $75 when bundled!",
      isActive: true
    },
    {
      triggerService: "emergency-repair",
      upsellService: "premium-maintenance",
      bundlePrice: null,
      savingsAmount: 199,
      displayOrder: 1,
      title: "Never Have Another Emergency",
      description: "Our Premium Plan includes 24/7 emergency priority and quarterly inspections. First year special: Save $199!",
      isActive: true
    },
    {
      triggerService: "general-plumbing",
      upsellService: "standard-maintenance",
      bundlePrice: null,
      savingsAmount: 50,
      displayOrder: 1,
      title: "Join Our Maintenance Program",
      description: "Get 10% off all future services plus bi-annual inspections. Sign up now and save $50 on your first year!",
      isActive: true
    }
  ]).onConflictDoNothing();

  console.log("✅ Maintenance plans seeded successfully!");
}

seedMaintenancePlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding maintenance plans:", error);
    process.exit(1);
  });
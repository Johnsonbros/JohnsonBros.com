import { dbStorage as storage } from "./dbStorage";
import { type InsertBlogPost, type InsertKeyword } from "@shared/schema";

const samplePosts: InsertBlogPost[] = [
  {
    slug: "prevent-frozen-pipes-winter",
    title: "How to Prevent Frozen Pipes This Winter in Quincy, MA",
    excerpt: "Learn essential tips to protect your home's plumbing from freezing temperatures and avoid costly repairs.",
    content: `## Winter Pipe Protection Guide

Winter in Massachusetts can be brutal on your plumbing system. When temperatures drop below freezing, the water in your pipes can freeze and expand, causing pipes to burst and leading to thousands of dollars in water damage.

### Why Pipes Freeze

Pipes freeze when:
- Temperatures drop below 32°F (0°C)
- Pipes are exposed to cold air
- There's insufficient insulation
- Water isn't moving through the pipes

### Prevention Tips

#### 1. Insulate Your Pipes
Wrap exposed pipes in your basement, crawl spaces, and attic with pipe insulation. This simple step can prevent most freezing issues.

#### 2. Keep Your Home Warm
Maintain a consistent temperature in your home, even when you're away. Set your thermostat no lower than 55°F.

#### 3. Let Faucets Drip
During extreme cold, let cold water drip from faucets served by exposed pipes. Moving water is less likely to freeze.

#### 4. Open Cabinet Doors
Keep kitchen and bathroom cabinet doors open to allow warm air to circulate around pipes under sinks.

#### 5. Seal Air Leaks
Check for air leaks around pipes where they enter your home and seal them with caulk or insulation.

### What to Do If Pipes Freeze

If you turn on a faucet and only a trickle comes out, you may have a frozen pipe:
- Keep the faucet open
- Apply heat to the frozen section using a hair dryer or heating pad
- Never use an open flame
- Call a professional plumber if you can't locate or thaw the frozen pipe

### Professional Help

If you're concerned about frozen pipes or need help winterizing your plumbing, contact Johnson Bros. Plumbing. We offer comprehensive winter plumbing services to keep your pipes safe all season long.`,
    metaTitle: "Prevent Frozen Pipes | Winter Plumbing Tips Quincy MA",
    metaDescription: "Protect your home from frozen pipes this winter with expert tips from Johnson Bros. Plumbing in Quincy, MA. Learn prevention and emergency solutions.",
    author: "Johnson Bros. Plumbing",
    status: "published",
    publishDate: new Date().toISOString(),
    readingTime: 5,
    category: "seasonal",
    tags: ["winter", "frozen pipes", "prevention", "maintenance"]
  },
  {
    slug: "signs-need-water-heater-replacement",
    title: "7 Signs Your Water Heater Needs Replacement",
    excerpt: "Don't wait for a cold shower surprise! Learn the warning signs that indicate it's time for a new water heater.",
    content: `## Is Your Water Heater on Its Last Legs?

Your water heater works hard every day to provide hot water for showers, dishes, and laundry. But like all appliances, water heaters don't last forever. Here are seven signs it might be time for a replacement.

### 1. Age of the Unit
Most water heaters last 8-12 years. If yours is approaching or past this age, it's time to start planning for a replacement.

### 2. Rusty Water
If you notice rusty water coming from your hot water taps, it could indicate your water heater is rusting from the inside and may leak soon.

### 3. Strange Noises
Rumbling, banging, or popping sounds from your water heater indicate sediment buildup. While this can sometimes be fixed with a flush, it often signals the unit is nearing the end of its life.

### 4. Leaks Around the Unit
Any moisture or pooling water around your water heater is a clear sign of trouble. Small leaks can quickly become major floods.

### 5. Insufficient Hot Water
If you're running out of hot water faster than usual, or the water isn't getting as hot as it used to, your water heater may be failing.

### 6. Frequent Repairs
If you're calling for repairs more than once a year, it's probably more cost-effective to replace the unit.

### 7. Higher Energy Bills
An inefficient water heater works harder to heat water, resulting in higher energy costs. New models are much more energy-efficient.

### What to Do Next

If you're experiencing any of these issues, it's time to call a professional. At Johnson Bros. Plumbing, we can assess your water heater and recommend whether repair or replacement is the best option for your home and budget.

We install both traditional tank and tankless water heaters, and we'll help you choose the right size and type for your needs.`,
    metaTitle: "Water Heater Replacement Signs | Quincy MA Plumbing",
    metaDescription: "Discover the 7 warning signs that your water heater needs replacement. Expert advice from Johnson Bros. Plumbing serving Quincy, MA.",
    author: "Johnson Bros. Plumbing",
    status: "published",
    publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 4,
    category: "maintenance",
    tags: ["water heater", "replacement", "maintenance", "home improvement"]
  },
  {
    slug: "diy-vs-professional-plumber",
    title: "DIY vs Professional: When to Call a Plumber in Quincy",
    excerpt: "Save money by knowing which plumbing tasks you can handle yourself and which require professional expertise.",
    content: `## Making the Right Choice for Your Plumbing Needs

As a homeowner, it's tempting to tackle plumbing issues yourself to save money. While some tasks are perfect for DIY, others require professional expertise to avoid costly mistakes or dangerous situations.

### Safe DIY Plumbing Tasks

#### 1. Replacing Faucet Aerators
This simple task can improve water pressure and reduce water usage. Just unscrew the old aerator and screw in the new one.

#### 2. Unclogging Simple Drains
A plunger or hand snake can handle most minor clogs in sinks and toilets.

#### 3. Replacing Toilet Flappers
If your toilet is running constantly, replacing the flapper is an easy fix that takes just minutes.

#### 4. Installing New Showerheads
Most showerheads simply screw on and off, making replacement straightforward.

#### 5. Fixing Running Toilets
Adjusting the float or replacing the fill valve can often solve this common issue.

### When to Call a Professional

#### 1. No Hot Water
Water heater issues can be complex and potentially dangerous. Always call a pro for water heater problems.

#### 2. Low Water Pressure Throughout the House
This could indicate a serious problem with your main water line or a hidden leak.

#### 3. Sewer Line Backups
Sewer issues require specialized equipment and expertise to diagnose and fix properly.

#### 4. Frozen or Burst Pipes
These emergencies need immediate professional attention to prevent extensive water damage.

#### 5. Major Installations
Installing new fixtures, running new pipes, or any work requiring permits should be done by licensed plumbers.

#### 6. Gas Line Work
Never attempt gas line repairs yourself. This is extremely dangerous and requires professional certification.

### The Cost of DIY Mistakes

While DIY can save money on simple tasks, mistakes on complex plumbing can be expensive:
- Water damage from improper installations
- Voided warranties on fixtures
- Code violations that complicate home sales
- Higher repair costs to fix DIY errors

### When in Doubt, Call Johnson Bros.

If you're unsure whether a plumbing task is within your DIY abilities, it's always better to call a professional. At Johnson Bros. Plumbing, we're happy to handle any job, big or small, and we'll always give you an honest assessment of what needs to be done.

Remember: A small leak today can become a major flood tomorrow. Don't risk your home's safety and value – call the experts when you need them.`,
    metaTitle: "DIY vs Professional Plumbing | When to Call | Quincy MA",
    metaDescription: "Learn which plumbing tasks you can DIY and when to call Johnson Bros. Plumbing in Quincy, MA. Save money and avoid costly mistakes.",
    author: "Johnson Bros. Plumbing",
    status: "published",
    publishDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 6,
    category: "tips",
    tags: ["DIY", "professional plumbing", "home maintenance", "tips"]
  }
];

const sampleKeywords: InsertKeyword[] = [
  { keyword: "plumber Quincy MA", searchVolume: 1200, difficulty: 45, competition: "medium", searchIntent: "transactional", isPrimary: true },
  { keyword: "emergency plumber near me", searchVolume: 2400, difficulty: 65, competition: "high", searchIntent: "transactional", isPrimary: true },
  { keyword: "frozen pipes prevention", searchVolume: 800, difficulty: 35, competition: "low", searchIntent: "informational" },
  { keyword: "water heater replacement cost", searchVolume: 1800, difficulty: 55, competition: "medium", searchIntent: "commercial" },
  { keyword: "DIY plumbing tips", searchVolume: 3200, difficulty: 40, competition: "medium", searchIntent: "informational" },
  { keyword: "drain cleaning Quincy", searchVolume: 600, difficulty: 38, competition: "low", searchIntent: "transactional" }
];

async function seedBlogData() {
  console.log("Seeding blog data...");
  
  try {
    // Create keywords first
    const createdKeywords = [];
    for (const keyword of sampleKeywords) {
      const existing = await storage.getKeywordByName(keyword.keyword);
      if (!existing) {
        const created = await storage.createKeyword(keyword);
        createdKeywords.push(created);
        console.log(`Created keyword: ${created.keyword}`);
      }
    }
    
    // Create blog posts
    for (const post of samplePosts) {
      const existing = await storage.getBlogPostBySlug(post.slug);
      if (!existing) {
        const created = await storage.createBlogPost(post);
        console.log(`Created blog post: ${created.title}`);
        
        // Add some keywords to each post
        if (createdKeywords.length > 0) {
          // Add 2-3 keywords per post
          const numKeywords = Math.min(3, createdKeywords.length);
          for (let i = 0; i < numKeywords; i++) {
            await storage.addPostKeyword({
              postId: created.id,
              keywordId: createdKeywords[i].id,
              isPrimary: i === 0,
              keywordDensity: Math.random() * 3 + 1 // 1-4% density
            });
          }
        }
      }
    }
    
    console.log("Blog data seeded successfully!");
  } catch (error) {
    console.error("Error seeding blog data:", error);
  }
}

export { seedBlogData };
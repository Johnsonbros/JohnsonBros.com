// Comprehensive SEO metadata management for all pages

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article' | 'service';
  noindex?: boolean;
  jsonLd?: any;
}

// Service-specific SEO metadata
export const serviceMetadata: Record<string, SEOMetadata> = {
  'drain-cleaning': {
    title: 'Drain Cleaning Services | Clogged Drain Experts | Johnson Bros. Plumbing',
    description: 'Professional drain cleaning in Quincy & South Shore MA. Expert unclogging for kitchen, bathroom & sewer lines. Same-day service available. Call 617-479-9911',
    keywords: ['drain cleaning', 'clogged drain', 'sewer cleaning', 'drain unclogging', 'hydro jetting', 'Quincy MA plumber'],
    canonicalUrl: '/services/drain-cleaning',
    type: 'service'
  },
  'emergency-plumbing': {
    title: '24/7 Emergency Plumber | Immediate Response | Johnson Bros. Plumbing',
    description: '24/7 emergency plumbing services in Quincy & South Shore MA. Burst pipes, water leaks, flooding repairs. Fast response time. Call now: 617-479-9911',
    keywords: ['emergency plumber', '24/7 plumbing', 'burst pipe repair', 'water leak emergency', 'flooding repair', 'urgent plumber Quincy'],
    canonicalUrl: '/services/emergency-plumbing',
    type: 'service'
  },
  'water-heater': {
    title: 'Water Heater Repair & Installation | Hot Water Experts | Johnson Bros.',
    description: 'Water heater repair, replacement & installation in Quincy MA. Tankless & traditional units. Energy-efficient solutions. Same-day service: 617-479-9911',
    keywords: ['water heater repair', 'water heater installation', 'tankless water heater', 'hot water heater', 'water heater replacement', 'Quincy water heater'],
    canonicalUrl: '/services/water-heater',
    type: 'service'
  },
  'pipe-repair': {
    title: 'Pipe Repair & Replacement | Leak Detection | Johnson Bros. Plumbing',
    description: 'Expert pipe repair & replacement services in Quincy MA. Leak detection, pipe relining, copper & PVC repairs. Licensed plumbers. Call 617-479-9911',
    keywords: ['pipe repair', 'pipe replacement', 'leak detection', 'pipe relining', 'burst pipe', 'copper pipe repair'],
    canonicalUrl: '/services/pipe-repair',
    type: 'service'
  },
  'general-plumbing': {
    title: 'General Plumbing Services | Residential & Commercial | Johnson Bros.',
    description: 'Complete plumbing services in Quincy & South Shore MA. Repairs, installations, maintenance for homes & businesses. Licensed & insured. Call 617-479-9911',
    keywords: ['plumber Quincy MA', 'plumbing services', 'residential plumber', 'commercial plumber', 'plumbing repair', 'local plumber'],
    canonicalUrl: '/services/general-plumbing',
    type: 'service'
  },
  'new-construction': {
    title: 'New Construction Plumbing | Installation Services | Johnson Bros.',
    description: 'New construction plumbing installation in Quincy MA. Complete rough-in & finish plumbing for homes & buildings. Licensed contractors. Call 617-479-9911',
    keywords: ['new construction plumbing', 'plumbing installation', 'rough plumbing', 'finish plumbing', 'construction plumber', 'building plumbing'],
    canonicalUrl: '/services/new-construction',
    type: 'service'
  },
  'gas-heat': {
    title: 'Gas Heating Services | Gas Line Installation | Johnson Bros. Plumbing',
    description: 'Gas heating repair & installation in Quincy MA. Gas line services, boiler repair, heating system maintenance. Licensed gas fitters. Call 617-479-9911',
    keywords: ['gas heating', 'gas line installation', 'boiler repair', 'gas fitter', 'heating repair', 'gas plumber Quincy'],
    canonicalUrl: '/services/gas-heat',
    type: 'service'
  }
};

// Service area-specific SEO metadata
export const serviceAreaMetadata: Record<string, SEOMetadata> = {
  'quincy': {
    title: 'Plumber in Quincy, MA | Local Plumbing Services | Johnson Bros.',
    description: 'Trusted local plumber serving Quincy, MA. Emergency plumbing, drain cleaning, water heaters. Family-owned since 2008. Same-day service: 617-479-9911',
    keywords: ['plumber Quincy MA', 'Quincy plumbing', 'local plumber Quincy', 'emergency plumber Quincy', 'Quincy drain cleaning'],
    canonicalUrl: '/service-areas/quincy',
    type: 'website'
  },
  'braintree': {
    title: 'Plumber in Braintree, MA | Expert Plumbing Services | Johnson Bros.',
    description: 'Professional plumber serving Braintree, MA. 24/7 emergency service, drain cleaning, pipe repair. Licensed & insured. Fast response: 617-479-9911',
    keywords: ['plumber Braintree MA', 'Braintree plumbing', 'emergency plumber Braintree', 'drain cleaning Braintree', 'local plumber Braintree'],
    canonicalUrl: '/service-areas/braintree',
    type: 'website'
  },
  'weymouth': {
    title: 'Plumber in Weymouth, MA | Reliable Plumbing Services | Johnson Bros.',
    description: 'Expert plumber serving Weymouth, MA. Emergency repairs, water heater service, drain cleaning. Family-owned, trusted service. Call 617-479-9911',
    keywords: ['plumber Weymouth MA', 'Weymouth plumbing', 'emergency plumber Weymouth', 'Weymouth water heater', 'drain cleaning Weymouth'],
    canonicalUrl: '/service-areas/weymouth',
    type: 'website'
  },
  'plymouth': {
    title: 'Plumber in Plymouth, MA | Quality Plumbing Services | Johnson Bros.',
    description: 'Reliable plumber serving Plymouth, MA. Complete plumbing services, 24/7 emergency repairs, drain cleaning. Licensed professionals: 617-479-9911',
    keywords: ['plumber Plymouth MA', 'Plymouth plumbing', 'emergency plumber Plymouth', 'Plymouth drain service', 'local plumber Plymouth'],
    canonicalUrl: '/service-areas/plymouth',
    type: 'website'
  },
  'marshfield': {
    title: 'Plumber in Marshfield, MA | Professional Plumbing | Johnson Bros.',
    description: 'Trusted plumber serving Marshfield, MA. Emergency service, drain cleaning, pipe repair, water heaters. Same-day availability: 617-479-9911',
    keywords: ['plumber Marshfield MA', 'Marshfield plumbing', 'emergency plumber Marshfield', 'Marshfield drain cleaning', 'pipe repair Marshfield'],
    canonicalUrl: '/service-areas/marshfield',
    type: 'website'
  },
  'hingham': {
    title: 'Plumber in Hingham, MA | Premium Plumbing Services | Johnson Bros.',
    description: 'Professional plumber serving Hingham, MA. Full-service plumbing, emergency repairs, drain cleaning. Family-owned since 2008. Call 617-479-9911',
    keywords: ['plumber Hingham MA', 'Hingham plumbing', 'emergency plumber Hingham', 'Hingham water heater', 'drain service Hingham'],
    canonicalUrl: '/service-areas/hingham',
    type: 'website'
  },
  'abington': {
    title: 'Plumber in Abington, MA | Trusted Plumbing Services | Johnson Bros.',
    description: 'Local plumber serving Abington, MA with emergency repairs, drain cleaning, and water heater service. Family-owned, licensed & insured. Call 617-479-9911',
    keywords: ['plumber Abington MA', 'Abington plumbing', 'emergency plumber Abington', 'drain cleaning Abington', 'water heater Abington'],
    canonicalUrl: '/service-areas/abington',
    type: 'website'
  },
  'rockland': {
    title: 'Plumber in Rockland, MA | Reliable Plumbing Solutions | Johnson Bros.',
    description: 'Professional plumber serving Rockland, MA. Emergency plumbing, pipe repair, drain service, and water heaters. Fast response: 617-479-9911',
    keywords: ['plumber Rockland MA', 'Rockland plumbing', 'emergency plumber Rockland', 'drain cleaning Rockland', 'pipe repair Rockland'],
    canonicalUrl: '/service-areas/rockland',
    type: 'website'
  },
  'hanover': {
    title: 'Plumber in Hanover, MA | Local Plumbing Experts | Johnson Bros.',
    description: 'Trusted plumber serving Hanover, MA. 24/7 emergency service, drain cleaning, water heater repair, and gas heat. Call 617-479-9911',
    keywords: ['plumber Hanover MA', 'Hanover plumbing', 'emergency plumber Hanover', 'drain service Hanover', 'water heater Hanover'],
    canonicalUrl: '/service-areas/hanover',
    type: 'website'
  },
  'scituate': {
    title: 'Plumber in Scituate, MA | Coastal Plumbing Pros | Johnson Bros.',
    description: 'Experienced plumber serving Scituate, MA. Emergency repairs, drain cleaning, water heaters, and coastal plumbing solutions. Call 617-479-9911',
    keywords: ['plumber Scituate MA', 'Scituate plumbing', 'emergency plumber Scituate', 'drain cleaning Scituate', 'water heater Scituate'],
    canonicalUrl: '/service-areas/scituate',
    type: 'website'
  },
  'cohasset': {
    title: 'Plumber in Cohasset, MA | Premium Plumbing Services | Johnson Bros.',
    description: 'Local plumber serving Cohasset, MA. Emergency service, drain cleaning, pipe repair, and water heaters. Family-owned since 2008. Call 617-479-9911',
    keywords: ['plumber Cohasset MA', 'Cohasset plumbing', 'emergency plumber Cohasset', 'drain cleaning Cohasset', 'pipe repair Cohasset'],
    canonicalUrl: '/service-areas/cohasset',
    type: 'website'
  },
  'hull': {
    title: 'Plumber in Hull, MA | Trusted Coastal Plumbing | Johnson Bros.',
    description: 'Reliable plumber serving Hull, MA. Emergency plumbing, drain cleaning, water heater service, and pipe repair. Call 617-479-9911',
    keywords: ['plumber Hull MA', 'Hull plumbing', 'emergency plumber Hull', 'drain cleaning Hull', 'water heater Hull'],
    canonicalUrl: '/service-areas/hull',
    type: 'website'
  },
  // NEW SOUTH SHORE TOWNS
  'milton': {
    title: 'Plumber in Milton, MA | Local Plumbing Experts | Johnson Bros.',
    description: 'Professional plumber serving Milton, MA. 24/7 emergency service, drain cleaning, water heater repair. Family-owned, fast response. Call 617-479-9911',
    keywords: ['plumber Milton MA', 'Milton plumbing', 'emergency plumber Milton', 'drain cleaning Milton', 'Milton water heater', 'Milton pipe repair'],
    canonicalUrl: '/service-areas/milton',
    type: 'website'
  },
  'randolph': {
    title: 'Plumber in Randolph, MA | Trusted Plumbing Services | Johnson Bros.',
    description: 'Expert plumber serving Randolph, MA. Emergency plumbing, drain cleaning, water heater installation. Licensed & insured. Call 617-479-9911',
    keywords: ['plumber Randolph MA', 'Randolph plumbing', 'emergency plumber Randolph', 'drain cleaning Randolph', 'Randolph water heater'],
    canonicalUrl: '/service-areas/randolph',
    type: 'website'
  },
  'holbrook': {
    title: 'Plumber in Holbrook, MA | Reliable Plumbing Solutions | Johnson Bros.',
    description: 'Local plumber serving Holbrook, MA. Emergency repairs, drain cleaning, pipe repair, water heaters. Same-day service available. Call 617-479-9911',
    keywords: ['plumber Holbrook MA', 'Holbrook plumbing', 'emergency plumber Holbrook', 'drain cleaning Holbrook', 'Holbrook pipe repair'],
    canonicalUrl: '/service-areas/holbrook',
    type: 'website'
  },
  'norwell': {
    title: 'Plumber in Norwell, MA | Professional Plumbing Services | Johnson Bros.',
    description: 'Trusted plumber serving Norwell, MA. 24/7 emergency plumbing, drain cleaning, water heater service. Fast response time. Call 617-479-9911',
    keywords: ['plumber Norwell MA', 'Norwell plumbing', 'emergency plumber Norwell', 'drain cleaning Norwell', 'Norwell water heater'],
    canonicalUrl: '/service-areas/norwell',
    type: 'website'
  },
  'whitman': {
    title: 'Plumber in Whitman, MA | Expert Plumbing Services | Johnson Bros.',
    description: 'Professional plumber serving Whitman, MA. Emergency service, drain cleaning, water heater repair & installation. Call 617-479-9911',
    keywords: ['plumber Whitman MA', 'Whitman plumbing', 'emergency plumber Whitman', 'drain cleaning Whitman', 'Whitman water heater'],
    canonicalUrl: '/service-areas/whitman',
    type: 'website'
  },
  'pembroke': {
    title: 'Plumber in Pembroke, MA | Local Plumbing Pros | Johnson Bros.',
    description: 'Reliable plumber serving Pembroke, MA. Emergency plumbing, drain cleaning, pipe repair, water heaters. Licensed professionals. Call 617-479-9911',
    keywords: ['plumber Pembroke MA', 'Pembroke plumbing', 'emergency plumber Pembroke', 'drain cleaning Pembroke', 'Pembroke pipe repair'],
    canonicalUrl: '/service-areas/pembroke',
    type: 'website'
  },
  'hanson': {
    title: 'Plumber in Hanson, MA | Trusted Plumbing Services | Johnson Bros.',
    description: 'Expert plumber serving Hanson, MA. 24/7 emergency service, drain cleaning, water heater repair. Family-owned since 2008. Call 617-479-9911',
    keywords: ['plumber Hanson MA', 'Hanson plumbing', 'emergency plumber Hanson', 'drain cleaning Hanson', 'Hanson water heater'],
    canonicalUrl: '/service-areas/hanson',
    type: 'website'
  },
  'east-bridgewater': {
    title: 'Plumber in East Bridgewater, MA | Quality Plumbing | Johnson Bros.',
    description: 'Local plumber serving East Bridgewater, MA. Emergency repairs, drain cleaning, pipe repair, water heaters. Fast response. Call 617-479-9911',
    keywords: ['plumber East Bridgewater MA', 'East Bridgewater plumbing', 'emergency plumber East Bridgewater', 'drain cleaning East Bridgewater'],
    canonicalUrl: '/service-areas/east-bridgewater',
    type: 'website'
  },
  'stoughton': {
    title: 'Plumber in Stoughton, MA | Professional Plumbing | Johnson Bros.',
    description: 'Trusted plumber serving Stoughton, MA. Emergency plumbing, drain cleaning, water heater service, gas heat. Call 617-479-9911',
    keywords: ['plumber Stoughton MA', 'Stoughton plumbing', 'emergency plumber Stoughton', 'drain cleaning Stoughton', 'Stoughton water heater'],
    canonicalUrl: '/service-areas/stoughton',
    type: 'website'
  },
  'canton': {
    title: 'Plumber in Canton, MA | Expert Plumbing Services | Johnson Bros.',
    description: 'Professional plumber serving Canton, MA. 24/7 emergency service, drain cleaning, water heater repair. Licensed & insured. Call 617-479-9911',
    keywords: ['plumber Canton MA', 'Canton plumbing', 'emergency plumber Canton', 'drain cleaning Canton', 'Canton water heater'],
    canonicalUrl: '/service-areas/canton',
    type: 'website'
  },
  'duxbury': {
    title: 'Plumber in Duxbury, MA | Coastal Plumbing Experts | Johnson Bros.',
    description: 'Reliable plumber serving Duxbury, MA. Emergency plumbing, drain cleaning, water heater service. Coastal home specialists. Call 617-479-9911',
    keywords: ['plumber Duxbury MA', 'Duxbury plumbing', 'emergency plumber Duxbury', 'drain cleaning Duxbury', 'Duxbury water heater'],
    canonicalUrl: '/service-areas/duxbury',
    type: 'website'
  },
  'kingston': {
    title: 'Plumber in Kingston, MA | Trusted Local Plumbing | Johnson Bros.',
    description: 'Expert plumber serving Kingston, MA. Emergency repairs, drain cleaning, water heater installation, pipe repair. Call 617-479-9911',
    keywords: ['plumber Kingston MA', 'Kingston plumbing', 'emergency plumber Kingston', 'drain cleaning Kingston', 'Kingston water heater'],
    canonicalUrl: '/service-areas/kingston',
    type: 'website'
  },
  'halifax': {
    title: 'Plumber in Halifax, MA | Reliable Plumbing Services | Johnson Bros.',
    description: 'Local plumber serving Halifax, MA. 24/7 emergency service, drain cleaning, water heater repair. Family-owned. Call 617-479-9911',
    keywords: ['plumber Halifax MA', 'Halifax plumbing', 'emergency plumber Halifax', 'drain cleaning Halifax', 'Halifax water heater'],
    canonicalUrl: '/service-areas/halifax',
    type: 'website'
  }
};

// Landing page SEO metadata
export const landingPageMetadata: Record<string, SEOMetadata> = {
  'emergency': {
    title: '24/7 Emergency Plumber | Immediate Response | Johnson Bros.',
    description: 'Need an emergency plumber now? 24/7 immediate response in Quincy & South Shore MA. Burst pipes, flooding, water leaks. Call 617-479-9911 for help!',
    keywords: ['emergency plumber', '24 hour plumber', 'urgent plumbing repair', 'burst pipe emergency', 'plumbing emergency', 'immediate plumber'],
    canonicalUrl: '/landing/emergency',
    type: 'website'
  },
  'drain-cleaning': {
    title: 'Drain Cleaning Special | $99 Service | Johnson Bros. Plumbing',
    description: 'Professional drain cleaning service starting at $99 in Quincy MA. Clear any clog fast. Kitchen, bathroom, sewer lines. Same-day service: 617-479-9911',
    keywords: ['drain cleaning special', '$99 drain cleaning', 'drain cleaning deal', 'clogged drain service', 'affordable drain cleaning'],
    canonicalUrl: '/landing/drain-cleaning',
    type: 'website'
  },
  'winter-prep': {
    title: 'Winter Plumbing Preparation | Pipe Winterization | Johnson Bros.',
    description: 'Protect your pipes this winter in Quincy MA. Professional winterization, pipe insulation, freeze prevention. Schedule now: 617-479-9911',
    keywords: ['winter plumbing', 'pipe winterization', 'freeze prevention', 'winter pipe protection', 'plumbing winterization'],
    canonicalUrl: '/landing/winter-prep',
    type: 'website'
  }
};

// Static page SEO metadata
export const staticPageMetadata: Record<string, SEOMetadata> = {
  'home': {
    title: 'Trusted Plumber in Quincy, MA | Plumbing, Heating, Drain Cleaning',
    description: 'Expert Quincy plumbers providing reliable plumbing, heating, and drain cleaning services. 24/7 emergency help across Greater Boston and the South Shore. Call 617-479-9911.',
    keywords: ['plumber Quincy MA', 'plumbing and heating', 'drain cleaning', 'emergency plumber', 'South Shore plumber', 'Greater Boston plumbing'],
    canonicalUrl: '/',
    type: 'website'
  },
  'contact': {
    title: 'Contact Johnson Bros. Plumbing | Get Free Quote | 617-479-9911',
    description: 'Contact Johnson Bros. Plumbing for fast service in Quincy MA. Free quotes, 24/7 emergency service, online booking. Call 617-479-9911 or book online.',
    keywords: ['contact plumber', 'plumbing quote', 'book plumber', 'plumber near me', 'Johnson Bros contact'],
    canonicalUrl: '/contact',
    type: 'website'
  },
  'blog': {
    title: 'Plumbing Blog | Tips & Advice | Johnson Bros. Plumbing',
    description: 'Expert plumbing tips, maintenance advice, and industry news from Johnson Bros. Plumbing. Learn how to prevent problems and save money on repairs.',
    keywords: ['plumbing blog', 'plumbing tips', 'plumbing advice', 'home maintenance', 'DIY plumbing'],
    canonicalUrl: '/blog',
    type: 'website'
  },
  'referral': {
    title: 'Referral Program | Earn $50 Per Referral | Johnson Bros. Plumbing',
    description: 'Refer friends to Johnson Bros. Plumbing and earn $50 per referral. Easy referral program with instant rewards. Start earning today!',
    keywords: ['plumbing referral program', 'refer a friend', 'referral rewards', 'earn money plumbing', 'Johnson Bros referral'],
    canonicalUrl: '/referral',
    type: 'website'
  },
  'ai-booking': {
    title: 'AI-Powered Booking | Instant Scheduling | Johnson Bros. Plumbing',
    description: 'Book plumbing services instantly with our AI assistant. Chat to schedule, get quotes, and find available appointments. Available 24/7 at 617-479-9911',
    keywords: ['AI booking', 'online plumber booking', 'instant scheduling', 'chat booking', 'automated booking'],
    canonicalUrl: '/ai-booking',
    type: 'website'
  },
  'not-found': {
    title: 'Page Not Found | Johnson Bros. Plumbing',
    description: 'The page you are looking for could not be found. Return to Johnson Bros. Plumbing homepage or call us at 617-479-9911 for assistance.',
    keywords: ['404 error', 'page not found', 'Johnson Bros Plumbing'],
    canonicalUrl: '/',
    type: 'website',
    noindex: true
  }
};

// Helper function to get metadata for any page
export function getPageMetadata(pageType: 'service' | 'area' | 'landing' | 'static', slug: string): SEOMetadata | null {
  switch (pageType) {
    case 'service':
      return serviceMetadata[slug] || null;
    case 'area':
      return serviceAreaMetadata[slug] || null;
    case 'landing':
      return landingPageMetadata[slug] || null;
    case 'static':
      return staticPageMetadata[slug] || null;
    default:
      return null;
  }
}

// Generate Open Graph and Twitter Card meta tags
export function generateSocialMetaTags(metadata: SEOMetadata, baseUrl: string = 'https://www.thejohnsonbros.com') {
  const fullUrl = `${baseUrl}${metadata.canonicalUrl || '/'}`;
  const ogImage = metadata.ogImage || `${baseUrl}/JB_logo_New_1756136293648.png`;
  
  return {
    openGraph: {
      'og:title': metadata.title,
      'og:description': metadata.description,
      'og:url': fullUrl,
      'og:type': metadata.type === 'article' ? 'article' : 'website',
      'og:image': ogImage,
      'og:site_name': 'Johnson Bros. Plumbing & Drain Cleaning',
      'og:locale': 'en_US'
    },
    twitter: {
      'twitter:card': 'summary_large_image',
      'twitter:title': metadata.title,
      'twitter:description': metadata.description,
      'twitter:image': ogImage,
      'twitter:site': '@JohnsonBrosPlumbing'
    }
  };
}

// Common FAQ data for schema markup
export const commonFAQs = [
  {
    question: 'Do you offer 24/7 emergency plumbing services?',
    answer: 'Yes, Johnson Bros. Plumbing offers 24/7 emergency plumbing services throughout Quincy and the South Shore MA area. Call us anytime at 617-479-9911 for immediate assistance with burst pipes, flooding, or other plumbing emergencies.'
  },
  {
    question: 'What areas do you serve?',
    answer: 'We provide plumbing services throughout the South Shore MA area, including Quincy, Braintree, Weymouth, Plymouth, Marshfield, Hingham, and surrounding communities. Call 617-479-9911 to confirm service in your area.'
  },
  {
    question: 'How quickly can you respond to a service call?',
    answer: 'We offer same-day service for most plumbing issues and immediate response for emergencies. Our typical response time is within 1-2 hours for urgent matters and same-day for standard service calls.'
  },
  {
    question: 'Are you licensed and insured?',
    answer: 'Yes, Johnson Bros. Plumbing is fully licensed and insured in Massachusetts. We have been serving the community since 2008 with professional, reliable plumbing services.'
  },
  {
    question: 'Do you offer free estimates?',
    answer: 'Yes, we provide free estimates for most plumbing services. Call 617-479-9911 or use our online booking system to schedule your free consultation and estimate.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept cash, check, and all major credit cards. We also offer financing options for larger projects. Payment is due upon completion of service.'
  }
];

// Service-specific FAQs
export const serviceFAQs: Record<string, Array<{question: string; answer: string}>> = {
  'drain-cleaning': [
    {
      question: 'How much does drain cleaning cost?',
      answer: 'Our drain cleaning services start at $99 for basic clogs. The final cost depends on the severity and location of the blockage. We provide free estimates before starting any work.'
    },
    {
      question: 'Can you clean main sewer lines?',
      answer: 'Yes, we specialize in main sewer line cleaning using professional hydro-jetting equipment that can clear even the toughest blockages, including tree roots.'
    }
  ],
  'water-heater': [
    {
      question: 'Should I repair or replace my water heater?',
      answer: 'Generally, if your water heater is over 10 years old or requires frequent repairs, replacement is more cost-effective. We provide honest recommendations based on your specific situation.'
    },
    {
      question: 'Do you install tankless water heaters?',
      answer: 'Yes, we install and service both traditional tank and tankless water heaters. Tankless systems can save up to 30% on energy costs.'
    }
  ],
  'emergency-plumbing': [
    {
      question: 'What should I do in a plumbing emergency?',
      answer: 'First, shut off the main water supply to prevent further damage. Then call us immediately at 617-479-9911. We will guide you through any additional steps and dispatch a plumber right away.'
    },
    {
      question: 'Do emergency services cost more?',
      answer: 'We charge a modest after-hours fee for emergency services outside regular business hours. However, addressing emergencies promptly often prevents more costly damage.'
    }
  ]
};

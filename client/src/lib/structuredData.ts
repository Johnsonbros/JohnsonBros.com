// Default structured data for the plumbing business
export const businessStructuredData = {
  "@context": "https://schema.org",
  "@type": "Plumber",
  "name": "Johnson Bros. Plumbing & Drain Cleaning",
  "image": "/JB_logo_New_1756136293648.png",
  "url": "https://johnsonbrosplumbing.com",
  "telephone": "617-479-9911",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Quincy",
    "addressRegion": "MA",
    "postalCode": "02169",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 42.2529,
    "longitude": -71.0023
  },
  "serviceArea": [
    {
      "@type": "City",
      "name": "Quincy",
      "addressRegion": "MA"
    },
    {
      "@type": "City",
      "name": "Abington",
      "addressRegion": "MA"
    },
    {
      "@type": "City",
      "name": "Braintree",
      "addressRegion": "MA"
    },
    {
      "@type": "City",
      "name": "Weymouth",
      "addressRegion": "MA"
    },
    {
      "@type": "City",
      "name": "Milton",
      "addressRegion": "MA"
    }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "08:00",
      "closes": "17:00"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/johnsonbrosplumbing",
    "https://www.google.com/maps/place/Johnson+Bros+Plumbing"
  ],
  "priceRange": "$$",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "281"
  }
};

// Function to generate article structured data
export function generateArticleStructuredData(post: {
  title: string;
  description?: string;
  author?: string;
  publishDate?: Date | string | null;
  modifiedDate?: Date | string | null;
  image?: string | null;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description,
    "author": {
      "@type": "Organization",
      "name": post.author || "Johnson Bros. Plumbing & Drain Cleaning"
    },
    "datePublished": post.publishDate ? new Date(post.publishDate).toISOString() : new Date().toISOString(),
    "dateModified": post.modifiedDate ? new Date(post.modifiedDate).toISOString() : new Date().toISOString(),
    "image": post.image || "/JB_logo_New_1756136293648.png",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": post.url
    },
    "publisher": {
      "@type": "Organization",
      "name": "Johnson Bros. Plumbing & Drain Cleaning",
      "logo": {
        "@type": "ImageObject",
        "url": "/JB_logo_New_1756136293648.png"
      }
    }
  };
}

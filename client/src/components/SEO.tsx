import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: any;
}

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  structuredData
}: SEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title;
    
    // Set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attributeName = property ? "property" : "name";
      let element = document.querySelector(`meta[${attributeName}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };
    
    // Basic meta tags
    if (description) {
      setMetaTag("description", description);
    }
    
    if (keywords && keywords.length > 0) {
      setMetaTag("keywords", keywords.join(", "));
    }
    
    // Open Graph tags
    setMetaTag("og:title", title, true);
    if (description) setMetaTag("og:description", description, true);
    if (image) setMetaTag("og:image", image, true);
    if (url) setMetaTag("og:url", url, true);
    setMetaTag("og:type", type, true);
    setMetaTag("og:site_name", "Johnson Bros. Plumbing & Drain Cleaning", true);
    
    // Article specific Open Graph tags
    if (type === "article") {
      if (author) setMetaTag("article:author", author, true);
      if (publishedTime) setMetaTag("article:published_time", publishedTime, true);
      if (modifiedTime) setMetaTag("article:modified_time", modifiedTime, true);
    }
    
    // Twitter Card tags
    setMetaTag("twitter:card", image ? "summary_large_image" : "summary");
    setMetaTag("twitter:title", title);
    if (description) setMetaTag("twitter:description", description);
    if (image) setMetaTag("twitter:image", image);
    
    // Add structured data
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]');
      
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.setAttribute("type", "application/ld+json");
        document.head.appendChild(scriptElement);
      }
      
      scriptElement.textContent = JSON.stringify(structuredData);
    }
    
    // Cleanup function to remove tags when component unmounts
    return () => {
      // Reset to default title when leaving the page
      document.title = "Johnson Bros. Plumbing & Drain Cleaning | Expert Plumbers in Quincy, MA";
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, structuredData]);
  
  return null;
}

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
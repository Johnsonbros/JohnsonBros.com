import { Helmet } from 'react-helmet-async';

interface LocalBusinessSchemaProps {
  serviceArea?: string | string[];
  service?: {
    name: string;
    description: string;
    url: string;
  };
}

export function LocalBusinessSchema({ serviceArea, service }: LocalBusinessSchemaProps) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Johnson Bros. Plumbing & Drain Cleaning",
    "image": "https://johnsonbrosplumbing.com/logo.png",
    "telephone": "+16174799911",
    "email": "info@johnsonbrosplumbing.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Abington",
      "addressLocality": "Abington",
      "addressRegion": "MA",
      "postalCode": "02351",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "42.1048",
      "longitude": "-70.9453"
    },
    "url": "https://johnsonbrosplumbing.com",
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "07:00",
        "closes": "21:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday", "Sunday"],
        "opens": "07:00",
        "closes": "21:00"
      }
    ],
    "areaServed": serviceArea ? (Array.isArray(serviceArea) ? serviceArea.map(area => ({
      "@type": "City",
      "name": area,
      "containedInPlace": {
        "@type": "State",
        "name": "Massachusetts",
        "containedInPlace": {
          "@type": "Country",
          "name": "United States"
        }
      }
    })) : {
      "@type": "City",
      "name": serviceArea,
      "containedInPlace": {
        "@type": "State",
        "name": "Massachusetts",
        "containedInPlace": {
          "@type": "Country",
          "name": "United States"
        }
      }
    }) : [
      { "@type": "City", "name": "Quincy" },
      { "@type": "City", "name": "Weymouth" },
      { "@type": "City", "name": "Braintree" },
      { "@type": "City", "name": "Plymouth" },
      { "@type": "City", "name": "Marshfield" },
      { "@type": "City", "name": "Hingham" },
      { "@type": "City", "name": "Abington" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Plumbing Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Emergency Plumbing",
            "description": "24/7 emergency plumbing repair services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Drain Cleaning",
            "description": "Professional drain cleaning and unclogging services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Water Heater Service",
            "description": "Water heater repair, replacement, and installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Pipe Repair",
            "description": "Pipe repair, replacement, and repiping services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "General Plumbing",
            "description": "Complete residential and commercial plumbing services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "New Construction Plumbing",
            "description": "Plumbing installation for new construction projects"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Gas Heat Service",
            "description": "Gas line installation, repair, and heating services"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "487",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // If a specific service is provided, add Service schema
  const schemas: any[] = [baseSchema];
  
  if (service) {
    const serviceAreaServed = serviceArea
      ? (Array.isArray(serviceArea) 
          ? serviceArea.map(area => ({ "@type": "City", "name": area }))
          : [{ "@type": "City", "name": serviceArea }])
      : [
          { "@type": "City", "name": "Quincy, MA" },
          { "@type": "City", "name": "Weymouth, MA" },
          { "@type": "City", "name": "Braintree, MA" },
          { "@type": "City", "name": "Plymouth, MA" },
          { "@type": "City", "name": "Marshfield, MA" },
          { "@type": "City", "name": "Hingham, MA" }
        ];

    schemas.push({
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": service.name,
      "description": service.description,
      "provider": {
        "@type": "Plumber",
        "name": "Johnson Bros. Plumbing & Drain Cleaning",
        "telephone": "+16174799911",
        "url": "https://johnsonbrosplumbing.com"
      },
      "areaServed": serviceAreaServed,
      "url": service.url,
      "availableChannel": {
        "@type": "ServiceChannel",
        "serviceUrl": service.url,
        "servicePhone": {
          "@type": "ContactPoint",
          "telephone": "+16174799911",
          "contactType": "customer service",
          "availableLanguage": "English"
        }
      }
    });
  }

  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

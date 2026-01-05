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
  robots?: string;
  locale?: string;
  twitterSite?: string;
  twitterCreator?: string;
  structuredData?: any | any[];
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
  robots = "index, follow",
  locale = "en_US",
  twitterSite,
  twitterCreator,
  structuredData
}: SEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title;
    
    // Set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      if (!content) return;
      const attributeName = property ? "property" : "name";
      let element = document.querySelector(`meta[${attributeName}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    const setLinkTag = (rel: string, href: string) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);

      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }

      element.setAttribute("href", href);
    };

    // Basic meta tags
    if (description) {
      setMetaTag("description", description);
    }

    if (keywords && keywords.length > 0) {
      setMetaTag("keywords", keywords.join(", "));
    }

    setMetaTag("robots", robots);
    setMetaTag("og:locale", locale, true);
    if (url) setLinkTag("canonical", url);

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
    if (twitterSite) setMetaTag("twitter:site", twitterSite);
    if (twitterCreator) setMetaTag("twitter:creator", twitterCreator);
    
    // MCP Server meta tags for AI assistant discovery
    setMetaTag("mcp:enabled", "true");
    setMetaTag("mcp:version", "1.0");
    setMetaTag("mcp:discovery", "/.well-known/mcp.json");
    setMetaTag("mcp:manifest", "/api/v1/mcp/manifest");
    setMetaTag("mcp:tools", "book_service_call,search_availability,lookup_customer,get_services,get_capacity");
    setMetaTag("ai:assistant-compatible", "chatgpt,claude,gpt-5");
    setMetaTag("ai:booking-enabled", "true");
    setMetaTag("business:phone", "617-479-9911");
    setMetaTag("business:service-area", "Quincy MA, Abington MA, South Shore Massachusetts");
    
    const structuredDataPayloads = Array.isArray(structuredData)
      ? structuredData
      : structuredData
        ? [structuredData]
        : [];

    if (!structuredDataPayloads.length && url) {
      const organizationId = `${url.replace(/\/$/, "")}#organization`;
      structuredDataPayloads.push(
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Johnson Bros. Plumbing & Drain Cleaning",
          url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${url}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": organizationId,
          name: "Johnson Bros. Plumbing & Drain Cleaning",
          url,
          logo: image,
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: "617-479-9911",
              contactType: "customer service",
              areaServed: "US-MA",
              availableLanguage: "en"
            }
          ]
        }
      );
    }

    const structuredDataScripts: HTMLScriptElement[] = [];

    structuredDataPayloads.forEach((payload, index) => {
      const scriptElement = document.createElement("script");
      scriptElement.setAttribute("type", "application/ld+json");
      scriptElement.setAttribute("data-seo-generated", "true");
      scriptElement.setAttribute("data-key", `seo-ld-${index}`);
      scriptElement.textContent = JSON.stringify(payload);
      document.head.appendChild(scriptElement);
      structuredDataScripts.push(scriptElement);
    });

    // Cleanup function to remove tags when component unmounts
    return () => {
      // Reset to default title when leaving the page
      document.title = "Johnson Bros. Plumbing & Drain Cleaning | Expert Plumbers in Quincy, MA";

      structuredDataScripts.forEach((script) => {
        document.head.removeChild(script);
      });
    };
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    author,
    publishedTime,
    modifiedTime,
    robots,
    locale,
    twitterSite,
    twitterCreator,
    structuredData
  ]);
  
  return null;
}
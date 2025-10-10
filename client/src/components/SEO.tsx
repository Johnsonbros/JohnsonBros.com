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
    
    // MCP Server meta tags for AI assistant discovery
    setMetaTag("mcp:enabled", "true");
    setMetaTag("mcp:version", "1.0");
    setMetaTag("mcp:discovery", "/.well-known/mcp.json");
    setMetaTag("mcp:manifest", "/api/mcp/manifest");
    setMetaTag("mcp:tools", "book_service_call,search_availability,lookup_customer,get_services,get_capacity");
    setMetaTag("ai:assistant-compatible", "chatgpt,claude,gpt-5");
    setMetaTag("ai:booking-enabled", "true");
    setMetaTag("business:phone", "617-479-9911");
    setMetaTag("business:service-area", "Quincy MA, Abington MA, South Shore Massachusetts");
    
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
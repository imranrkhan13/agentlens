import PublicSite from "@/components/public-site";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function HomePage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: absoluteUrl("/icon"),
      sameAs: [siteConfig.github],
      description: siteConfig.shortDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.shortDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web, Node.js, Python",
      url: siteConfig.url,
      description: siteConfig.description,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "INR", name: "Free" },
        { "@type": "Offer", price: "1499", priceCurrency: "INR", name: "Pro" },
        { "@type": "Offer", price: "4999", priceCurrency: "INR", name: "Scale" },
      ],
      featureList: [
        "AI provider comparison",
        "Production LLM monitoring",
        "Latency and reliability alerts",
        "Provider-neutral incident investigation",
        "Privacy-first telemetry",
      ],
    },
  ];

  return <><StructuredData data={structuredData} /><PublicSite /></>;
}

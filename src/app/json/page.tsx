import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl, SITE } from "@/config/site";
import { JsonWorkspaceShell } from "@/features/json-explorer";
import { parseWorkspaceOutputStyle } from "@/constants/workspace-tools";

const WORKSPACE_TITLE = "JSON Minify, Format, Search & Explore";

const WORKSPACE_DESCRIPTION =
  "Minify or pretty-print JSON, search nested keys and values, run queries, validate, repair, and explore the tree online in your browser.";

export const metadata: Metadata = {
  title: WORKSPACE_TITLE,
  description: WORKSPACE_DESCRIPTION,
  keywords: [
    "JSON minify",
    "JSON minifier",
    "JSON formatter",
    "JSON pretty print",
    "JSON explorer",
    "JSON search",
    "JSON query",
    "JSON validator",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/json",
  },
  openGraph: {
    title: WORKSPACE_TITLE,
    description: WORKSPACE_DESCRIPTION,
    url: "/json",
  },
  twitter: {
    title: WORKSPACE_TITLE,
    description: WORKSPACE_DESCRIPTION,
  },
};

export default async function JsonWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string | string[] }>;
}) {
  const params = await searchParams;
  const toolParam = Array.isArray(params.tool) ? params.tool[0] : params.tool;
  return (
    <AppShell dense className="min-h-0">
      <h1 className="sr-only">{WORKSPACE_TITLE}</h1>
      <WorkspaceJsonLd />
      <JsonWorkspaceShell
        initialOutputStyle={parseWorkspaceOutputStyle(toolParam)}
      />
    </AppShell>
  );
}

function WorkspaceJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    url: `${getSiteUrl()}/json`,
    description: WORKSPACE_DESCRIPTION,
    featureList: [
      "JSON minify",
      "JSON formatter",
      "JSON search",
      "JSON query",
      "JSON validator",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

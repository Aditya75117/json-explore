import type { Metadata } from "next";
import { SITE, SITE_TITLE } from "@/config/site";
import { LandingPage } from "@/features/marketing/landing-page";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default function HomePage() {
  return <LandingPage />;
}

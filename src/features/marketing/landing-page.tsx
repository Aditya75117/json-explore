import Link from "next/link";
import { OPEN_EXPLORER_LABEL } from "@/config/site";
import { WORKSPACE_TOOLS } from "@/constants/workspace-tools";
import { LANDING_FAQ } from "@/features/marketing/faq-data";
import { LandingJsonLd } from "@/features/marketing/json-ld";
import {
  LANDING_PROBLEMS,
  LANDING_STEPS,
} from "@/features/marketing/landing-content";
import { ProductPreview } from "@/features/marketing/product-preview";
import { SiteFooter } from "@/features/marketing/site-footer";
import { SiteHeader } from "@/features/marketing/site-header";
import { SkipLink } from "@/components/common/skip-link";

const ctaPrimary =
  "bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-medium no-underline hover:opacity-90";

const eyebrow = "text-primary font-mono text-xs tracking-[0.16em] uppercase";

const sectionHeading =
  "mt-3 text-3xl font-semibold tracking-tight text-balance";

const sectionIntro = "text-muted mt-4 max-w-2xl text-sm leading-relaxed";

const sectionFrame = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24";

export function LandingPage() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-1 flex-col">
      <SkipLink />
      <SiteHeader />
      <LandingJsonLd />
      <main id="main-content" className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-surface border-border border-b">
      <div
        className={`${sectionFrame} grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12`}
      >
        <div>
          <p className={eyebrow}>A better way to explore JSON</p>
          <h1 className={`${sectionHeading} sm:text-display`}>
            Find anything inside any JSON.
          </h1>
          <p className={`${sectionIntro} sm:text-base`}>
            Search nested keys and values, jump to the matching node, and keep
            processing in your browser.
          </p>
          <div className="mt-8">
            <Link href="/json" className={ctaPrimary}>
              {OPEN_EXPLORER_LABEL}
            </Link>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section id="why" className="scroll-mt-16">
      <div className={`${sectionFrame} border-border border-b`}>
        <p className={eyebrow}>Why</p>
        <h2 className={sectionHeading}>
          JSON gets big fast. Finding things in it shouldn&apos;t be slow.
        </h2>
        <p className={sectionIntro}>
          Four things that slow you down, and what the workspace does instead.
        </p>
        <ol className="mt-12">
          {LANDING_PROBLEMS.map((item, index) => (
            <li
              key={item.pain}
              className="border-border grid gap-3 border-t py-6 sm:grid-cols-2 sm:items-baseline sm:gap-10"
            >
              <p className="text-muted text-base leading-relaxed sm:text-lg">
                <span className="text-primary mr-3 font-mono text-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.pain}
              </p>
              <p className="text-foreground text-sm leading-relaxed font-medium">
                {item.fix}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface-muted scroll-mt-16">
      <div className={`${sectionFrame} border-border border-b`}>
        <p className={eyebrow}>How it works</p>
        <h2 className={sectionHeading}>Three steps, one document.</h2>
        <p className={sectionIntro}>
          Paste once. The same JSON stays open while you search, query, and
          convert it.
        </p>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {LANDING_STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              {index < LANDING_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="bg-border absolute top-4 left-4 hidden h-px w-[calc(100%+2rem)] sm:block"
                />
              ) : null}
              <span className="bg-primary text-primary-foreground relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <p className={`${eyebrow} mt-14`}>Tools on the shared document</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {WORKSPACE_TOOLS.map((tool) => (
            <li key={tool.id}>
              <Link
                href={`/json?tool=${tool.id}`}
                className="border-border bg-surface hover:border-border-strong border-hairline block h-full rounded-[var(--radius-lg)] p-3 no-underline"
              >
                <span className="text-foreground block text-sm font-medium">
                  {tool.label}
                </span>
                <span className="text-muted mt-1 block text-xs leading-relaxed">
                  {tool.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <section
      id="privacy"
      className="dark:border-border dark:bg-surface dark:text-foreground scroll-mt-16 bg-[var(--brand-abyss)] text-[#E7F2F1] dark:border-y"
    >
      <div className={sectionFrame}>
        <p className="dark:text-primary font-mono text-xs tracking-[0.16em] text-[var(--brand-mint)] uppercase">
          Privacy
        </p>
        <h2 className={sectionHeading}>Your JSON stays in your browser.</h2>
        <p className="dark:text-muted mt-4 max-w-2xl text-sm leading-relaxed text-[#E7F2F1]/75">
          Parse, search, query, and analyze run locally — including a Web Worker
          for large documents. Nothing is uploaded for the core workflow.
        </p>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {["Paste", "Process", "Explore"].map((word) => (
            <li
              key={word}
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {word}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="bg-surface-muted scroll-mt-16">
      <div
        className={`${sectionFrame} grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start`}
      >
        <div className="lg:sticky lg:top-20">
          <p className={eyebrow}>FAQ</p>
          <h2 className={sectionHeading}>Questions developers ask</h2>
          <p className={sectionIntro}>
            Short answers about search, query, privacy, and large files.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {LANDING_FAQ.map((item) => (
            <details
              key={item.question}
              className="group border-border bg-surface border-hairline rounded-[var(--radius-lg)] px-4 py-4"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {item.question}
                  <span aria-hidden="true" className="text-muted">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </span>
              </summary>
              <p className="text-muted mt-2 max-w-3xl text-sm leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="dark:bg-surface-muted dark:text-foreground mx-auto w-full max-w-6xl rounded-[var(--radius-lg)] bg-[var(--brand-glacier)] px-6 py-16 text-center text-[var(--brand-abyss)]">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          Ready to stop digging through JSON?
        </h2>
        <div className="mt-8">
          <Link href="/json" className={ctaPrimary}>
            {OPEN_EXPLORER_LABEL}
          </Link>
        </div>
      </div>
    </section>
  );
}

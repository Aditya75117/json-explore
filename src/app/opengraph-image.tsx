import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(
    path.join(process.cwd(), "public/brand/mark-light.png"),
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0d10",
          color: "#e8eaef",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={logoSrc} width={105} height={90} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#2dd4bf",
            }}
          >
            {SITE.name}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            <div style={{ display: "flex" }}>Find anything</div>
            <div style={{ display: "flex" }}>inside any JSON.</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#8b93a7",
              lineHeight: 1.4,
            }}
          >
            Search, query, and jump to the node — in your browser.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

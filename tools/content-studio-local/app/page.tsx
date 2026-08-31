import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ContentStudioForm } from "../components/ContentStudioForm";

export const dynamic = "force-dynamic";

const netlifyDeploymentMarkers = [
  "CONTEXT",
  "DEPLOY_ID",
  "DEPLOY_PRIME_URL",
  "DEPLOY_URL",
  "NETLIFY_IMAGES_CDN_DOMAIN",
  "SITE_ID",
] as const;

function isNetlifyEnvironment() {
  return (
    process.env.NETLIFY === "true" ||
    process.env.NETLIFY_LOCAL === "true" ||
    netlifyDeploymentMarkers.some((name) => Boolean(process.env[name]))
  );
}

function isLoopbackHost(value: string | null) {
  if (!value) return false;
  try {
    const hostname = new URL(`http://${value}`).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

async function requireLocalDevelopmentRequest() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.CONTENT_STUDIO_LOCAL_ENABLED !== "true" ||
    isNetlifyEnvironment()
  ) {
    notFound();
  }

  const requestHeaders = await headers();
  if (!isLoopbackHost(requestHeaders.get("host"))) {
    notFound();
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  if (forwardedHost && !isLoopbackHost(forwardedHost.split(",", 1)[0]?.trim() ?? null)) {
    notFound();
  }
}

export default async function ContentStudioLocalPage() {
  await requireLocalDevelopmentRequest();

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <p className="studio-kicker">LOCAL OPERATOR TOOL</p>
        <h1>月の返事 Content Studio</h1>
        <p>
          Synthetic caseからProduction-equivalentな鑑定ノートを確認する、
          localhost専用の制作導線です。
        </p>
      </header>

      <ContentStudioForm />
    </main>
  );
}

"use client";

import Script from "next/script";
import { useEffect } from "react";
import { Ga4ClientMeasurementAdapter } from "@/lib/measurement/adapters";
import {
  MEASUREMENT_ATTRIBUTION_COOKIE_NAME,
  MEASUREMENT_ATTRIBUTION_TTL_SECONDS,
} from "@/lib/measurement/attribution";
import { readMeasurementAttributionCookiePayload } from "@/lib/measurement/attribution-cookie";
import { configureClientMeasurementAdapter } from "@/lib/measurement/client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

export function MeasurementBootstrap(props: Readonly<{ measurementId: string; siteOrigin: string }>) {
  useEffect(() => {
    const attribution = readMeasurementAttributionCookiePayload(readCookie(MEASUREMENT_ATTRIBUTION_COOKIE_NAME));
    if (!attribution) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag("js", new Date());
    window.gtag("config", props.measurementId, {
      client_id: attribution.clientId,
      session_id: attribution.sessionId,
      send_page_view: false,
      ignore_referrer: true,
      page_location: `${props.siteOrigin}/_measurement`,
      page_referrer: props.siteOrigin,
      page_title: "moon_reply",
      cookie_expires: MEASUREMENT_ATTRIBUTION_TTL_SECONDS,
      cookie_update: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      campaign_source: attribution.utmSource ?? undefined,
      campaign_medium: attribution.utmMedium ?? undefined,
      campaign_name: attribution.utmCampaign ?? undefined,
      campaign_content: attribution.utmContent ?? undefined,
      gclid: attribution.gclid ?? undefined,
    });
    configureClientMeasurementAdapter(
      new Ga4ClientMeasurementAdapter(window.gtag, attribution.sessionId),
    );
  }, [props.measurementId, props.siteOrigin]);
  return <Script id="measurement-r1-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(props.measurementId)}`} strategy="afterInteractive" />;
}

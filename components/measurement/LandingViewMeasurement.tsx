"use client";

import { useEffect, useRef } from "react";
import { MEASUREMENT_ATTRIBUTION_COOKIE_NAME } from "@/lib/measurement/attribution";
import { readMeasurementAttributionCookiePayload } from "@/lib/measurement/attribution-cookie";
import { trackClientMeasurement } from "@/lib/measurement/client";

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function LandingViewMeasurement() {
  const measured = useRef(false);
  useEffect(() => {
    if (measured.current) return;
    const attribution = readMeasurementAttributionCookiePayload(readCookie(MEASUREMENT_ATTRIBUTION_COOKIE_NAME));
    if (!attribution) return;
    measured.current = true;
    trackClientMeasurement("landing_view", {
      landingPath: attribution.landingPath,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmContent: attribution.utmContent,
      gclid: attribution.gclid,
    });
  }, []);
  return null;
}

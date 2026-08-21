"use client";

import { useEffect, useRef } from "react";

import { trackClientMeasurement } from "@/lib/measurement/client";

export function SampleViewMeasurement() {
  const measured = useRef(false);

  useEffect(() => {
    if (measured.current) return;
    measured.current = true;
    trackClientMeasurement("sample_view", { sample: "public_sample" });
  }, []);

  return null;
}

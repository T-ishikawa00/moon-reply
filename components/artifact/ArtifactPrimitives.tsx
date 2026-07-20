import type { HTMLAttributes } from "react";

import styles from "./ArtifactPrimitives.module.css";

export type ArtifactSurfaceTone = "paper" | "night";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export type ArtifactSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  tone?: ArtifactSurfaceTone;
};

export function ArtifactSurface({
  className,
  tone = "paper",
  ...props
}: ArtifactSurfaceProps) {
  return (
    <div
      className={joinClassNames(
        styles.surface,
        tone === "night" ? styles.surfaceNight : undefined,
        className,
      )}
      {...props}
    />
  );
}

export type ArtifactRuleProps = HTMLAttributes<HTMLHRElement>;

export function ArtifactRule({ className, ...props }: ArtifactRuleProps) {
  return <hr className={joinClassNames(styles.rule, className)} {...props} />;
}

export type ArtifactMetadataProps = HTMLAttributes<HTMLDListElement>;

export function ArtifactMetadata({ className, ...props }: ArtifactMetadataProps) {
  return <dl className={joinClassNames(styles.metadata, className)} {...props} />;
}

export type ArtifactStampProps = HTMLAttributes<HTMLSpanElement>;

export function ArtifactStamp({ className, ...props }: ArtifactStampProps) {
  return <span className={joinClassNames(styles.stamp, className)} {...props} />;
}

export type ArtifactSectionLabelProps = HTMLAttributes<HTMLSpanElement>;

export function ArtifactSectionLabel({
  className,
  ...props
}: ArtifactSectionLabelProps) {
  return <span className={joinClassNames(styles.sectionLabel, className)} {...props} />;
}

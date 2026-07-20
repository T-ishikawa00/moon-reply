import type { HTMLAttributes } from "react";

import styles from "./ArtifactComposition.module.css";

type ArtifactElement =
  | "article"
  | "aside"
  | "blockquote"
  | "div"
  | "footer"
  | "header"
  | "nav"
  | "ol"
  | "section";

type CompositionProps = HTMLAttributes<HTMLElement> & {
  as?: ArtifactElement;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function Composition({
  as: Element = "div",
  className,
  compositionClassName,
  ...props
}: CompositionProps & { compositionClassName: string }) {
  return (
    <Element
      className={joinClassNames(compositionClassName, className)}
      {...props}
    />
  );
}

export function ArtifactShell(props: CompositionProps) {
  return <Composition compositionClassName={styles.shell} {...props} />;
}

export function ArtifactCover(props: CompositionProps) {
  return <Composition compositionClassName={styles.cover} {...props} />;
}

export function ArtifactAnswer(props: CompositionProps) {
  return <Composition compositionClassName={styles.answer} {...props} />;
}

export function ArtifactLetter(props: CompositionProps) {
  return <Composition compositionClassName={styles.letter} {...props} />;
}

export function ArtifactTimeline(props: CompositionProps) {
  return <Composition compositionClassName={styles.timeline} {...props} />;
}

export function ArtifactComparison(props: CompositionProps) {
  return <Composition compositionClassName={styles.comparison} {...props} />;
}

export function ArtifactMessageDraft(props: CompositionProps) {
  return <Composition compositionClassName={styles.messageDraft} {...props} />;
}

export function ArtifactLimitation(props: CompositionProps) {
  return <Composition compositionClassName={styles.limitation} {...props} />;
}

export function ArtifactClosing(props: CompositionProps) {
  return <Composition compositionClassName={styles.closing} {...props} />;
}

export type { CompositionProps as ArtifactCompositionProps };

type MoonSealProps = {
  size?: "small" | "medium";
  label?: string;
  className?: string;
};

export function MoonSeal({
  size = "small",
  label,
  className = "",
}: MoonSealProps) {
  const classes = ["moon-seal", `moon-seal--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 48 48"
      className={classes}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <circle className="moon-seal__ring" cx="24" cy="24" r="21" />
      <path
        className="moon-seal__crescent"
        d="M29.5 10.5c-7.2 2.5-11 10.4-8.5 17.6 2 5.7 7.3 9.3 13 9.3-2.7 2.5-6.3 4.1-10.3 4.1C15 41.5 8 34.5 8 25.8S15 10.1 23.7 10.1c1.9 0 3.7.3 5.8 1.1Z"
      />
      <circle className="moon-seal__point" cx="36" cy="15" r="1.35" />
    </svg>
  );
}

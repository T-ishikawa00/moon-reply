type EditorialDividerProps = {
  variant?: "night" | "paper";
  className?: string;
};

export function EditorialDivider({
  variant = "paper",
  className = "",
}: EditorialDividerProps) {
  const classes = [
    "editorial-divider",
    `editorial-divider--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true">
      <span className="editorial-divider__point" />
    </div>
  );
}

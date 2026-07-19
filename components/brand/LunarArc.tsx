type LunarArcProps = {
  tone?: "night" | "paper";
  position?: "top-right" | "bottom-left";
  className?: string;
};

export function LunarArc({
  tone = "night",
  position = "top-right",
  className = "",
}: LunarArcProps) {
  const classes = [
    "lunar-arc",
    `lunar-arc--${tone}`,
    `lunar-arc--${position}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <span className="lunar-arc__inner" />
    </span>
  );
}

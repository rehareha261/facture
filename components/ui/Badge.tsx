interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "pro" | "success" | "warning" | "danger";
}

const variants = {
  default: "bg-zinc-100 text-zinc-700",
  pro: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

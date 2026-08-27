import type { RoleGroup, SlotCode } from "@/lib/slots";
import { isSlotCode, roleGroupOf } from "@/lib/slots";
import { cn } from "@/lib/ui/cn";

const STRIPE_COUNT: Record<RoleGroup, number> = {
  P: 1,
  D: 2,
  C: 3,
  A: 4,
};

function isRoleGroup(value: string): value is RoleGroup {
  return value === "P" || value === "D" || value === "C" || value === "A";
}

function resolveRoleGroup(code: SlotCode | RoleGroup): RoleGroup {
  if (isSlotCode(code)) {
    return roleGroupOf(code);
  }
  if (isRoleGroup(code)) {
    return code;
  }
  throw new Error(`Invalid role/slot code: ${code}`);
}

export interface RoleChipProps {
  /** A fixed slot code ("P1"..."A6") or a bare role group letter ("P"/"D"/"C"/"A"). */
  code: SlotCode | RoleGroup;
  /** Visual density variant; defaults to the standard lineup-card size. */
  variant?: "default" | "compact";
  /** Whether this chip represents the currently pinned/selected slot. */
  selected?: boolean;
  /** Presence makes the chip an interactive, tappable control (44px target). */
  onClick?: () => void;
  className?: string;
}

/**
 * Lineup-card style role/slot chip (P/D/C/A). Pure presentation: no state,
 * no fetching. Stripe count on the left edge encodes the role group
 * (P=1, D=2, C=3, A=4) so the chip stays legible in grayscale.
 */
export function RoleChip({
  code,
  variant = "default",
  selected = false,
  onClick,
  className,
}: RoleChipProps) {
  const group = resolveRoleGroup(code);
  const stripeCount = STRIPE_COUNT[group];
  const interactive = typeof onClick === "function";

  const content = (
    <span
      className={cn(
        "sb-chip sb-digit",
        variant === "compact" && "text-xs",
        className,
      )}
      data-role-group={group}
      data-stripe-count={stripeCount}
      data-interactive={interactive ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
    >
      {code}
    </span>
  );

  if (!interactive) {
    return content;
  }

  return (
    <button type="button" onClick={onClick} className="contents">
      {content}
    </button>
  );
}

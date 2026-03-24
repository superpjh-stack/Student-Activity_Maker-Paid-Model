import type { Plan } from '@/types/subscription';
import { PLAN_LABELS, PLAN_COLORS } from '@/types/subscription';

interface PlanBadgeProps {
  plan: Plan;
  size?: 'sm' | 'md';
}

export default function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${PLAN_COLORS[plan]}`}>
      {PLAN_LABELS[plan]}
    </span>
  );
}

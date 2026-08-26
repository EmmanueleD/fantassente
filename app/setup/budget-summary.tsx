export default function BudgetSummary({
  initialBudget,
  projectedRemainingBudget,
}: {
  initialBudget: number;
  projectedRemainingBudget: number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-800 p-4">
      <span className="text-slate-400">Budget stimato (priorità 1 per slot vuoti)</span>
      <span className="text-2xl font-bold">
        {projectedRemainingBudget} / {initialBudget}
      </span>
    </div>
  );
}

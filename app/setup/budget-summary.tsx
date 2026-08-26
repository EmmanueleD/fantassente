export default function BudgetSummary({
  initialBudget,
  remainingBudget,
}: {
  initialBudget: number;
  remainingBudget: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
      <span className="text-slate-400">Budget</span>
      <span className="text-2xl font-bold">
        {remainingBudget} / {initialBudget}
      </span>
    </div>
  );
}

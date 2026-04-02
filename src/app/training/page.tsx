"use client";
import Card from "@/components/Card";
import FamilySwitcher from "@/components/FamilySwitcher";
export default function TrainingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Training</h1>
        <FamilySwitcher />
      </div>
      <Card><p className="text-sm text-slate-500 text-center py-8">Kommt in Phase 2</p></Card>
    </div>
  );
}

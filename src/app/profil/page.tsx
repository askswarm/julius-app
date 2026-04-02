"use client";
import Card from "@/components/Card";
import FamilySwitcher from "@/components/FamilySwitcher";
import { useUser } from "@/lib/UserContext";
export default function ProfilPage() {
  const { user } = useUser();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profil</h1>
        <FamilySwitcher />
      </div>
      <Card>
        <div className="flex flex-col gap-2 text-sm">
          <p><strong>{user.name}</strong> · {user.alter_jahre}J · {user.groesse_cm}cm · {user.gewicht_kg}kg</p>
          <p>Protein: {user.protein_ziel_g}g/Tag · kcal: {user.kcal_training} (Training) / {user.kcal_ruhe} (Ruhe)</p>
          <p>Wasser: {user.wasser_ziel_ml}ml · Essensfenster: {user.essensfenster_start}–{user.essensfenster_ende}</p>
        </div>
      </Card>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { DemoContext, type DemoPet, type DemoPetInput, type DemoVaccineInput } from "./demo-store";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<DemoPet[]>([]);

  function createPet(input: DemoPetInput, vaccines: DemoVaccineInput[]): string {
    const id = crypto.randomUUID();
    const pet: DemoPet = {
      ...input,
      id,
      vaccinations: vaccines.map((vaccine) => ({ ...vaccine, id: crypto.randomUUID() })),
    };
    setPets((current) => [...current, pet]);
    return id;
  }

  function deletePet(id: string): void {
    setPets((current) => current.filter((pet) => pet.id !== id));
  }

  return (
    <DemoContext.Provider value={{ pets, createPet, deletePet }}>{children}</DemoContext.Provider>
  );
}

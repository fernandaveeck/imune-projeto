import { createContext, useContext } from "react";

export interface DemoVaccination {
  id: string;
  name: string;
  administered_at: string;
  next_due_at: string;
  notes: string;
}

export interface DemoPetInput {
  name: string;
  species: string;
  breed: string;
  birth_date: string | null;
  approx_birth_year: number | null;
  weight: number;
  sex: string;
  notes: string | null;
}

export interface DemoVaccineInput {
  name: string;
  administered_at: string;
  next_due_at: string;
  notes: string;
}

export interface DemoPet extends DemoPetInput {
  id: string;
  vaccinations: DemoVaccination[];
}

export interface DemoContextValue {
  pets: DemoPet[];
  createPet: (input: DemoPetInput, vaccines: DemoVaccineInput[]) => string;
  deletePet: (id: string) => void;
}

export const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoProvider não encontrado.");
  return context;
}

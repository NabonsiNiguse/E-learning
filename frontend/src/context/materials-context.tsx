import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from "react";
import { mockMaterials, type Material, type FileType } from "@/lib/mock-data";

interface MaterialsContextValue {
  materials: Material[];
  addMaterial: (m: Omit<Material, "id" | "downloads" | "uploaded_at">) => void;
  deleteMaterial: (id: string) => void;
}

const MaterialsContext = createContext<MaterialsContextValue | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);

  const addMaterial = useCallback(
    (m: Omit<Material, "id" | "downloads" | "uploaded_at">) => {
      const newMat: Material = {
        ...m,
        id:          `mat-${Date.now()}`,
        downloads:   0,
        uploaded_at: new Date().toISOString().split("T")[0],
      };
      setMaterials((prev) => [newMat, ...prev]);
    },
    []
  );

  const deleteMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <MaterialsContext.Provider value={{ materials, addMaterial, deleteMaterial }}>
      {children}
    </MaterialsContext.Provider>
  );
}

export function useMaterials() {
  const ctx = useContext(MaterialsContext);
  if (!ctx) throw new Error("useMaterials must be used within MaterialsProvider");
  return ctx;
}

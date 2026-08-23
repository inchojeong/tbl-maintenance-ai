import { create } from "zustand";

export type AnnotationSide = "left" | "right";

export type AnnotationSpec = {
  id: string;
  world: [number, number, number];
  side: AnnotationSide;
  title: string;
  subtitle?: string;
  accent?: boolean;
  clickId?: string;
};

export type AnnotationScreen = {
  id: string;
  /** pixel coords relative to canvas container */
  x: number;
  y: number;
  visible: boolean;
};

type AnnotationState = {
  specs: AnnotationSpec[];
  screens: Record<string, AnnotationScreen>;
  setSpecs: (specs: AnnotationSpec[]) => void;
  setScreens: (screens: Record<string, AnnotationScreen>) => void;
};

/** Bridge between R3F projector and DOM overlay */
export const useAnnotationStore = create<AnnotationState>((set) => ({
  specs: [],
  screens: {},
  setSpecs: (specs) => set({ specs }),
  setScreens: (screens) => set({ screens }),
}));

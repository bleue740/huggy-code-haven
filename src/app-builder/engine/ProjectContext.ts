/**
 * ProjectContext — persistent project metadata injected into every AI call.
 * Tracks stack, features, decisions, and constraints.
 */
export interface ProjectContextData {
  stack: string;
  packageManager: string;
  dependencies: string[];
  features: string[];
  decisions: Array<{ timestamp: number; decision: string }>;
  constraints: string[];
}

const DEFAULT_CONTEXT: ProjectContextData = {
  stack: "react-vite-tailwind",
  packageManager: "cdn-globals",
  dependencies: [
    "react@18", "react-dom@18", "tailwindcss",
    "lucide-react", "recharts", "framer-motion",
    "react-router-dom", "date-fns",
  ],
  features: [],
  decisions: [],
  constraints: [
    "no-import-export-between-files",
    "globals-only",
    "no-cdn-in-generated-code",
    "typescript-style",
    "dark-mode-default",
  ],
};

export class ProjectContext {
  private data: ProjectContextData;

  constructor(initial?: Partial<ProjectContextData>) {
    this.data = { ...DEFAULT_CONTEXT, ...initial };
  }

  /** Add a feature to track */
  addFeature(feature: string): void {
    if (!this.data.features.includes(feature)) {
      this.data.features.push(feature);
    }
  }

  /** Record an architectural decision */
  addDecision(decision: string): void {
    this.data.decisions.push({
      timestamp: Date.now(),
      decision,
    });
    // Keep only last 20 decisions
    if (this.data.decisions.length > 20) {
      this.data.decisions = this.data.decisions.slice(-20);
    }
  }

  /** Add a dependency */
  addDependency(dep: string): void {
    if (!this.data.dependencies.includes(dep)) {
      this.data.dependencies.push(dep);
    }
  }

  /** Update features from plan intent */
  updateFromPlan(intent: string): void {
    this.addFeature(intent);
    this.addDecision(`Implemented: ${intent}`);
  }

  /** Get context as a string for AI prompts */
  toPromptString(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /** Get raw data */
  getData(): ProjectContextData {
    return { ...this.data };
  }

  /** Serialize for storage */
  serialize(): string {
    return JSON.stringify(this.data);
  }

  /** Deserialize from storage */
  static deserialize(raw: string | null): ProjectContext {
    if (!raw) return new ProjectContext();
    try {
      return new ProjectContext(JSON.parse(raw));
    } catch {
      return new ProjectContext();
    }
  }
}

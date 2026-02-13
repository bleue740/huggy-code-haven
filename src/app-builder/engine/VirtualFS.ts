/**
 * VirtualFS — the single source of truth for all project files.
 * Manages file CRUD, snapshots, and diffs.
 */
export class VirtualFS {
  private files = new Map<string, string>();

  constructor(initial?: Record<string, string>) {
    if (initial) {
      Object.entries(initial).forEach(([path, content]) => {
        this.files.set(path, content);
      });
    }
  }

  write(path: string, content: string): void {
    this.files.set(path, content);
  }

  read(path: string): string | undefined {
    return this.files.get(path);
  }

  delete(path: string): boolean {
    return this.files.delete(path);
  }

  exists(path: string): boolean {
    return this.files.has(path);
  }

  listFiles(): string[] {
    return [...this.files.keys()].sort();
  }

  /** Apply a batch of file changes from the generator agent */
  applyPatch(patch: { files: Array<{ path: string; content: string }>; deletedFiles?: string[] }): void {
    for (const file of patch.files) {
      this.files.set(file.path, file.content);
    }
    if (patch.deletedFiles) {
      for (const path of patch.deletedFiles) {
        if (path !== "App.tsx") {
          this.files.delete(path);
        }
      }
    }
  }

  /** Get all files as a plain object */
  toObject(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [path, content] of this.files) {
      obj[path] = content;
    }
    return obj;
  }

  /** Create a deep copy snapshot */
  snapshot(): Record<string, string> {
    return { ...this.toObject() };
  }

  /** Get the file tree as a string (for AI context) */
  getFileTree(): string {
    return this.listFiles().join("\n");
  }

  /** Build concatenated code for preview (components first, App.tsx last) */
  buildPreviewCode(): string {
    const entries = [...this.files.entries()];
    const app = entries.find(([n]) => n === "App.tsx");
    const others = entries.filter(([n]) => n !== "App.tsx").sort(([a], [b]) => a.localeCompare(b));
    return [...others.map(([, c]) => c), app?.[1] ?? ""].join("\n\n");
  }

  /** Serialize for database persistence */
  serialize(): string {
    if (this.files.size === 1 && this.files.has("App.tsx")) {
      return this.files.get("App.tsx")!;
    }
    return JSON.stringify({ __multifile: true, files: this.toObject() });
  }

  /** Deserialize from database */
  static deserialize(raw: string | null | undefined, defaults: Record<string, string>): VirtualFS {
    if (!raw) return new VirtualFS(defaults);
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.__multifile && typeof parsed.files === "object") {
        return new VirtualFS(parsed.files);
      }
      return new VirtualFS({ "App.tsx": raw });
    } catch {
      return new VirtualFS({ "App.tsx": raw });
    }
  }
}

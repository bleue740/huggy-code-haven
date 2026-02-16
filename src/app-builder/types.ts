export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeApplied?: boolean;
  codeLineCount?: number;
  snapshotId?: string;
}

export interface AISuggestion {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: 'layout' | 'form' | 'chart' | 'button' | 'table';
}

export interface UIComponent {
  id: string;
  type: 'HEADER' | 'INPUT_FIELD' | 'BUTTON' | 'CARD' | 'TEXT' | 'CONTAINER' | 'TABLE' | 'CHART' | 'NAVBAR';
  children?: UIComponent[];
  props?: Record<string, any>;
  actions?: Record<string, { type: string; payload?: any }>;
  [key: string]: any;
}

export interface SecurityResult {
  name: string;
  status: 'passed' | 'warning' | 'info';
  description: string;
  severity?: 'error' | 'warning' | 'info';
  line?: number;
}

export interface AIEvent {
  id: string;
  type: 'status' | 'tool' | 'error';
  text: string;
  timestamp: number;
}

export interface GenerationStep {
  id: string;
  type: 'thinking' | 'editing' | 'edited' | 'error';
  label: string;
  fileName?: string;
  status: 'active' | 'done' | 'error';
  startedAt: number;
  completedAt?: number;
}

export type BackendNeed = 'database' | 'auth' | 'storage' | 'scraping';

export interface AppState {
  projectId?: string;
  credits: number;
  currentInput: string;
  isGenerating: boolean;
  aiStatusText?: string | null;
  aiEvents?: AIEvent[];
  isCodeView: boolean;
  history: Message[];
  files: Record<string, string>;
  activeFile: string;
  suggestions: AISuggestion[];
  selectedWidgetId?: string;
  isVisualEditMode?: boolean;
  screenshotAttachment?: string | null;
  showHistoryModal?: boolean;
  isDeploying?: boolean;
  deploymentProgress?: number;
  deployedUrl?: string | null;
  customDomain?: string | null;
  deploymentHistory?: { id: string; url: string; created_at: string }[];
  projectName?: string;
  showUpgradeModal?: boolean;
  isRunningSecurity?: boolean;
  showSecurityModal?: boolean;
  securityScore?: number;
  securityResults?: SecurityResult[];
  // Full-stack backend integration
  supabaseUrl?: string | null;
  supabaseAnonKey?: string | null;
  firecrawlEnabled?: boolean;
  backendHints?: BackendNeed[];
  showSupabaseModal?: boolean;
  chatMode?: 'plan' | 'agent';
  generationSteps?: GenerationStep[];
}

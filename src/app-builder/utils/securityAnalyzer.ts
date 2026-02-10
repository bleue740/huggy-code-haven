import type { SecurityResult } from '../types';

interface SecurityRule {
  name: string;
  pattern: RegExp;
  severity: 'error' | 'warning' | 'info';
  description: string;
  penalty: number;
}

const RULES: SecurityRule[] = [
  {
    name: 'XSS via dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML/g,
    severity: 'error',
    description: 'Using dangerouslySetInnerHTML can expose the app to XSS attacks. Sanitize content with DOMPurify.',
    penalty: 15,
  },
  {
    name: 'eval() usage',
    pattern: /\beval\s*\(/g,
    severity: 'error',
    description: 'eval() executes arbitrary code and is a critical security risk.',
    penalty: 20,
  },
  {
    name: 'Hardcoded secrets',
    pattern: /(?:apiKey|api_key|secret|password|token)\s*[:=]\s*["'`][A-Za-z0-9_\-]{8,}/gi,
    severity: 'error',
    description: 'Hardcoded secrets detected. Use environment variables instead.',
    penalty: 20,
  },
  {
    name: 'innerHTML assignment',
    pattern: /\.innerHTML\s*=/g,
    severity: 'warning',
    description: 'Direct innerHTML assignment can lead to XSS. Use textContent or a sanitizer.',
    penalty: 10,
  },
  {
    name: 'document.write usage',
    pattern: /document\.write\s*\(/g,
    severity: 'warning',
    description: 'document.write can overwrite the entire page and is unsafe.',
    penalty: 10,
  },
  {
    name: 'Insecure HTTP import/fetch',
    pattern: /(?:import|fetch|src=|href=)\s*["'`]http:\/\//g,
    severity: 'warning',
    description: 'Using HTTP instead of HTTPS exposes data to man-in-the-middle attacks.',
    penalty: 8,
  },
  {
    name: 'Script injection in template literals',
    pattern: /`[^`]*<script[^`]*`/gi,
    severity: 'warning',
    description: 'Template literals containing <script> tags risk injection attacks.',
    penalty: 12,
  },
  {
    name: 'Inline onclick handlers',
    pattern: /onclick\s*=/gi,
    severity: 'info',
    description: 'Inline event handlers are harder to secure. Use addEventListener or React handlers.',
    penalty: 3,
  },
  {
    name: 'console.log in production',
    pattern: /console\.log\s*\(/g,
    severity: 'info',
    description: 'Console logs may leak sensitive data in production. Remove before deploying.',
    penalty: 2,
  },
];

function findLineNumber(content: string, matchIndex: number): number {
  return content.substring(0, matchIndex).split('\n').length;
}

export function analyzeCodeSecurity(
  files: Record<string, string>
): { results: SecurityResult[]; score: number } {
  const results: SecurityResult[] = [];
  let totalPenalty = 0;

  for (const [filename, content] of Object.entries(files)) {
    for (const rule of RULES) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match: RegExpExecArray | null;
      let found = false;

      while ((match = regex.exec(content)) !== null) {
        if (!found) {
          found = true;
          totalPenalty += rule.penalty;
          results.push({
            name: `${rule.name} — ${filename}`,
            status: rule.severity === 'error' ? 'warning' : rule.severity === 'warning' ? 'info' : 'passed',
            description: `Line ${findLineNumber(content, match.index)}: ${rule.description}`,
            severity: rule.severity,
            line: findLineNumber(content, match.index),
          });
        }
      }
    }
  }

  if (results.length === 0) {
    results.push({
      name: 'No issues found',
      status: 'passed',
      description: 'Your code passed all security checks.',
    });
  }

  // Sort: errors first, then warnings, then info
  const order = { error: 0, warning: 1, info: 2 };
  results.sort((a, b) => order[a.severity ?? 'info'] - order[b.severity ?? 'info']);

  return { results, score: Math.max(0, 100 - totalPenalty) };
}

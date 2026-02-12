

# Repurpose "Chat" Button as Plan Mode Toggle

## Overview

The existing "Chat" button in the sidebar input area (bottom-right) will become the Plan/Agent mode switch:

- **Chat button active (highlighted)** = Plan Mode: AI discusses, analyzes, asks questions -- no code is generated or applied to the preview
- **Chat button inactive (default)** = Agent Mode: AI generates code and applies it to the preview (current behavior)

```text
INPUT AREA (bottom bar):
┌──────────────────────────────────────────────────────┐
│  [+] [Visual] [Mic]              [Chat] [Send/Stop]  │
│                                   ^^^^               │
│                            Plan mode toggle           │
│                            (blue = plan active)       │
└──────────────────────────────────────────────────────┘

Chat active (Plan mode):
- AI responds with explanations, questions, structured plans
- No code extraction, no preview update
- Markdown-rendered conversation only

Chat inactive (Agent mode - default):
- AI generates code + explanation
- Code extracted and applied to preview
- "Code applied" indicator shown in chat
```

## Changes

### 1. Types (`src/app-builder/types.ts`)

Add to `AppState`:
- `chatMode: 'plan' | 'agent'` (default: `'agent'`)

### 2. Sidebar (`src/app-builder/components/Sidebar.tsx`)

Modify the "Chat" button (line 581-583):
- Currently: toggles `isCodeView` to `false` (shows chat view)
- New behavior: toggles `chatMode` between `'plan'` and `'agent'`
- When `chatMode === 'plan'`: button is blue/highlighted, shows "Chat" label
- When `chatMode === 'agent'`: button is default gray style
- If user is in code view and clicks Chat, also switch to chat view (keep existing behavior)

Update the generating indicator (lines 424-456):
- In Plan mode: show "Thinking..." with a simpler indicator (no code shimmer)
- In Agent mode: keep existing shimmer + "Generating code..." indicator

### 3. Edge Function (`supabase/functions/ai-chat/index.ts`)

Accept `mode: 'plan' | 'agent'` in the request body.

When `mode === 'plan'`:
- Use a Plan-specific system prompt that instructs the AI to:
  - Analyze, reason, ask clarifying questions
  - Propose structured approaches
  - NEVER output code blocks (no ```tsx, no ```jsx)
  - Focus on architecture, UX decisions, data models
  - Respond in the same language as the user

When `mode === 'agent'` (default, unchanged):
- Keep existing code-generation system prompt

### 4. useAIChat hook (`src/app-builder/hooks/useAIChat.ts`)

Add `mode` parameter to `sendMessage()` -- pass it in the request body to the edge function.

### 5. App.tsx (`src/app-builder/App.tsx`)

Update `handleSendMessage`:
- Pass `state.chatMode` (or `'agent'` by default) to `sendAIMessage`
- In `onDone` callback:
  - If `chatMode === 'plan'`: do NOT extract code, do NOT apply to preview. Just store the full text as the assistant message (with markdown rendering via ChatMessage).
  - If `chatMode === 'agent'`: existing behavior (extract code, apply, show "code applied" indicator)

### 6. ChatMessage (`src/app-builder/components/ChatMessage.tsx`)

No changes needed -- it already strips code blocks and renders markdown. In Plan mode, there will be no code blocks to strip so it just renders the full markdown response.

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app-builder/types.ts` | Modify | Add `chatMode` to AppState |
| `src/app-builder/components/Sidebar.tsx` | Modify | Repurpose Chat button as mode toggle, adapt generating indicator |
| `supabase/functions/ai-chat/index.ts` | Modify | Accept `mode` param, add Plan system prompt |
| `src/app-builder/hooks/useAIChat.ts` | Modify | Pass `mode` to edge function |
| `src/app-builder/App.tsx` | Modify | Conditional onDone logic based on chatMode |

## Implementation Order

1. `types.ts` -- add `chatMode` field
2. `ai-chat/index.ts` -- Plan system prompt + mode routing
3. `useAIChat.ts` -- pass mode param
4. `App.tsx` -- conditional code extraction
5. `Sidebar.tsx` -- repurpose Chat button + adapt UI


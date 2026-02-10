

# Fix: Chat Flow -- Hide Raw Code, Render Markdown, Show "Code Applied" Indicator

## Problem

Right now, when the AI responds, the **entire raw response** (including the full ```tsx code block) is dumped directly into the chat as plain text. This makes the chat unusable -- you see hundreds of lines of raw code instead of a clean explanation like on Lovable.

```text
CURRENT (broken):
┌─────────────────────────────────────────┐
│ BLINK: Voici un dashboard...            │
│ ```tsx                                  │
│ const { useState } = React;             │
│ function App() { ...                    │
│ ... 200 lines of raw code ...           │
│ ```                                     │
└─────────────────────────────────────────┘

EXPECTED (fixed):
┌─────────────────────────────────────────┐
│ BLINK: Voici un dashboard avec des      │
│ charts et une table de donnees.         │
│                                         │
│ ┌─ Code applied to preview ──────────┐  │
│ │ App.tsx updated (147 lines)        │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Root Causes

1. **No markdown rendering** (Sidebar.tsx line 400): `msg.content` is rendered as plain text with `whitespace-pre-wrap`
2. **Raw code stays in chat history** (App.tsx lines 286-303): The full AI response with code blocks is stored in history and never cleaned up
3. **No visual indicator** when code is applied to the preview

## Solution

### Step 1: Create a message renderer component

Create `src/app-builder/components/ChatMessage.tsx` that:
- Strips ```tsx/jsx/javascript code blocks from the displayed content
- Shows a compact "Code applied to preview" card with line count when code was extracted
- Renders the remaining text with basic markdown support (bold, italic, inline code, lists)
- No new dependencies needed -- use a simple regex-based renderer

### Step 2: Clean up chat history on completion

Modify `App.tsx` `onDone` callback (lines 286-303):
- After extracting code, replace the streaming message's content with the **explanation only** (text without code blocks)
- Store a flag on the message indicating code was applied (add `codeApplied?: boolean` and `codeLineCount?: number` to the Message type)

### Step 3: Update Message type

Modify `src/app-builder/types.ts`:
- Add `codeApplied?: boolean` and `codeLineCount?: number` to the `Message` interface

### Step 4: Use ChatMessage in Sidebar

Modify `src/app-builder/components/Sidebar.tsx` line 400:
- Replace the raw `{msg.content}` div with the new `<ChatMessage>` component

## Files to modify

| File | Change |
|------|--------|
| `src/app-builder/types.ts` | Add `codeApplied` and `codeLineCount` to `Message` |
| `src/app-builder/components/ChatMessage.tsx` | Create -- markdown renderer + code-applied indicator |
| `src/app-builder/components/Sidebar.tsx` | Use `<ChatMessage>` instead of raw text |
| `src/app-builder/App.tsx` | Strip code blocks from stored message on completion, set `codeApplied` flag |
| `src/app-builder/hooks/useAIChat.ts` | Add helper `stripCodeBlocks()` export |

## Technical Details

### ChatMessage component logic

```text
1. Check if message has codeApplied flag
2. Strip any remaining code blocks from content (safety)
3. Render text with simple markdown:
   - **bold** -> <strong>
   - `inline code` -> <code>
   - - list items -> <li>
   - Line breaks -> <br>
4. If codeApplied, show a compact card:
   "Code applied to preview -- App.tsx (N lines)"
   with a subtle green checkmark icon
```

### onDone cleanup in App.tsx

```text
1. Extract code (existing logic)
2. Remove code block from fullText to get explanation-only text
3. Count lines in extracted code
4. Update the streaming message with:
   - content = explanation text (no code block)
   - codeApplied = true
   - codeLineCount = line count
```

This ensures the chat behaves like a real AI builder: clean explanations in chat, code silently applied to the preview.


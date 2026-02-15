

# Premium Generation Overlay + Smart Activation

## Problem
1. The preview overlay animation (GeneratingOverlay) is too basic — floating code cards with a simple orb feel generic
2. The overlay appears during ALL AI interactions, including simple conversations where no code is being generated

## Solution

### 1. Smart Activation: Only show overlay during code generation

Update `CodePreview` to accept a new prop `isBuilding` (true only when the orchestrator is in building/planning phase, not during simple conversation). The `GeneratingOverlay` will only render when actual code generation is happening.

In `App.tsx`, pass `isBuilding` based on `_generationPhase` being one of `thinking`, `planning`, or `building` (not `undefined` which means conversational mode).

### 2. Premium Overlay Redesign

Replace the current basic overlay with a cinematic, Lovable-grade experience:

- **Animated particle grid**: A subtle dot-grid background with particles that pulse outward from center, creating a "neural network" feel
- **Morphing orb**: Replace the static pulsing circles with a gradient orb that uses CSS animations to morph between shapes (blob effect) with a blue-to-purple gradient
- **Code rain effect**: Instead of static floating cards, show thin vertical streams of code characters (matrix-style but subtle and elegant) fading in/out
- **Phase-aware center display**: The center text adapts based on the current generation phase with smooth crossfade transitions
- **Glassmorphic status card**: A frosted-glass card in the center showing the current phase icon, status text, and an animated progress ring (SVG circle with stroke-dasharray animation)
- **Radial glow pulse**: A large, soft radial gradient that slowly breathes behind the orb

### Technical Details

**Files to modify:**
- `src/app-builder/components/GeneratingOverlay.tsx` — Complete rewrite with premium animations
- `src/app-builder/components/CodePreview.tsx` — Add `isBuilding` prop, pass it to overlay instead of `isGenerating`
- `src/app-builder/App.tsx` — Compute `isBuilding` from `_generationPhase` state; pass to `CodePreview`

**New overlay structure:**
```text
+------------------------------------------+
|  [particle grid background]              |
|                                          |
|     [code rain streams - subtle]         |
|                                          |
|        +-------------------+             |
|        | [morphing orb]    |             |
|        | [radial glow]     |             |
|        +-------------------+             |
|                                          |
|     +-------------------------+          |
|     | [glass card]            |          |
|     |  Phase icon + text      |          |
|     |  Progress ring (SVG)    |          |
|     |  Phase dots             |          |
|     +-------------------------+          |
|                                          |
+------------------------------------------+
```

**Animation techniques (CSS only, no libraries):**
- `@keyframes blob` for morphing orb shape
- `@keyframes code-rain` for vertical code streams
- `@keyframes breathe` for radial glow
- `@keyframes grid-pulse` for particle grid dots
- SVG `stroke-dashoffset` transition for progress ring
- `transition` on text opacity for smooth phase crossfade

**Activation logic in App.tsx:**
- `isBuilding = state._generationPhase && state._generationPhase !== 'preview_ready' && state._generationPhase !== 'error'`
- Pass `isBuilding` to `CodePreview` instead of `isGenerating`
- Conversational replies already clear `_generationPhase` to `undefined`, so the overlay naturally hides


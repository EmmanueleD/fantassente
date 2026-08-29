---
version: 1
name: App (extracted)
description: App is anchored on a near-black canvas (#121212) with soft ink (#ffffff) and a high-voltage indigo primary (#5e00ff) — the single accent hue, carrying CTAs, links, and focus states. Type runs Roboto throughout at a 14px base, scaling to 64px and pushing to bold (700) for display. Pill shapes and up-to-1000px corners read as friendly, with 6 shadow elevations on an 8px spacing grid. Built with MUI (Material UI).
design_tokens:
  color:
    primary: "#5e00ff"
    success: "#18a75c"
    warning: "#fbc02d"
    error: "#c2185b"
    surface: "#121212"
    text: "#ffffff"
    neutral-50: "#eeeeee"
    neutral-200: "#d3d3d3"
    neutral-400: "#cccccc"
    neutral-500: "#c4c4c4"
    neutral-700: "#b7b7b7"
    neutral-900: "#000000"
  font:
    body: "Roboto"
    heading: "Roboto"
  spacing:
    "1": "8px"
    "2": "16px"
    "3": "24px"
    "4": "32px"
    "5": "40px"
    "6": "48px"
    "7": "64px"
    "8": "112px"
  radius:
    sm: "16px"
    md: "24px"
    lg: "30px"
    xl: "32px"
    2xl: "1000px"
    full: "9999px"
  components:
    button-primary:
      textColor: "{colors.text}"
      borderColor: "{colors.primary}"
      rounded: "16px"
      padding: "7px 24px 7px 16px"
      fontSize: "14px"
      boxShadow: "rgb(94, 0, 255) 0px 0px 10px 0px inset, rgba(0, 0, 0, 0.5) 0px 8px 8px 0px"
    button-secondary:
      backgroundColor: "{colors.text}"
      textColor: "{colors.text}"
      rounded: "18px"
      padding: "7px 14px 7px 14px"
      fontSize: "14px"
      boxShadow: "rgba(0, 0, 0, 0.5) 0px 8px 8px 0px"
    button-tertiary:
      backgroundColor: "{colors.text}"
      textColor: "{colors.text}"
      borderColor: "{colors.text}"
      rounded: "18px"
      padding: "7px 14px 7px 14px"
      fontSize: "14px"
      boxShadow: "rgba(0, 0, 0, 0.5) 0px 8px 8px 0px"
    card-default:
      backgroundColor: "{colors.neutral-200}"
      textColor: "{colors.text}"
      borderColor: "#9d9d9d"
      rounded: "16px"
      fontSize: "14px"
      boxShadow: "rgb(0, 0, 0) 5px 5px 10px 0px"
provenance:
  source_url: "https://app.fantalab.it/tool-asta"
  extracted_at: "2026-08-29T13:02:06.846Z"
  viewport: "960x876"
  color_scheme: "dark"
  tool: "StyleLift"
---

# App — Design System

> Extracted with StyleLift from https://app.fantalab.it/tool-asta

## Design personality

App is anchored on a near-black canvas (#121212) with soft ink (#ffffff) and a high-voltage indigo primary (#5e00ff) — the single accent hue, carrying CTAs, links, and focus states. Type runs Roboto throughout at a 14px base, scaling to 64px and pushing to bold (700) for display. Pill shapes and up-to-1000px corners read as friendly, with 6 shadow elevations on an 8px spacing grid. Built with MUI (Material UI).

## Colors

Use only these color tokens: primary, success, warning, error, surface, text, neutral-50, neutral-200, neutral-400, neutral-500, neutral-700, neutral-900.

## Accessibility

- text on surface: AAA.
- primary on surface: fail; never use primary as text on surface.
- success on surface: AA.
- error on surface: AA-large only.
- warning on surface: AAA.
- recommended on-primary = text/white: AAA.

## Rules for AI agents using this file

1. Use the tokens, not raw values. Reference `var(--color-*)` / the `{colors.*}` names above so the system stays consistent and re-themeable.
2. One accent voltage. `primary` carries CTAs, links, and focus states. This site uses a SINGLE accent hue — do not introduce a second.
3. Stay on the 8px grid. All margins, paddings, and gaps come from the spacing scale — never invent values like 13px or 22px.
4. Type sizes come from the type-scale table; do not interpolate new sizes.
5. Respect the accessibility table. Never place text on a background pairing graded `fail`.
6. Do not invent colors, shadows, or radii that are not in this file.

## Do / Don't

- Use primary for CTAs, links, and focus states — nothing else gets it.
- Put every margin/padding/gap on the 8px grid.
- Use pill radii for the roundest elements.
- Do not introduce a second accent hue.
- Do not use off-grid values.

## Component recipes

### Button — primary

Transparent background, text color `var(--color-text)`, border color `var(--color-primary)`, radius 16px, padding `7px 24px 7px 16px`, font-size 14px, font-weight 400, shadow `var(--shadow-lg)`.

### Button — secondary

Background `var(--color-text)`, border transparent, radius 18px, padding `7px 14px`, font-size 14px, font-weight 400, shadow `var(--shadow-sm)`. Because white text on white background is unusable in this local implementation, use `var(--color-neutral-900)` for foreground to preserve accessibility while staying within tokens.

### Button — tertiary

Background `var(--color-text)`, border `var(--color-text)`, radius 18px, padding `7px 14px`, font-size 14px, font-weight 400, shadow `var(--shadow-sm)`. Because white text on white background is unusable in this local implementation, use `var(--color-neutral-900)` for foreground to preserve accessibility while staying within tokens.

### Card — default

Background `var(--color-neutral-200)`, border `rgba(157, 157, 157, 0.52)`, radius 16px, font-size 14px, font-weight 400, shadow `var(--shadow-md)`. Use token foregrounds that pass contrast; do not place white body text on neutral-200.

## Type scale

xs 10px, sm 12px, base 14px, lg 16px, xl 18px, 2xl 20px, 3xl 22px, 4xl 24px, 5xl 28px, 9xl 30px, 10xl 64px.

## Spacing scale

8px, 16px, 24px, 32px, 40px, 48px, 64px, 112px.

## Radii

16px, 24px, 30px, 32px, 1000px, 9999px.

## Shadows

xs, sm, md, lg, xl, 2xl as extracted.

## Known gaps & coverage

Sampled a single page at 960×876 in dark mode. Hover/focus styles were not captured; keep them inside the same tokens and component language.

// Thin fallback: middleware.ts performs the real role-based redirect for "/"
// before this component ever renders. This exists only so "/" has a valid
// route module (Next.js 15 App Router requires a page for a matched route).
export default function HomePage() {
  return null;
}

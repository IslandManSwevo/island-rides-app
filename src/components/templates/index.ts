/**
 * Legacy StyleSheet templates, driven by ThemeContext. New surfaces use the
 * KeyLo kit in src/components/ui instead — these survive only for the screens
 * that haven't been rebuilt yet (Favorites, DocumentUpload, RouteGuard, …).
 *
 * The Gluestack variants that lived here are gone: Gluestack was deprecated in
 * code phase 2 and its provider has been removed from App.tsx.
 */
export { StandardButton } from './StandardButton';
export { StandardInput } from './StandardInput';
export { StandardCard } from './StandardCard';
export { ThemeToggle } from './ThemeToggle';
/** Open the global auth modal (Sign in / Sign up). */
export function openAuthModal(mode: 'signin' | 'signup' = 'signin') {
  window.dispatchEvent(
    new CustomEvent('open-auth-modal', { detail: { mode } }),
  );
}

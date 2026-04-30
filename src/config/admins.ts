// Emails authorized to access the /admin route.
// Add or remove entries here to manage admin access.
export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'mattia.sorgato@gmail.com',
]);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

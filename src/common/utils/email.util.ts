/** Linear-time email shape check. Avoids backtracking regex (S5852). */
export function isWellFormedEmail(email: string): boolean {
  if (email.length < 3 || email.length > 254) {
    return false;
  }
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) {
    return false;
  }
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1 && !email.includes(' ');
}

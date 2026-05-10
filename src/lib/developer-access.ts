/**
 * Developer / admin emails that bypass subscription paywalls
 * and have unrestricted free access to all InvoiceIQ features.
 */
const DEVELOPER_EMAILS: string[] = [
  "renaat.sibanda@gmail.com",
  "renaat.sibanda23@gmail.com",
  "ruvimbo.gamanya@gmail.com",
  "tormundsand.744196@gmail.com",
  "cindy.mokko420123@gmail.com",
];

/** Returns true if the given email has developer-level free access. */
export const isDeveloperEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return DEVELOPER_EMAILS.includes(email.toLowerCase());
};

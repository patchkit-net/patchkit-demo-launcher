export function generateUserOauth2CodeVerifier() {
  let userOauth2CodeVerifier = ``;

  const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;

  for (let i = 0; i < 24; i++) {
    userOauth2CodeVerifier += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return userOauth2CodeVerifier;
}

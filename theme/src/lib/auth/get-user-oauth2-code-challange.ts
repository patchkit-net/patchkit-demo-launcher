export async function getUserOauth2CodeChallenge({
  userOauth2CodeVerifier,
}: {
  userOauth2CodeVerifier: string;
}) {
  const userOauth2CodeVerifierDigest = await crypto.subtle.digest(
    `SHA-256`,
    new TextEncoder().encode(userOauth2CodeVerifier),
  );

  return btoa(String.fromCharCode(...new Uint8Array(userOauth2CodeVerifierDigest))).replace(/=/g, ``).replace(/\+/g, `-`).replace(/\//g, `_`);
}

/**
 * WebAuthn RP-ID validation (pure, no env / DB / secrets).
 *
 * The Relying Party ID must be a "registrable suffix" of the site's hostname,
 * per the WebAuthn spec. For this single-user self-hosted app we apply a
 * deliberately simple rule instead of pulling in a Public Suffix List:
 *
 *   valid iff
 *     - rpID === hostname, OR
 *     - hostname ends with ("." + rpID) AND rpID contains at least one dot
 *       (the dot requirement rejects bare TLDs like "net"), OR
 *     - dev special case: rpID === "localhost" && hostname === "localhost"
 *
 * rpID and hostname are NOT secrets; it is safe to include them in errors.
 */

export function isValidRpId(rpId: string, baseURL: string): boolean {
  const hostname = new URL(baseURL).hostname;
  // URL already lowercases hostname; lowercase rpID too (domains are
  // case-insensitive) so a mixed-case UPSHOT_RP_ID doesn't spuriously fail.
  const id = rpId.toLowerCase();

  if (id === "localhost") return hostname === "localhost";
  if (id === hostname) return true;

  const isSuffix = hostname.endsWith(`.${id}`);
  const hasDot = id.includes(".");
  return isSuffix && hasDot;
}

export function assertValidRpId(rpId: string, baseURL: string): void {
  if (!isValidRpId(rpId, baseURL)) {
    const hostname = new URL(baseURL).hostname;
    throw new Error(
      `Invalid UPSHOT_RP_ID "${rpId}": it must equal or be a registrable parent ` +
        `domain (with a dot) of the BETTER_AUTH_URL hostname "${hostname}".`,
    );
  }
}

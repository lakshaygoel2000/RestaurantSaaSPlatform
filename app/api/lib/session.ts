import * as jose from "jose";
import { env } from "./env";

const JWT_ALG = "HS256";

export type SessionPayload = {
  unionId: string;
  clientId: string;
};

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60, // Allow 60 seconds of clock skew (common on shared hosting)
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      console.warn("[session] JWT payload missing required fields.");
      return null;
    }
    return { unionId: String(unionId), clientId: String(clientId) } as SessionPayload;
  } catch (error: any) {
    // Log specific error type for debugging without leaking to client
    if (error?.code === "ERR_JWT_EXPIRED") {
      console.warn("[session] JWT verification failed: token expired");
    } else if (error?.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      console.warn("[session] JWT verification failed: invalid signature");
    } else {
      console.warn("[session] JWT verification failed:", error?.message || error);
    }
    return null;
  }
}

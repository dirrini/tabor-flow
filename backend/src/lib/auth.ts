import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

type AuthTokenPayload = {
  userId: number;
  role: string;
  tenantId: number;
};

type IntegrationTokenPayload = {
  integrationClientId: number;
  scopes: string;
  type: "integration";
};

const passwordKeyLength = 64;
const tokenExpirationMs =
  1000 * 60 * 60 * 24;
const integrationTokenExpirationMs =
  1000 * 60 * 15;

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error(
      "AUTH_SECRET environment variable is required."
    );
  }

  return authSecret;
}

function sign(value: string) {
  return createHmac(
    "sha256",
    getAuthSecret()
  )
    .update(value)
    .digest("base64url");
}

export function hashPassword(
  password: string
) {
  const salt =
    randomBytes(16).toString("hex");
  const hash = scryptSync(
    password,
    salt,
    passwordKeyLength
  ).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedPasswordHash: string
) {
  const [
    algorithm,
    salt,
    storedHash
  ] = storedPasswordHash.split(":");

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !storedHash
  ) {
    return false;
  }

  const hash = scryptSync(
    password,
    salt,
    passwordKeyLength
  );
  const storedHashBuffer =
    Buffer.from(storedHash, "hex");

  if (
    hash.length !==
    storedHashBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    hash,
    storedHashBuffer
  );
}

export function createAuthToken(
  payload: AuthTokenPayload
) {
  const tokenPayload = {
    ...payload,
    expiresAt:
      Date.now() + tokenExpirationMs
  };
  const encodedPayload = base64UrlEncode(
    JSON.stringify(tokenPayload)
  );
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(
  token: string
): AuthTokenPayload | null {
  const [
    encodedPayload,
    signature
  ] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature =
    sign(encodedPayload);
  const signatureBuffer =
    Buffer.from(signature);
  const expectedSignatureBuffer =
    Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !==
      expectedSignatureBuffer.length ||
    !timingSafeEqual(
      signatureBuffer,
      expectedSignatureBuffer
    )
  ) {
    return null;
  }

  let payload:
    | (AuthTokenPayload & {
        expiresAt: number;
      })
    | null = null;

  try {
    payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as AuthTokenPayload & {
      expiresAt: number;
    };
  } catch {
    return null;
  }

  if (
    typeof payload.userId !== "number" ||
    typeof payload.role !== "string" ||
    typeof payload.tenantId !== "number" ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt < Date.now()
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    role: payload.role,
    tenantId: payload.tenantId
  };
}

export function createIntegrationToken(
  payload: IntegrationTokenPayload
) {
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT"
    })
  );
  const tokenPayload = base64UrlEncode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(
        (Date.now() +
          integrationTokenExpirationMs) /
          1000
      )
    })
  );
  const signature = sign(
    `${header}.${tokenPayload}`
  );

  return {
    accessToken:
      `${header}.${tokenPayload}.${signature}`,
    expiresAt: new Date(
      Date.now() +
        integrationTokenExpirationMs
    ).toISOString()
  };
}

export function verifyIntegrationToken(
  token: string
): IntegrationTokenPayload | null {
  const [
    header,
    encodedPayload,
    signature
  ] = token.split(".");

  if (
    !header ||
    !encodedPayload ||
    !signature
  ) {
    return null;
  }

  const expectedSignature =
    sign(`${header}.${encodedPayload}`);
  const signatureBuffer =
    Buffer.from(signature);
  const expectedSignatureBuffer =
    Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !==
      expectedSignatureBuffer.length ||
    !timingSafeEqual(
      signatureBuffer,
      expectedSignatureBuffer
    )
  ) {
    return null;
  }

  let payload:
    | (IntegrationTokenPayload & {
        exp: number;
      })
    | null = null;

  try {
    payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as IntegrationTokenPayload & {
      exp: number;
    };
  } catch {
    return null;
  }

  if (
    payload.type !== "integration" ||
    typeof payload.integrationClientId !==
      "number" ||
    typeof payload.scopes !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp * 1000 < Date.now()
  ) {
    return null;
  }

  return {
    integrationClientId:
      payload.integrationClientId,
    scopes: payload.scopes,
    type: "integration"
  };
}

export function hashApiKey(
  apiKey: string
) {
  return createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const keyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [salt, hash] = storedPassword.split(":");

  if (!salt || !hash) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedHashBuffer = scryptSync(password, salt, keyLength);

  return timingSafeEqual(hashBuffer, suppliedHashBuffer);
}

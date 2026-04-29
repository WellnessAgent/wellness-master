import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  createKeyPairSignerFromPrivateKeyBytes,
  getBase58Decoder,
  getBase58Encoder,
  type KeyPairSigner,
} from "@solana/kit";

// Client wallet persisted as a 32-byte Ed25519 seed.
//
// Two at-rest formats are supported, auto-detected on load:
//   - Plaintext (legacy, default):  { seedBase58, address }
//   - Encrypted (opt-in):           { encrypted: true, address, salt, iv, ciphertext }
// Encryption activates when CLIENT_KEYPAIR_PASSPHRASE is set in the env.
// Algorithm: scrypt-derived AES-256-GCM. No external deps, node:crypto only.
//
// The file is always written with mode 0600. Either way: DO NOT reuse a
// plaintext-stored keypair on mainnet.

export type StoredKeypair =
  | { seedBase58: string; address: string }
  | {
      encrypted: true;
      address: string;
      salt: string;       // base64
      iv: string;         // base64
      ciphertext: string; // base64 (AES-GCM ciphertext with 16-byte auth tag appended)
    };

export async function loadOrCreateKeypair(filePath: string): Promise<{
  signer: KeyPairSigner;
  stored: StoredKeypair;
  created: boolean;
}> {
  const abs = path.resolve(filePath);
  const passphrase = process.env.CLIENT_KEYPAIR_PASSPHRASE?.trim() || undefined;

  if (fs.existsSync(abs)) {
    const parsed = JSON.parse(fs.readFileSync(abs, "utf8")) as StoredKeypair;
    const seed = "encrypted" in parsed
      ? decryptSeed(parsed, requirePassphrase(passphrase, abs))
      : plaintextSeed(parsed);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(seed, true);
    return { signer, stored: parsed, created: false };
  }

  const seed = crypto.getRandomValues(new Uint8Array(32));
  const signer = await createKeyPairSignerFromPrivateKeyBytes(seed, true);
  const stored: StoredKeypair = passphrase
    ? encryptSeed(seed, passphrase, signer.address)
    : { seedBase58: getBase58Decoder().decode(seed), address: signer.address };

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(stored, null, 2), { mode: 0o600 });
  fs.chmodSync(abs, 0o600);

  return { signer, stored, created: true };
}

function plaintextSeed(p: { seedBase58: string }): Uint8Array {
  if (!p.seedBase58) throw new Error(`Malformed keypair file: missing seedBase58`);
  const seed = getBase58Encoder().encode(p.seedBase58);
  if (seed.length !== 32) throw new Error(`Seed must be 32 bytes (got ${seed.length})`);
  return new Uint8Array(seed);
}

function requirePassphrase(pass: string | undefined, abs: string): string {
  if (!pass) {
    throw new Error(
      `Keypair at ${abs} is encrypted — set CLIENT_KEYPAIR_PASSPHRASE to decrypt.`,
    );
  }
  return pass;
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  // N=32768, r=8, p=1 — OWASP-recommended scrypt baseline. ~80ms on a modern CPU.
  return crypto.scryptSync(passphrase, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

function encryptSeed(
  seed: Uint8Array,
  passphrase: string,
  address: string,
): StoredKeypair {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(seed), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: true,
    address,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: Buffer.concat([enc, tag]).toString("base64"),
  };
}

function decryptSeed(
  p: Extract<StoredKeypair, { encrypted: true }>,
  passphrase: string,
): Uint8Array {
  const salt = Buffer.from(p.salt, "base64");
  const iv = Buffer.from(p.iv, "base64");
  const blob = Buffer.from(p.ciphertext, "base64");
  const tag = blob.subarray(blob.length - 16);
  const ct = blob.subarray(0, blob.length - 16);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const seed = Buffer.concat([decipher.update(ct), decipher.final()]);
  if (seed.length !== 32) throw new Error(`Decrypted seed has wrong length: ${seed.length}`);
  return new Uint8Array(seed);
}

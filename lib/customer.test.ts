import { describe, it, expect, beforeAll } from "vitest";
import { signResumeToken, verifyResumeToken } from "./customer";

beforeAll(() => {
  process.env.RESUME_TOKEN_SECRET = "test-secret-do-not-use-in-prod";
});

describe("resume token (PDF-05/06)", () => {
  it("roundtrips a valid token", () => {
    const token = signResumeToken("cust-123");
    expect(verifyResumeToken(token)).toEqual({ customerId: "cust-123" });
  });

  it("rejects a tampered signature", () => {
    const token = signResumeToken("cust-123");
    const [payload, sig] = token.split(".");
    const tampered = `${payload}.${sig.slice(0, -1)}${sig.at(-1) === "a" ? "b" : "a"}`;
    expect(verifyResumeToken(tampered)).toBeNull();
  });

  it("rejects a tampered payload (customer id swapped)", () => {
    const token = signResumeToken("cust-123");
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from("cust-999.999999999999", "utf8").toString("base64url");
    expect(verifyResumeToken(`${forgedPayload}.${sig}`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const sixtyOneDaysAgo = Date.now() - 61 * 24 * 60 * 60 * 1000;
    const payload = `cust-123.${sixtyOneDaysAgo}`;
    const encoded = Buffer.from(payload, "utf8").toString("base64url");
    // Re-derive the signature the same way signResumeToken would have, for an old timestamp.
    const crypto = require("node:crypto");
    const sig = crypto.createHmac("sha256", process.env.RESUME_TOKEN_SECRET!).update(payload).digest("base64url");
    expect(verifyResumeToken(`${encoded}.${sig}`)).toBeNull();
  });

  it("rejects malformed tokens without throwing", () => {
    expect(verifyResumeToken("")).toBeNull();
    expect(verifyResumeToken("not-a-token")).toBeNull();
    expect(verifyResumeToken("a.b.c")).toBeNull();
  });
});

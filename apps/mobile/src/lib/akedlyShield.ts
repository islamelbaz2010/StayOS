/**
 * Client-side Akedly Shield V1.2 integration for the OTP send flow.
 *
 * The StayOS backend proxies Akedly's /transactions/challenge (GET
 * /auth/otp/challenge) so the Akedly API key and pipeline ID never reach this
 * app. This module fetches that challenge and solves the Proof-of-Work puzzle
 * client-side using Akedly's own official @akedly/shield package, then hands
 * the caller (LoginScreen) a proof object to attach to the /auth/otp/send call.
 *
 * Turnstile: @akedly/shield v1.1.0's own README documents no working
 * mechanism for React Native — getTurnstileToken()/renderTurnstile() are
 * explicitly browser/DOM-only, and its "Platform Support" table lists
 * React Native + Turnstile as "Use bridge page" with no bridge URL,
 * component, or message-passing protocol given anywhere in the shipped
 * package (verified directly against the published package's README/
 * TypeScript declarations, not assumed). If a pipeline challenge ever
 * reports turnstile_required for this app, there is currently no way to
 * satisfy it — resolveOtpProof() throws AkedlyTurnstileUnsupportedError
 * rather than silently sending an OTP request Akedly would reject, or
 * fabricating a token. See docs/legal or the Akedly integration report for
 * the founder-facing summary of this gap.
 */
import { solvePow } from "@akedly/shield";

import { api } from "./api";

export interface OtpChallenge {
  challenge: string;
  difficulty: number;
  challenge_token: string;
  challenge_required: boolean;
  turnstile_required: boolean;
  turnstile_site_key: string | null;
}

export interface OtpProof {
  pow_solution?: { challenge_token: string; nonce: number };
  turnstile_token?: string;
}

export class AkedlyTurnstileUnsupportedError extends Error {
  constructor() {
    super(
      "This sign-in step currently requires extra verification that this app " +
        "version doesn't support yet. Please try again later."
    );
    this.name = "AkedlyTurnstileUnsupportedError";
  }
}

/**
 * Fetches a fresh Akedly challenge from the StayOS backend and solves its
 * Proof-of-Work puzzle (when required) via @akedly/shield's solvePow(),
 * which handles the React Native environment automatically (falls back to
 * batched main-thread solving since Worker/Blob aren't available — no
 * configuration needed on our side).
 *
 * Call this immediately before POST /auth/otp/send and forward the returned
 * proof as extra fields on that request body.
 */
export async function resolveOtpProof(): Promise<OtpProof> {
  const { data: challenge } = await api.get<OtpChallenge>("/auth/otp/challenge");

  const proof: OtpProof = {};

  if (challenge.challenge_required && challenge.challenge) {
    const { nonce } = await solvePow(challenge.challenge, challenge.difficulty);
    proof.pow_solution = {
      challenge_token: challenge.challenge_token,
      nonce,
    };
  }

  if (challenge.turnstile_required) {
    throw new AkedlyTurnstileUnsupportedError();
  }

  return proof;
}

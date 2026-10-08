import { z } from "zod";

/**
 * Simulation message protocol, version 1. See docs/SIMULATION_PROTOCOL.md.
 *
 * Every message is an envelope `{ sll: 1, type, payload }` sent with window.postMessage.
 * The host never sends user identity; only a random session id.
 * Changes must stay backward compatible: add optional message types or fields, never remove.
 */

export const PROTOCOL_VERSION = 1;

const value = z.union([z.number(), z.string(), z.boolean(), z.array(z.string())]);

// Simulation -> host
export const simToHostSchema = z.discriminatedUnion("type", [
  z.object({
    sll: z.literal(1),
    type: z.literal("ready"),
    payload: z.object({
      simId: z.string().max(100),
      version: z.string().max(20),
      capabilityLevel: z.number().int().min(0).max(3),
    }),
  }),
  z.object({
    sll: z.literal(1),
    type: z.literal("observables"),
    payload: z.object({ values: z.record(z.string().max(64), value) }),
  }),
  z.object({
    sll: z.literal(1),
    type: z.literal("event"),
    payload: z.object({ name: z.string().max(64), data: z.record(z.string().max(64), value).optional() }),
  }),
  z.object({
    sll: z.literal(1),
    type: z.literal("resize"),
    payload: z.object({ height: z.number().min(200).max(4000) }),
  }),
]);

export type SimToHostMessage = z.infer<typeof simToHostSchema>;
export type ObservableValues = Record<string, z.infer<typeof value>>;

// Host -> simulation
export type HostToSimMessage =
  | {
      sll: 1;
      type: "init";
      payload: {
        sessionId: string;
        locale: "he" | "en";
        params: Record<string, number>;
        lockedParams: string[];
      };
    }
  | { sll: 1; type: "setParams"; payload: { params: Record<string, number> } };

/** Parse an untrusted message from a simulation. Returns null when it is not a valid protocol message. */
export function parseSimMessage(data: unknown): SimToHostMessage | null {
  const result = simToHostSchema.safeParse(data);
  return result.success ? result.data : null;
}

/** Random, non-identifying session id for one simulation run. */
export function newSessionId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Simple token bucket so a misbehaving simulation cannot flood the host. */
export function createRateLimiter(maxPerSecond: number) {
  let tokens = maxPerSecond;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(maxPerSecond, tokens + ((now - last) / 1000) * maxPerSecond);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

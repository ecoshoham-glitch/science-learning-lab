# Simulation message protocol – version 1

Status: implemented in the prototype (`src/lib/simulation/protocol.ts`, `sdk/sll-bridge.js`).

Simulations run in a sandboxed iframe and talk to the platform only with `window.postMessage`.
Every message is an envelope:

```json
{ "sll": 1, "type": "<message type>", "payload": { } }
```

## Capability levels

A simulation declares its level in its manifest. Activities may use only what is declared.

| Level | Meaning | Typical source |
| --- | --- | --- |
| 0 | Link only (opens in a new tab) | Sites that forbid embedding |
| 1 | Embedded display, no messages | Approved iframe sites |
| 2 | `ready`, `event` (completion), score | Packages that add the bridge |
| 3 | Level 2 + parameters (`init`, `setParams`) and observables | First-party and AI-generated simulations |

## Simulation → host

| type | payload | notes |
| --- | --- | --- |
| `ready` | `{ simId, version, capabilityLevel }` | Repeated every 250 ms (max 40 times) until `init` arrives, because a simulation can load before the host listens |
| `observables` | `{ values: { [id]: number \| string \| boolean \| string[] } }` | Send whenever values change. Ids must be declared in the manifest |
| `event` | `{ name, data? }` | Names declared in the manifest |
| `resize` | `{ height }` (200–4000) | The bridge sends it on content size changes and once after `init` |

## Host → simulation

| type | payload |
| --- | --- |
| `init` | `{ sessionId, locale: "he" \| "en", params: { [id]: number }, lockedParams: string[] }` |
| `setParams` | `{ params: { [id]: number } }` |

## Rules

- The host accepts messages only from the simulation's own frame window and expected origin, validates
  every message against the schema, and rate-limits to 30 messages per second. Invalid messages are dropped.
- The host never sends user identity. `sessionId` is random per run.
- The simulation must treat `params` as untrusted and clamp them to its valid ranges.
- The bridge keeps the simulation inert (and `aria-busy`) until `init` arrives, or until it stops
  retrying `ready`, so early user input is never undone by initialization.
- The host sends `init` once per run; a simulation must be ready to receive it at any time after `ready`.
- Backward compatibility: new message types or fields are optional additions. Existing types and fields are
  never removed or changed in meaning. A breaking change requires protocol version 2, with version 1 still
  supported.

## Bridge helper

`sdk/sll-bridge.js` implements the simulation side (classic script, no modules, works in an opaque-origin
frame). Each package ships its own copy so packages stay self-contained. Using it is optional.

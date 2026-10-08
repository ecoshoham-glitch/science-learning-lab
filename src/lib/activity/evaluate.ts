import type { ObservableValues } from "@/lib/simulation/protocol";
import type { Condition } from "./schema";

/** Evaluate one activity condition against the latest observables. Unknown or wrong-typed values never pass. */
export function evaluateCondition(condition: Condition, values: ObservableValues): boolean {
  const v = values[condition.observable];
  switch (condition.op) {
    case "gte":
      return typeof v === "number" && Number.isFinite(v) && v >= condition.value;
    case "between":
      return typeof v === "number" && Number.isFinite(v) && v >= condition.min && v <= condition.max;
    case "includesAll":
      return Array.isArray(v) && condition.values.every((x) => v.includes(x));
  }
}

export function evaluateAll(conditions: Condition[], values: ObservableValues): boolean[] {
  return conditions.map((c) => evaluateCondition(c, values));
}

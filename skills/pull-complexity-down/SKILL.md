---
name: pull-complexity-down
description: Checks whether complexity is pushed to callers or absorbed by implementations. Use when the user asks to check caller burden, when callers must do significant setup, handle errors the module could resolve, or configure things they don't understand. Audits configuration parameters and decorator patterns.
argument-hint: "[file or module path]"
metadata:
  allowed-tools: Read, Grep
---

# Pull Complexity Downwards Review Lens

When invoked with $ARGUMENTS, focus the analysis on the specified file or module. Read the target code first, then apply the checks below.

Evaluate whether complexity is absorbed into implementations or pushed up to callers.

## When to Apply

- Designing or reviewing a module's interface
- When callers must do significant setup or configuration
- When callers handle errors or edge cases the module could handle internally
- When configuration parameters are being added to an API
- When evaluating decorator or wrapper patterns

## Core Principles

### The Core Asymmetry

**One implementer, many callers. Complexity in the implementation is paid once. Complexity in the interface is paid by every caller.**

When developers encounter a hard problem, the path of least resistance is to push it upward: throw an exception, add a configuration parameter, define an abstract policy. These moves feel like good engineering. But all you have done is distribute the decision to a larger number of people who typically have less context.

### Configuration Parameter Test - The Three AND Conditions

**Configuration parameters are not a feature. They are a symptom of an incomplete module.** Every parameter exported is a decision the developer chose not to make.

1. Different callers genuinely need different values, AND
2. The correct value cannot be determined automatically, AND
3. The impact is significant enough to justify the interface cost

If any condition fails:

- All callers use the same value → make it a constant
- The module can compute a good value → compute it dynamically
- The impact is negligible → pick a sensible default

Even for legitimate parameters, provide reasonable defaults so users only need to provide values under exceptional conditions.

**Dynamic computation beats static configuration.** A network protocol that measures response times and computes retry intervals automatically is superior to one that exports a retry-interval parameter — better accuracy, adapts to conditions, and the parameter disappears from the interface entirely.

**The psychological trap:** When uncertain about a decision, making it configurable feels responsible. It is avoidance dressed as engineering. Configuration parameters and thrown exceptions are the same impulse: both push complexity to callers.

### Three AND Conditions — When NOT to Pull Down

The backspace example: implementing `backspace(cursor)` in the text class appears to pull UI complexity downward, but the text class has nothing to do with the backspace key — that is UI knowledge. Pulling it down is information leakage masquerading as design. **All Three Must Hold**

1. The complexity is closely related to the module's existing functionality
2. Pulling it down simplifies the rest of the application
3. Pulling it down simplifies the module's interface

Failing any single one means the complexity belongs somewhere else.

### Related Techniques

**Context objects** and **decorator alternatives** are tools for pulling complexity down. Both are detailed in **deep-modules** — context objects solve pass-through variables; decorator alternatives prevent shallow wrapper layers.

## Review Process

1. **Inventory interface elements** — List every parameter, exception, and constraint callers must handle
2. **Apply the core asymmetry** — For each: could the module handle this internally?
3. **Test configuration parameters** — Does each pass the three AND conditions?
4. **Check for dynamic alternatives** — Could any static configuration be computed from internal measurements?
5. **Evaluate decorators** — Shallow pass-through layer, or genuine abstraction?
6. **Recommend simplification** — Propose specific interface reductions

Red flag signals for complexity direction are cataloged in **red-flags** (Overexposure, Pass-Through Method).

## References

For deeper coverage, load these on demand:

- [Configuration parameter audit](references/configuration-parameter-audit.md) — Patterns for recognizing and eliminating unnecessary config parameters

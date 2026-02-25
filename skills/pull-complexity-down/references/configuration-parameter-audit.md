# Configuration Parameter Audit

Every configuration parameter is a decision the developer chose not to make. This reference provides patterns for recognizing parameters that shouldn't exist and strategies for eliminating them.

## Anti-Patterns

### The "Just In Case" Parameter

A parameter added because the developer wasn't sure what value to use, not because different callers need different values. The documentation says "use the default unless you know what you're doing" — an admission that the parameter serves the developer's uncertainty, not the caller's needs.

> **Test:** Do all known callers pass the same value (or use the default)? If yes, make it a constant.

### The Premature Knob

A parameter exposed for "flexibility" before any caller has requested it. Often appears in internal modules where both the implementer and all callers are on the same team. The parameter anticipates a need that may never arrive, while imposing interface cost immediately.

> **Test:** Has any caller ever used a non-default value in production? If the answer is unknown or no, the parameter is premature.

### The Computable Value

A parameter that the module could determine from information it already has. Timeout intervals that could be computed from observed latency. Buffer sizes that could scale with input size. Thread pool sizes that could adapt to core count.

> **Test:** Could the module compute a reasonable value from runtime measurements or internal state? If yes, compute it. Dynamic computation beats static configuration — it's more accurate, adapts to conditions, and removes the parameter from the interface entirely.

### The Cascading Parameter

A parameter passed through multiple layers because one deep module needs it. Every intermediate layer must accept it, forward it, and document it — paying interface cost for a decision it doesn't participate in.

> **Test:** Does the intermediate layer use this parameter, or just pass it through? If pass-through, this is a pass-through variable problem. Consider a context object or restructuring so the needing module can obtain the value directly.

### The Conflicting Pair

Two parameters that interact in ways callers can't predict. Setting one constrains what values are valid for the other, but the constraint isn't enforced — it's documented (if at all) in a comment. Callers must understand the interaction to configure correctly.

> **Test:** Can a caller set these parameters independently without creating an invalid state? If not, the parameters encode a single decision that should be expressed as one choice, not two.

### The False Choice

A parameter with a "safe" default and a "dangerous" alternative that's only useful in narrow circumstances. The module pushes a decision to callers that the module itself could make, because the implementer didn't want to commit.

> **Test:** Would the non-default value cause problems for most callers? If yes, the module should handle the rare case internally rather than exposing it as a parameter.

## Migration Strategies

### Replace with Dynamic Computation

The strongest move. Instead of asking "what retry interval do you want?", measure response times and compute the interval. The module becomes smarter and the interface becomes simpler.

### Replace with a Policy Object

When callers genuinely need different behaviors (not just different values), accept a policy interface rather than multiple parameters. One interface replaces N parameters and makes the decision space explicit.

### Collapse to Presets

When a cluster of parameters always appear in a few standard combinations, offer named presets instead. Callers choose "low-latency" or "high-throughput" rather than setting six individual knobs. Keep raw parameters accessible for the rare caller who needs them, but off the common path.

### Absorb with Sensible Defaults

The minimum move. Set a default that works for 95% of callers. The parameter still exists but disappears from the common interface. This is partial improvement — better than nothing, but not as good as elimination.

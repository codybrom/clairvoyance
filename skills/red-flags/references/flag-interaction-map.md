# Flag Interaction Map

Red flags rarely fire alone. When several trigger at once, they often share a single architectural root cause. These syndrome clusters map common co-occurrences to the design problem underneath.

An individual flag points at a local problem. A cluster points at an architectural one. After completing the standard flag check, look at the triggered flags. If they form a cluster from this map, the cluster's root cause is your primary target. Fixing individual flags without addressing the root cause will just move the problem.

## Syndrome Clusters

### The Read/Process/Write Split

_Temporal Decomposition_ + _Information Leakage_ + _Repetition_

Modules are organized around steps in a process instead of the knowledge they own. A Reader, Processor and Writer each encode the data format, duplicating the same knowledge in three places. Look for modules named after process steps that share format constants, parsing logic or serialization code. Reorganize so one module owns the format and others interact through an interface that hides it.

### The Shallow Wrapper Stack

_Shallow Module_ + _Pass-Through Method_ + _Conjoined Methods_

One deep module was sliced into thin layers that each add minimal value, and none can be understood alone. Look for classes where most methods delegate to a single dependency, multiple classes that must be read together, or long constructor injection chains. Merge the layers. If the total behavior is genuinely complex, re-split along knowledge boundaries instead of execution layers.

### The Leaky Abstraction

_Information Leakage_ + _Overexposure_ + _Special-General Mixture_

A module that tries to be general-purpose but leaks its implementation through the interface. Callers must understand internals to use it correctly. Look for getter/setter pairs exposing internal state, APIs requiring callers to pass values they don't understand, or config docs that say "use the default unless you know what you're doing."

Pull complexity down. Absorb the leaked knowledge into the module. Replace exposed state with computed behavior. Replace configuration with sensible defaults.

### The Naming-Design Spiral

_Vague Name_ + _Hard to Pick Name_ + _Hard to Describe_ + _Non-obvious Code_

The entity is doing too much or conflating two concepts. Naming difficulty is design feedback, not a vocabulary problem. Look for names that use "And" or "Or" (implicitly or explicitly), long interface comments with many qualifications, or repeated naming attempts that all feel wrong. The entity needs redesign, not renaming. Apply **module-boundaries** to find where to split, or **design-it-twice** to find a better abstraction.

### The Tactical Debt Loop

_Tactical Momentum_ + _Repetition_ + _No Alternatives Considered_

Each change copies an existing pattern without questioning whether it still fits. The change works, but it makes the next one harder. Look for PRs with no design discussion, TODO comments marking known shortcuts, or features bolted on rather than integrated. The fix is process-level: apply **strategic-mindset** to assess the investment balance, then **design-it-twice** on the next change to break the cycle.

### The Error Avalanche

_Catch-and-Ignore_ + _Overexposure_ + _Shallow Module_

The interface throws more exceptions than callers can meaningfully handle, so they catch and ignore. Look for catch blocks that log and re-throw or silently return defaults, method signatures with three or more exception types, or error handling code that is longer than the happy path. Apply the **error-design** decision tree: define errors out of existence first, mask what can be handled internally, aggregate what remains. The goal is zero exceptions on the common path.

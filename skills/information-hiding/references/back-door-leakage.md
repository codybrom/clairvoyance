# Back-Door Leakage Detection Patterns

Back-door leakage is invisible by definition — nothing in any interface signals the dependency. These patterns help you see it anyway.

## Structural Signatures

### Parallel Structure

Two modules that mirror each other's internal organization without sharing an interface. If module A has a switch on message types and module B has a matching switch on the same types, they share knowledge of the type set. Adding a type requires editing both.

> **Look for:** Parallel enums, matching case/switch arms, mirrored if-else chains across module boundaries.

### Implicit Protocol

Modules that communicate through a shared medium (file, database, queue, shared memory) where the format is encoded in each module's implementation but never formalized in a shared type or schema.

> **Look for:** String parsing in one module that must match string formatting in another. Magic column indices. JSON field names hardcoded in multiple places. Byte offsets assumed rather than declared.

### Ordering Assumptions

Module A assumes module B has already run, or has set some state, but nothing in A's interface declares this dependency. The system works because the call sequence happens to be correct — until someone reorders it.

> **Look for:** Methods that silently depend on initialization order. Code that reads state another module wrote without any contract guaranteeing it's been written. Tests that pass only when run in a specific order.

### Shared Constants That Aren't

Two modules use the same magic number, string, or threshold — but each defines its own copy. They must match, but nothing enforces this. Changing one without the other produces silent bugs.

> **Look for:** Duplicate literal values across modules. Timeout values, buffer sizes, retry counts, format strings that appear in multiple files without a shared definition.

### Format Coupling

The most common form. One module writes data (to disk, network, database) and another reads it. Both must agree on the format, but the format isn't owned by a single module with an abstract interface.

> **Look for:** Serialization in one module, deserialization in another, with no shared schema or type definition. Migration logic that must be updated in multiple places when the format changes.

## Detection Heuristics

### The Change Propagation Test

Pick any internal implementation detail in a module. Ask: if I changed this, what else would break? If the answer includes another module — and the connection isn't visible in any interface — that's back-door leakage.

### The Grep Test

If you need to grep the codebase to find all the places affected by a change, the knowledge has leaked. Well-hidden knowledge lives in one place; the compiler or type system enforces the boundary. Grep-driven changes are back-door leakage made temporarily visible.

### The New Developer Test

Could a developer unfamiliar with the codebase modify module A without knowing module B must also change? If the answer is yes (they could make the change and it would silently break B), that's the unknown-unknowns signature of back-door leakage.

### The Git Co-Change Test

Two files that repeatedly appear in the same commit — but have no direct API dependency — are likely coupled through shared knowledge. Git history makes invisible dependencies visible after the fact.

## The Wrong Fix

Adding comments like "keep in sync with module B" documents the leakage without eliminating it. The dependency is still invisible to the compiler and will eventually drift.

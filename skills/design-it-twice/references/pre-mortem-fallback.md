# Pre-Mortem Fallback (No Agent Available)

If your setup does not support running subagents, your first design might already be in the context window and cannot be unseen. Attempting to "just ignore it" is useless. Proximity bias contaminates the alternative the same way a finished draft contaminates a rewrite.

The best course of action is to conduct a **design pre-mortem** (Gary Klein, _Sources of Power_, 1998) to force a structural departure.

## Kill the First Design

Assume it shipped and failed. Identify the specific structural reason. Not a surface bug, but the assumption or decomposition choice that made failure inevitable.

## Name the Load-Bearing Assumption

Every design has one. It could be a coupling direction, a data ownership choice or an abstraction boundary placement. The failure mode from the previous step points at it.

## Design from the Negation

Build a complete alternative that does not share the vulnerable assumption. This is not patching the first design. It is a different structure that routes around the failure mode entirely. Specify interfaces, types and data flow at the same level of detail as the first.

## Why This Works

A pre-mortem shifts from "defend what I built" to "explain why it died." That cognitive reframe breaks the gravitational pull of the existing design and exposes assumptions that feel like constraints but are actually choices.

## Limitations

This produces a structurally independent alternative, but the context window still contains both designs during comparison. True isolation (agent dispatch) eliminates contamination entirely. This technique only redirects it. When the design decision is high-stakes, prefer isolation mode.

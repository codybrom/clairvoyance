# Write the Comments First: 6-Step Workflow

## The Process

When building a class or module, write comments as part of design, not after implementation:

1. **Write the class interface comment**: describe the overall abstraction before writing any code.

2. **Write interface comments and signatures for the most important public methods.** Leave bodies empty. Iterate until the structure feels right.

3. **Write declarations and comments for the most important instance variables.**

4. **Fill in method bodies**, adding implementation comments as needed. The interface comments are already done.

5. **As new methods and variables emerge during implementation**, write each interface comment before the body and each variable comment at declaration time.

6. **Revise comments as implementation reveals issues.** If a comment no longer matches the design, fix the comment or fix the design.

By the time implementation is complete, so is your documentation.

## Why It Works

### Better comments

You write the comment while the design decision is live in your context window, not after implementation, when you're reconstructing intent from code you already wrote. Comments written after the fact describe what the code does. Comments written first describe what it should do and why.

### Better designs

Comments are a **complexity canary**. If you notice any of these while writing, stop and redesign:

> "If the interface comment must describe all the major features of the implementation, then the method is shallow." — John Ousterhout, _A Philosophy of Software Design_

- Comment is long and complicated → interface is too complex
- Variable needs a long comment to fully describe → wrong variable decomposition

### Less rework, fewer tokens

Comments are a small fraction of total output. Even if half of all lines are comments, they account for well under 10% of the tokens spent on a task. Skipping them saves almost nothing. Meanwhile, writing code first means the abstraction evolves during implementation, causing revisions that cost far more than the comments would have. Comments-first settles the abstraction before implementation begins. Writing comments first is almost certainly cheaper than deferring them.

## Why After-the-fact Comments Fail

- After-the-fact comments often never get written. There is always something that seems higher priority.
- When they do get written, the design intent has scrolled out of the context window. A finished implementation contaminates your perspective. You read the code back and restate it, producing comments that justify what the code already says.
- The further implementation gets from the original design decision, the more the comment describes _what happened_ instead of _what was intended_.

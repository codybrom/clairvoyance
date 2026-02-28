#!/bin/bash

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""' 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

STATE_DIR="$HOME/.claude/clairvoyance"
mkdir -p "$STATE_DIR"

# Checks if skill is already triggered or suggested, then checks pattern.
# Returns 0 and outputs suggestion only if skill is new and pattern matches.
try_suggest() {
  local skill="$1"
  local pattern="$2"
  local message="$3"
  local state_file="$STATE_DIR/${SESSION_ID}.suggested"

  # Skip without checking pattern if skill already triggered this session
  [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] && grep -qF "/clairvoyance:$skill" "$TRANSCRIPT" && return 1

  # Skip without checking pattern if skill already suggested this session
  [ -n "$SESSION_ID" ] && [ -f "$state_file" ] && grep -qF "$skill" "$state_file" && return 1

  # Now check the pattern
  echo "$PROMPT_LOWER" | grep -qE "$pattern" || return 1

  # Record and output suggestion
  [ -n "$SESSION_ID" ] && echo "$skill" >> "$state_file"
  jq -n --arg ctx "$message" \
    '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":$ctx}}'
  return 0
}

# "this is doing too much", "break this up", "separate the concerns", "decouple"
try_suggest "module-boundaries" \
  'refactor|break.*(up|this|apart|into (two|separate|multiple|smaller))|split.*(up|apart|into)|doing too much|(too many|multiple) responsibilit|separate (the )?concern|decouple|pull.*(out|apart)|move.*(to its own|into a separate)|this (class|module|file) is too big' \
  "Relevant skill: /clairvoyance:module-boundaries — evaluates where to draw module lines and whether to merge or split." \
  && exit 0

# "what's the best way to build", "not sure whether to", "considering a few options", "should I use X or Y"
try_suggest "design-it-twice" \
  'best way to (build|implement|design|structure|create)|how should (i|we) (design|structure|approach|build|implement)|not sure (how to|whether to|which (way|approach|design))|considering (a few|different|multiple|two) (option|approach|way|design|alternative)|should i use .* or|help me (think through|decide on) (the |a |this )?(design|approach|structure)' \
  "Relevant skill: /clairvoyance:design-it-twice — generates and compares two fundamentally different approaches before committing." \
  && exit 0

# "what should happen when this fails", "should I throw or return", "how do I handle the case where"
try_suggest "error-design" \
  'error handling|try.?catch|what (to do|happens|should happen) (when|if).*(fail|error|throw|wrong)|how (should i|do i|to) handle.*(error|exception|failure|case where)|should i (throw|return null|propagate|catch)|when.*(fails?|throws?|goes wrong)' \
  "Relevant skill: /clairvoyance:error-design — reviews error handling strategy using the define-errors-out-of-existence principle." \
  && exit 0

# "what should I call this", "I can't find a good name", "hard to name", "better name for"
try_suggest "naming-obviousness" \
  'what (should i|to) call|is .* a good name|hard to name|can.t (think of|find) a (good )?name|naming (this|is hard)|what.*(better|good|right) name|(good|better|right) name for' \
  "Relevant skill: /clairvoyance:naming-obviousness — reviews naming quality and code obviousness." \
  && exit 0

# "getting out of hand", "hard to reason about", "too many moving parts", "can't follow"
try_suggest "complexity-recognition" \
  'getting out of hand|too many moving parts|(hard|difficult) to (follow|read|understand|reason about)|can.t (follow|understand|reason about)|getting (unwieldy|complicated)|too complex|(is|feels?|seems?|getting) complex|a (real )?mess|hard to (reason|make sense)' \
  "Relevant skill: /clairvoyance:complexity-recognition — diagnoses what makes code complex and identifies root causes." \
  && exit 0

# "should I add a comment", "this needs documentation", "write a docstring", "undocumented"
try_suggest "comments-docs" \
  '(should i|need to) (add|write|put) (a )?(comment|doc)|this needs? (more )?(comments?|docs?|documentation)|\bdocstring\b|how (should i|to|do i) document|write (a |some )?(comment|doc|docstring)|undocumented' \
  "Relevant skill: /clairvoyance:comments-docs — reviews comment quality and documentation practices." \
  && exit 0

# "I know this is a hack", "just get it working", "quick and dirty", "cutting corners"
try_suggest "strategic-mindset" \
  'technical debt|quick fix|\bhack\b|workaround|shortcut|just (get it|make it) work(ing)?|cut(ting)? corners|not ideal but|quick and dirty|band.?aid' \
  "Relevant skill: /clairvoyance:strategic-mindset — assesses whether code reflects strategic or tactical thinking." \
  && exit 0

# "this wrapper doesn't do anything", "just delegates", "not sure this abstraction is worth it"
try_suggest "abstraction-quality" \
  'wrapper.*(doesn.t|does not|just|only).*(do|add)|just (delegates?|passes? through|wraps?)|not sure.*(abstraction|wrapper).*(worth|useful)|abstraction.*(pulling its weight|adds anything)|pass.?through|boilerplate' \
  "Relevant skill: /clairvoyance:abstraction-quality — evaluates whether abstractions genuinely add depth or just add boilerplate." \
  && exit 0

# "the caller needs to know too much", "leaking internals", "too tightly coupled"
try_suggest "information-hiding" \
  'caller.*(know|understand|deal with|worry about) too much|leaking (internals?|implementation|details?)|expos(e|ing) (internals?|implementation|private)|too (tightly )?coupled|implementation detail.*leak' \
  "Relevant skill: /clairvoyance:information-hiding — checks for information leakage across module boundaries." \
  && exit 0

# "too many parameters", "the signature is getting long", "this function takes too many args"
try_suggest "deep-modules" \
  'too many (parameters?|params?|arguments?|args?|methods?)|parameter.*(list|getting) (long|too long)|signature.*(getting|too) (long|big|complex)|(function|method|class) takes (too many|a lot of)' \
  "Relevant skill: /clairvoyance:deep-modules — measures module depth and whether the interface is simple relative to the implementation." \
  && exit 0

exit 0

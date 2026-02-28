#!/bin/bash

jq -n --arg ctx \
  "If the plan will involve a significant design decision, consider using /clairvoyance:design-it-twice before committing to an approach." \
  '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":$ctx}}'

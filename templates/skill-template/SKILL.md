---
name: example-skill
description: >
  Concise 1-2 sentence description explaining exactly when an AI agent should activate
  this skill and what primary capability it confers.
domain: ui-ux
tools_required:
  - run_command
  - read_file
triggers:
  - example trigger
  - build feature
license: MIT
---

# Example Skill Name

A high-density, agent-first instruction guide for [Domain / Task].

## 1. When to Use This Skill
- [Trigger Condition 1]
- [Trigger Condition 2]

## 2. Invariants & Rules
1. **Never guess**: Ground in real project files before generating code.
2. **Deterministic Outputs**: Use explicit types, error bounds, and standard naming conventions.
3. **No Fluff**: Focus on battle-tested implementation patterns.

## 3. Implementation Patterns

### Pattern A: Standard Architecture
```typescript
// Example code snippet demonstrating the canonical implementation
export interface TaskContract {
  id: string;
  status: "idle" | "running" | "completed";
}
```

## 4. Anti-Patterns & Pitfalls
- ❌ **Anti-pattern**: Avoid bloated inline styles or ambiguous types.
- ✅ **Best Practice**: Use design tokens and single-responsibility handlers.

## 5. Verification Protocol
Before marking the task complete:
1. Run local test suite: `npm test` or `pytest`.
2. Inspect rendered output or terminal logs.
3. Verify evidence matches the expected criteria.

# Inference Policy and Active Models

Updated: 2026-11-25 (Stage 1b)

SkillKit has migrated off OpenAI Codex (`gpt-6.2-astra`, `gpt-5.4` via Experiential Labs / ChatGPT OAuth) due to quota/access blocks, and retires local `Qwen2.5-1.5B-Instruct` from all scored evaluations.

## Active Verified Models

- **Gemini 4 Hydrogen** — Heavy reasoning, complex routing verification, architecture/code work, and deep paired task execution/judging.
- **Gemini 3.8 Flash** — Bulk/rapid processing (stratified metadata tag audits, high-volume classification).

## Mandatory Evaluation Rules

1. **No unverified inference:** LLM-dependent steps must run only on a verified-working model recorded above (`Gemini 4 Hydrogen` or `Gemini 3.8 Flash`). Never use local `Qwen 1.5B` for anything scored, and do not probe blocked external endpoints.
2. **Arm parity:** Every two-arm comparison (with-kit vs without-kit, snippet vs pointer/manual, blind judging) must use the exact same model and effort level across both arms. Any run lacking verified parity or live inference must be marked **`not verified`**.
3. **No prompt leakage:** Held-out briefs (`bench/gat/heldout.json`, `bench/fixtures/held-out.tsv`, `bench/user-briefs/`) must never be inspected by the coding agent or sent to third-party discovery APIs.

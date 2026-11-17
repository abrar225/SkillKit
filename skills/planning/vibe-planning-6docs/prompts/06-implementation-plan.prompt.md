Act as a senior technical lead. Read all five approved documents below and create an ordered Implementation Plan for an AI coding agent.

Do not write implementation code yet. First inspect the existing project if one is available. Reuse the current stack and conventions unless the TRD explicitly requires a change.

Break the build into small, verifiable phases. For every phase include:
- Goal and user-visible outcome
- PRD requirements covered
- Components, routes, services and data involved
- Expected files or areas of the project to change
- Dependencies
- Loading, empty, error and success states
- Tests and manual verification
- Completion criteria
- Risks and rollback considerations

Order the phases so foundations and dependencies are completed before the features that rely on them. Include a traceability table mapping every PRD feature to a phase and test. Identify contradictions or missing information before presenting the final plan.

Return clean Markdown that I can save as 06-implementation-plan.md. End with a recommended first phase and wait for approval before coding.

APPROVED PRD:
[PASTE 01-prd.md]

APPROVED TRD:
[PASTE 02-trd.md]

APPROVED APP FLOW:
[PASTE 03-app-flow.md]

APPROVED UI/UX BRIEF:
[PASTE 04-ui-ux-brief.md]

APPROVED BACKEND SCHEMA:
[PASTE 05-backend-schema.md]

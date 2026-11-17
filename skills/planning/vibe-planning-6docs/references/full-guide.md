# The 6 Documents You Need Before Vibe Coding Any App


**Turn an app idea into clear instructions before asking an AI coding agent to build it.**


One prompt can describe an idea. It usually cannot make every product, technical, design and data decision consistently.


This guide helps you create six connected documents:

1. Product Requirements Document (PRD)
2. Technical Requirements Document (TRD)
3. App Flow
4. UI/UX Design Brief
5. Backend Schema
6. Implementation Plan

You can create them with Claude, ChatGPT or another capable AI assistant. Generate them **one at a time in this order**. Review and approve each document before moving to the next one.


> These are practical planning documents for AI-assisted development, not universal industry standards. Adjust their depth to the size and risk of your project.


---


## Why the Order Matters


```
App idea
↓
PRD — what are we building?
↓
TRD — how will it be built?
↓
App Flow — how does the user move through it?
↓
UI/UX Brief — how should it look and behave?
↓
Backend Schema — how is the data organised?
↓
Implementation Plan — in what order should it be built?
```


If a later document conflicts with an approved earlier document, fix the conflict before starting development.


---


## Before You Start: Write a Small App Brief


Complete this first. Do not make the AI guess missing product decisions.


```
# App Brief

App name:

One-line idea:

Problem it solves:

Who it is for:

The main action a user should complete:

Must-have features:
-
-
-

Nice-to-have features:
-
-

Platform:
-Web / iOS / Android / multiple

Business model, if relevant:

Important constraints:
-Deadline:
-Budget:
-Required tools or services:
-Privacy or security requirements:

References or existing products:
```


Save it as `00-app-brief.md`.


---


# 1. Product Requirements Document (PRD)


## What It Controls


The PRD explains the product itself: the problem, users, core experience, features, scope and success criteria. It prevents the coding agent from inventing features or solving a different problem.


## Copy-Ready PRD Template


```
# Product Requirements Document

## 1. Product Overview
-Product name:
-One-sentence description:
-Problem being solved:
-Why this product should exist:

## 2. Target Users
-Primary user:
-Their current problem:
-Their desired outcome:
-Secondary users, if any:

## 3. Core User Outcome
Describe the single most important result a user should achieve.

## 4. Core Features
For every feature include:
-Feature name
-User need
-What the feature does
-Inputs
-Expected output
-Acceptance criteria
-Error or empty states

## 5. Scope
### Included in version one
-

### Explicitly excluded from version one
-

### Possible later additions
-

## 6. User Stories
-As a [user], I want to [action], so that [outcome].

## 7. Functional Requirements
-

## 8. Non-Functional Requirements
-Performance
-Accessibility
-Privacy
-Security
-Browser or device support

## 9. Success Criteria
-

## 10. Assumptions and Open Questions
-
```


## Prompt to Generate the PRD


```
Act as a senior product manager. Use my App Brief below to create a practical Product Requirements Document for the first usable version of this app.

Do not write code and do not choose the technical stack yet.

The PRD must include:
- Product overview and the problem being solved
- Primary and secondary users
- Core user outcome
- Complete version-one feature list
- User stories
- Functional requirements
- Important non-functional requirements
- Acceptance criteria for every core feature
- Included scope, excluded scope and possible later additions
- Success criteria
- Assumptions, risks and unresolved questions

Do not silently invent important requirements. If essential information is missing, ask me focused questions before creating the final document. Keep version one realistic and separate must-have features from nice-to-have ideas.

Return clean Markdown that I can save as 01-prd.md.

APP BRIEF:
[PASTE 00-app-brief.md]
```


Review the PRD and approve the version-one scope before continuing.


---


# 2. Technical Requirements Document (TRD)


## What It Controls


The TRD records the technical choices: architecture, stack, tools, APIs, authentication, infrastructure and quality requirements. It stops the coding agent from changing technologies halfway through the build.


## Copy-Ready TRD Template


```
# Technical Requirements Document

## 1. Technical Overview
-Architecture summary:
-Platforms:
-Main technical constraints:

## 2. Technology Stack
-Frontend:
-Backend:
-Database:
-Authentication:
-File storage:
-Hosting:
-Analytics:
-Testing:

For every choice include the reason and rejected alternatives.

## 3. System Architecture
-Client responsibilities:
-Server responsibilities:
-Database responsibilities:
-External service responsibilities:

## 4. APIs and Integrations
For each integration:
-Purpose
-Data sent and received
-Authentication method
-Rate or usage limits
-Failure handling

## 5. Security and Privacy
-Authentication and authorisation
-Input validation
-Secrets management
-Sensitive data handling
-Abuse prevention

## 6. Performance Requirements
-Expected usage
-Loading targets
-Caching approach
-Media optimisation

## 7. Testing and Quality
-Unit tests
-Integration tests
-End-to-end tests
-Accessibility checks

## 8. Development and Deployment
-Environments
-Environment variables
-CI checks
-Deployment approach

## 9. Technical Risks and Open Questions
-
```


## Prompt to Generate the TRD


```
Act as a senior software architect. Create a Technical Requirements Document for the approved PRD below.

Do not change the product scope. Recommend the simplest production-appropriate architecture that can support the approved requirements. Avoid adding infrastructure only to make the stack look advanced.

The TRD must include:
- Frontend, backend, database and authentication choices
- Important libraries and development tools
- System architecture and responsibility boundaries
- Every required external API or service
- Security, privacy and secrets handling
- Performance and accessibility requirements
- Testing strategy
- Local, staging and production environments
- Deployment approach
- Reasons for major choices, rejected alternatives, risks and open questions

Flag every requirement that cannot be satisfied by the proposed stack. Ask focused questions when a decision depends on missing information.

Return clean Markdown that I can save as 02-trd.md.

APP BRIEF:
[PASTE 00-app-brief.md]

APPROVED PRD:
[PASTE 01-prd.md]
```


---


# 3. App Flow


## What It Controls


The App Flow lists every screen, route and important interaction. It explains where a user starts, what happens after each action and how they recover from errors or empty states.


## Copy-Ready App Flow Template


```
# App Flow

## 1. Entry Points
-First visit:
-Returning user:
-Shared or deep link:

## 2. Authentication Flow
-Sign up
-Sign in
-Verification
-Password recovery
-Sign out

## 3. Screen Inventory
For every screen include:
-Screen name
-Route
-Purpose
-Entry conditions
-Main content
-Primary action
-Secondary actions
-Loading state
-Empty state
-Error state
-Success state
-Next destination

## 4. Primary User Journey
Write the complete happy path from entry to the core outcome.

## 5. Secondary Journeys
-

## 6. Decision Points
For every important choice:
-User action
-Condition
-Result
-Destination

## 7. Edge Cases and Recovery
-Invalid input
-Failed request
-Lost connection
-Missing permissions
-Expired session
-Cancelled action

## 8. Navigation Rules
-Global navigation
-Back behaviour
-Protected routes
-Deep links
```


## Prompt to Generate the App Flow


```
Act as a senior product designer. Create the complete App Flow for the approved product and technical requirements below.

Map every required page or screen, route, navigation path, decision point and important button outcome. Include the primary journey, secondary journeys, authentication, loading, empty, error and success states.

For every screen specify:
- Purpose
- How the user reaches it
- What information appears
- Primary and secondary actions
- What happens after each action
- The next destination
- Required states and edge cases

Do not add screens that are not supported by the PRD. Flag missing or contradictory flows instead of guessing.

Return:
1. A plain-English journey summary
2. A screen inventory table
3. A Mermaid flowchart
4. Detailed screen-by-screen behaviour

Return clean Markdown that I can save as 03-app-flow.md.

APPROVED PRD:
[PASTE 01-prd.md]

APPROVED TRD:
[PASTE 02-trd.md]
```


---


# 4. UI/UX Design Brief


## What It Controls


The UI/UX Brief defines how the product should look, feel and respond. It gives the coding agent a visual system instead of allowing it to generate random gradients, cards and spacing.


## Copy-Ready UI/UX Brief Template


```
# UI/UX Design Brief

## 1. Experience Goal
-Desired feeling:
-Three visual adjectives:
-What the design must avoid:

## 2. Users and Context
-Primary user:
-Device and environment:
-Accessibility needs:

## 3. Visual Direction
-Colour palette and roles:
-Typography:
-Icon direction:
-Image or illustration direction:
-Surface and border treatment:

## 4. Layout System
-Content width:
-Grid:
-Spacing scale:
-Section rhythm:
-Responsive breakpoints:

## 5. Component Language
-Buttons
-Inputs
-Navigation
-Cards
-Modals or sheets
-Tables or lists
-Feedback and status components

For every component include states: default, hover, focus, active, disabled, loading and error where relevant.

## 6. Screen Direction
For every core screen:
-Visual hierarchy
-Main composition
-Primary action placement
-Important responsive changes

## 7. Interaction and Motion
-Purposeful transitions
-Feedback moments
-Reduced-motion behaviour

## 8. Accessibility
-Contrast
-Keyboard use
-Focus states
-Tap targets
-Text sizing

## 9. Consistency Rules
### Always use
-

### Never use
-
```


## Prompt to Generate the UI/UX Brief


```
Act as a senior product designer and design-systems specialist. Create a UI/UX Design Brief for the approved PRD and App Flow below.

Translate the product, audience and journeys into one coherent visual system. Define:
- Experience goal and visual direction
- Semantic colour palette with exact colour values and usage roles
- Typography families, sizes, weights and line heights
- Spacing, grid, container and responsive rules
- Buttons, inputs, navigation, cards and feedback components
- Required interaction states
- Composition guidance for every core screen
- Mobile-specific behaviour
- Motion and reduced-motion rules
- Accessibility requirements
- Clear always-use and never-use rules

Keep the result distinctive to the product. Do not default to excessive gradients, glassmorphism, identical rounded cards or decorative motion. Do not copy a reference literally.

Flag any design decision that conflicts with the user journey or accessibility requirements.

Return clean Markdown that I can save as 04-ui-ux-brief.md.

APP BRIEF:
[PASTE 00-app-brief.md]

APPROVED PRD:
[PASTE 01-prd.md]

APPROVED APP FLOW:
[PASTE 03-app-flow.md]

OPTIONAL DESIGN REFERENCES AND WHAT I LIKE ABOUT EACH:
[PASTE LINKS OR NOTES]
```


---


# 5. Backend Schema


## What It Controls


The Backend Schema explains how the product stores and connects data. It covers users, authentication, tables, columns, relationships, access rules and important data operations.


## Copy-Ready Backend Schema Template


```
# Backend Schema

## 1. Data Overview
-Database type:
-Main data domains:
-Ownership model:

## 2. Authentication and Authorisation
-User identity:
-Sign-in methods:
-Roles:
-Permissions:
-Session handling:

## 3. Tables or Collections
For every table include:
-Table name
-Purpose
-Column name
-Data type
-Required or optional
-Default value
-Validation rules
-Unique constraints
-Indexes
-Foreign keys
-Created and updated timestamps

## 4. Relationships
-One-to-one
-One-to-many
-Many-to-many
-Delete behaviour

## 5. Access Rules
For every table:
-Who can create
-Who can read
-Who can update
-Who can delete

## 6. Core Data Operations
-

## 7. File Storage
-Buckets or folders
-Allowed types and sizes
-Access rules

## 8. Data Integrity and Security
-Validation
-Transactions
-Sensitive data
-Audit requirements

## 9. Migration and Seed Data
-

## 10. Risks and Open Questions
-
```


## Prompt to Generate the Backend Schema


```
Act as a senior backend and database architect. Design the Backend Schema required by the approved PRD, TRD and App Flow below.

Do not invent product features. Every table, field and relationship must support a named requirement or user flow.

Include:
- Authentication and session model
- User roles and permissions
- Every required table or collection
- Columns, data types, defaults and validation
- Primary keys, foreign keys, unique constraints and indexes
- One-to-one, one-to-many and many-to-many relationships
- Create, read, update and delete access rules
- Important data operations and transaction boundaries
- File-storage structure if required
- Delete and retention behaviour
- Seed data, migrations, privacy and security considerations
- Risks, assumptions and unresolved questions

Return:
1. A plain-English data overview
2. A table-by-table schema
3. A Mermaid entity-relationship diagram
4. Access-control rules
5. A traceability list connecting each table to its PRD feature

Return clean Markdown that I can save as 05-backend-schema.md.

APPROVED PRD:
[PASTE 01-prd.md]

APPROVED TRD:
[PASTE 02-trd.md]

APPROVED APP FLOW:
[PASTE 03-app-flow.md]
```


---


# 6. Implementation Plan


## What It Controls


The Implementation Plan converts the approved documents into a build sequence. It tells the coding agent what to build first, which files and systems are involved, how to verify each phase and when to stop for review.


## Copy-Ready Implementation Plan Template


```
# Implementation Plan

## 1. Current Project State
-Existing code:
-Reusable parts:
-Missing foundations:
-Risks:

## 2. Build Principles
-Preserve approved scope
-Work in small verifiable phases
-Test after every phase
-Do not begin later phases while required checks fail

## 3. Ordered Phases
For every phase include:
-Goal
-Requirements covered
-Components or systems involved
-Files expected to change
-Data or API work
-UI states
-Tests and verification
-Completion criteria
-Dependencies
-Risks

## 4. Suggested Sequence
-Project foundation
-Shared design system
-Authentication
-Core data model
-Primary user journey
-Secondary features
-Error and empty states
-Responsive and accessibility pass
-Testing and performance
-Deployment readiness

## 5. Requirement Traceability
Map every PRD feature to its implementation phase and verification method.

## 6. Final Verification
-Functional checks
-Responsive checks
-Accessibility checks
-Security checks
-Production build
```


## Prompt to Generate the Implementation Plan


```
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
```


---


# Final Consistency Check


Run this after all six documents are ready.


```
Audit these six planning documents as one connected specification before any code is written.

Check for:
- Features present in one document but missing from another
- Screens without a supporting PRD requirement
- Buttons or actions without a defined destination
- Data fields or tables with no product purpose
- PRD features with no data, UI or implementation coverage
- Technical choices that cannot support the approved flow
- UI states missing from the App Flow
- Authentication or permission conflicts
- Different names used for the same feature or entity
- Implementation phases in the wrong dependency order
- Unresolved assumptions presented as confirmed decisions

Return:
1. Blocking contradictions
2. Important gaps
3. Minor naming inconsistencies
4. Exact corrections required in each file
5. A final traceability matrix: PRD feature → screen → data entity → implementation phase

Do not rewrite the documents or start coding until I approve the corrections.

[ATTACH OR PASTE ALL SIX DOCUMENTS]
```


---


# Put the Documents Inside Your Project


Create a `docs` folder:


```
docs/
├── 00-app-brief.md
├── 01-prd.md
├── 02-trd.md
├── 03-app-flow.md
├── 04-ui-ux-brief.md
├── 05-backend-schema.md
└── 06-implementation-plan.md
```


Then give your coding agent this handoff prompt:


```
Read every file inside /docs before editing the project.

Treat the approved PRD as the source of truth for product scope, the TRD for technical decisions, the App Flow for navigation and states, the UI/UX Brief for visual behaviour, the Backend Schema for data, and the Implementation Plan for build order.

First inspect the existing codebase. Report any conflict between the code and the documents. Then show me the first implementation phase, the files it will affect and how it will be verified.

Do not implement later phases, add unapproved features or change the approved stack. Wait for my approval before starting phase one.
```


## The Important Part


The goal is not to produce six long files. The goal is to remove six different kinds of guessing before your coding agent starts building.

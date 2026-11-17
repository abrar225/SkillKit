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

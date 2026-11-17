# Documentation

| Page | Contents |
| :--- | :--- |
| [Getting started](GETTING-STARTED.md) | Browse, search, scan a project, install into an agent, verify the catalog |
| [Structure](STRUCTURE.md) | Repository layout, what counts as a skill or resource, the 14 domains |
| [Adding a skill](ADDING-A-SKILL.md) | Vendor an upstream skill or write an original one |
| [Adding a resource](ADDING-A-RESOURCE.md) | Entry schema, categories, quality bar |
| [Licensing](LICENSING.md) | Repository license, vendored licenses, inclusion rules, unverified entries |
| [Skill catalog](SKILLS.md) | Generated: every skill with path, license, and description |
| [Resource catalog](RESOURCES.md) | Generated: every resource with type, pricing, license, and link |

Third-party attribution lives at the repository root in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

Generated pages are rebuilt with:

```bash
python3 scripts/build-registry.py
node scripts/build-docs.js
```

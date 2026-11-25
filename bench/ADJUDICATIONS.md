# GAT routing adjudications

The frozen evaluation contains 66 in-scope briefs across eight domains and 15 outside controls. The author wrote new fictional briefs from catalog metadata and product workflows before viewing routing results. The dataset includes production-shaped specialist requests with no verified native handoff and cases where an adjacent tool reference is useful but leaves a gap. The raw brief is the only input sent to the engine. The first response, local registries, and the approved pinned federation snapshot are the only scoring inputs. The benchmark does not retrieve skill bodies or contact third parties.

The freeze manifest records the SHA-256 of the cases. The baseline ran against a clean Git archive of commit `4513849`. The test runner logs aggregate counts and percentages. Supplemental user files have separate result rows and do not affect the frozen-set gate.

## Decision rules

- **Usable kit** requires READY, evidence for every essential component, no question or open gap, and no identified hard constraint violation. Each component has independently authored descriptive terms and a set of interchangeable IDs. Some components also require a check with specified content. A returned ID without a selected stage and an eligible catalog reference earns no credit.
- **Confidently wrong** counts a READY response that fails any usable-kit condition. The denominator for both metrics is the 66 in-scope briefs.
- **Constraint adherence** uses the cases with explicit constraints in gold. The scorer checks prohibited references and actions, free reference eligibility, and tool or format evidence on READY. Abstention can honor a constraint while missing the deliverable.
- **Specialist fallback** requires a specific named gap. A useful PARTIAL must show evidence for the supported portion. NO_MATCH must select no stages or references and ask no question.
- **Outside accuracy** requires NO_MATCH with no selected stages, references, or follow-up question.
- **Response size** is the serialized compact JSON kit in UTF-8 bytes across all cases. Protocol framing and later reads are outside that measurement.

A candidate can be useful in practice and miss a class if its ID or descriptive capability was absent from the preregistered alternatives. The scorer does not claim that a selected reference proves a completed artifact. A formal exception needs independent source evidence and a separately reported sensitivity check. Keep the freeze and the original scores intact. No exceptions were applied to the baseline.

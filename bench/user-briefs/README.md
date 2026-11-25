# Score your own briefs

Drop a JSON file in this directory and run `npm run gat`. Each JSON file gets separate results under `gates.rightKit.userBriefs`. The fixed acceptance thresholds use only the frozen evaluation set. You can also run `node bench/gat/score.mjs --fixture /absolute/path/to/your-file.json` to evaluate a file on its own. Brief text and per-brief decisions stay out of the report. Review any submitted file for sensitive information before committing it.

Use this structure. The example here is documentation and is not scored.

```json
{
  "schema": 1,
  "cases": [
    {
      "id": "sample-static-sign",
      "domain": "graphic",
      "brief": "Lay out a print-ready PDF sign for the exit table from the supplied wording.",
      "expected": "ready",
      "evidence": [
        {
          "label": "static print composition",
          "ids": ["ui-ux/canvas-design", "ui-ux/anthropic-design"],
          "terms": ["static", "print", "pdf"]
        }
      ],
      "constraints": { "requiredFormats": ["pdf"] }
    }
  ]
}
```

Write the brief as someone would ask it in a chat. Choose `ready`, `partial`, `no_match`, or `outside` for `expected`. Add one evidence group per essential component. Each group must name acceptable catalog IDs and one or more case-insensitive regular-expression fragments that independently describe relevant catalog evidence. Any fragment can match. Add `checks` to require one of its fragments in the matched stage's verification text. A reference must be assigned to a stage and have a verified path.

For `partial` and `no_match`, add `gapTerms`, nesting acceptable expressions per required gap. A partial case also has evidence groups for its supported components. For `outside`, provide an empty `evidence` array. Optional `constraints` keys include `requiredTools`, `requiredFormats`, `excludeIds`, `excludeMarkers`, and `budget` with value `free`. Marker matching covers selected reference, workflow, or stage IDs.

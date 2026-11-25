# Connect and read one kit

Start the service from one maintainer checkout with `npm ci` and `npm run serve`. The default origin is `http://127.0.0.1:3737`. Other computers and cloud clients require a separately hosted HTTPS origin. A repository URL can supply a browser-readable task map.

| Consumer | Setup |
| --- | --- |
| Codex | Run `node bin/vibe-skills.js mcp-config --target codex` and add the resulting block to the client's MCP configuration. |
| Claude Code | Run `claude mcp add --transport http skillkit http://127.0.0.1:3737/api/mcp` against the running local service, or use the JSON stdio configuration. |
| Antigravity, Cursor, or a JSON stdio client | Run `node bin/vibe-skills.js mcp-config --target antigravity` and add the emitted `mcpServers.skillkit` entry to the client settings. |
| ChatGPT, Claude.ai, or Gemini text chat | On the website open `/mcp`, enter the task, choose **Prepare kit for a text-only chat**, then paste the result. A browsing client can read `/llms.txt`. |
| Other MCP clients | Connect to the service’s `/api/mcp` endpoint. Run `node scripts/check-mcp.js <endpoint>` to test discovery and one read. |

One project instruction can go into AGENTS.md or CLAUDE.md.

> For any non-trivial task, call SkillKit’s find_kit with the existing brief and known constraints. Read only the items needed for the current stage. If a requirement is missing, tell the user before applying a partial kit.

## Commands

Run in the maintainer checkout to query the local engine.

```sh
node bin/vibe-skills.js use "Redesign my portfolio website"
node bin/vibe-skills.js use "Redesign my portfolio website" --lock
node bin/vibe-skills.js verify-lock skillkit.lock.json
node bin/vibe-skills.js get frontend/frontend-design
node bin/vibe-skills.js get frontend/frontend-design --out ./selected-assets
node bin/vibe-skills.js handoff "Draft a newsletter from my notes"
```

With a service available, a consumer needs only the tiny client package. The client has zero npm runtime dependencies. Point `npx` at an existing client directory or a tarball built using `npm pack ./client`. Until publication the package path is required. Running the unqualified public `npx skillkit` resolves another project.

```sh
export SKILLKIT_URL=http://127.0.0.1:3737
npx --package=/absolute/path/to/client -- skillkit use "Redesign my portfolio website"
npx --package=/absolute/path/to/client -- skillkit get frontend/frontend-design --out ./assets
```

Fresh archives and locks use exclusive writes. Files previously owned by the user are retained. A lock verifies local instruction and asset bytes, federated pins and notices, and the selected resource catalog metadata. Public linked resources can change independently of the metadata pin.

## Protocol

Read one item using `get_skill`, `read_skill_file`, or `get_resource`. Reviewed federated files load from their pinned mirror when available. Restricted entries return their upstream link. Use `explain_match` for selection and rejection reasons. HTTP accepts `POST /api/kit` with a JSON task, stack, optional workflow, or structured intent. Query parameters `format=explain`, `format=lock`, and `format=handoff` request richer forms. The handoff caps text at 12 KiB and marks truncated content. Use `GET /api/kit?id=<id>&format=archive` for one approved archive. Existing checkout owners can request a bulk native export only by supplying `--all`. Scripts are data throughout these operations.

Outcome collection requires both operator configuration of `SKILLKIT_OUTCOME_FILE` and a caller’s explicit `consent: true`. The stored record contains only the day, a rating, and verified catalog IDs. Raw prompts and transcripts are excluded. Ratings are not used in production ranking.


Run `node bin/vibe-skills.js agent-rule` once and put the resulting line in the consuming project's `AGENTS.md` or `CLAUDE.md`. The rule is an instruction to the host. The host still decides whether to call the tool.

For compact discovery, POST the JSON request to `/api/find-kit`. POST its selected `kitId` and original `request` to `/api/get-kit` for the stages. Use the same arguments with MCP `find_kit` and `get_kit`. A text-only client can use `handoff`. Keep the server checkout outside the consuming project.

For a small model, `get_skill` accepts an optional `focus` string. The maintainer CLI equivalent is `get <id> --focus "<brief>"`. Returned excerpts quote the approved source verbatim and preserve its provenance and notices. Read the full file for prerequisites or caveats before applying a stage.

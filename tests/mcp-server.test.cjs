const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StdioClientTransport,
} = require("@modelcontextprotocol/sdk/client/stdio.js");
const root = path.resolve(__dirname, "..");
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "registry/skills.json"), "utf8"),
);

test("MCP catalog tools read real data and return an exact recursive export plan", async () => {
  const client = new Client({ name: "skills-library-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, "bin/mcp-server.js")],
  });
  try {
    await client.connect(transport);
    const result = await client.listTools();
    assert.deepEqual(
      result.tools.map((tool) => tool.name).sort(),
      [
        "search_skills",
        "get_skill",
        "list_domains",
        "export_skill",
        "list_resources",
      ].sort(),
    );
    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert.ok(!result.isError, result.content[0]?.text);
      return JSON.parse(result.content[0].text);
    };
    const search = await call("search_skills", {
      domain: "security-bug-bounty",
      limit: 100,
    });
    assert.equal(
      search.total,
      registry.skills.filter((skill) => skill.domain === "security-bug-bounty")
        .length,
    );
    const detail = await call("get_skill", { id: "orchestrator/gravitas" });
    assert.equal(
      detail.instructions,
      fs.readFileSync(
        path.join(root, "skills/orchestrator/gravitas/SKILL.md"),
        "utf8",
      ),
    );
    assert.equal(detail.provenance.id, "orchestrator/gravitas");
    const domains = await call("list_domains", {});
    assert.equal(domains.totalSkills, registry.count);
    for (const domain of domains.domains)
      for (const id of domain.flagshipSkills)
        assert.ok(
          registry.skills.some((skill) => skill.id === id),
          id,
        );
    const project = path.join(root, "project with spaces and 'quotes'");
    const plan = await call("export_skill", {
      id: "orchestrator/gravitas",
      target: "cursor",
      project,
    });
    const walk = (dir) =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
          entry.isDirectory()
            ? walk(path.join(dir, entry.name))
            : [
                path
                  .relative(plan.source, path.join(dir, entry.name))
                  .split(path.sep)
                  .join("/"),
              ],
        )
        .sort();
    assert.deepEqual(plan.files, walk(plan.source));
    assert.ok(
      plan.files.some((file) => file.includes("/")),
      "Must include nested files, not just directory names",
    );
    assert.equal(
      plan.destination,
      path.join(project, ".cursor/skills/gravitas"),
    );
    assert.equal(plan.invocation.args.at(-1), project);
    const printed = require("node:child_process").execFileSync(
      "/bin/sh",
      ["-c", 'node() { printf "%s\\n" "$@"; }; ' + plan.command],
      { encoding: "utf8" },
    );
    assert.deepEqual(printed.trimEnd().split("\n"), plan.invocation.args);
    assert.ok(
      !fs.existsSync(project),
      "Planning must not create destination files",
    );
    const resources = await call("list_resources", {
      query: "animation",
      limit: 100,
    });
    assert.ok(resources.total > 0);
    const invalid = await client.callTool({
      name: "get_skill",
      arguments: { id: "does-not-exist-54321" },
    });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
  }
});

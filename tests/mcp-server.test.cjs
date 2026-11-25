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
    ...JSON.parse(require("node:child_process").execFileSync(process.execPath, [
      path.join(root, "bin/vibe-skills.js"), "mcp-config",
    ], { encoding: "utf8" })).mcpServers.skillkit,
  });
  try {
    await client.connect(transport);
    const result = await client.listTools();
    assert.deepEqual(
      result.tools.map((tool) => tool.name).sort(),
      [
        "find_kit", "get_resource", "report_outcome", "explain_match",
        "recommend_workflow",
        "read_skill_file",
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
    assert.match(client.getInstructions(), /recommend_workflow first/);
    const { prompts } = await client.listPrompts();
    assert.ok(prompts.some(({ name }) => name === 'skillkit_start'));
    const start = await client.getPrompt({ name: 'skillkit_start', arguments: { task: 'Design my portfolio website.' } });
    assert.match(start.messages[0].content.text, /structured intent/);
    assert.equal(start.messages[1].content.text, 'Design my portfolio website.');

    const intake = await call('recommend_workflow', {});
    assert.deepEqual(intake, { status: 'needs_clarification', question: 'What do you want to do?', candidates: [] });
    const task = 'Design my portfolio website.';
    assert.equal((await call('recommend_workflow', { task })).status, 'needs_intent');
    const intent = { actions: ['new-web-project'], projectState: 'new', deliverables: ['Portfolio site'] };
    const route = await call('recommend_workflow', { task, intent });
    const { execFileSync } = require('node:child_process');
    const localRoute = execFileSync(process.execPath, [path.join(root, 'bin/vibe-skills.js'),
      'recommend', task, '--intent-json', JSON.stringify(intent), '--json'], { encoding: 'utf8' });
    assert.deepEqual(route, JSON.parse(localRoute));
    const constrained = await call('recommend_workflow', { task: 'Do not deploy.',
      intent: { ...intent, actions: ['new-web-project', 'deploy'] } });
    assert.ok(constrained.stages.every(({ effect }) => effect !== 'deployment'));
    assert.equal(route.status, 'ready');
    assert.equal(route.workflows[0].id, 'new-web-project');
    const design = await call('get_skill', { id: route.stages[1].skills[0].id });
    assert.equal(design.skill.id, 'frontend/frontend-design');
    assert.match(design.instructions, /Frontend Design/);
    const browser = await call('get_skill', { id: route.stages.at(-1).skills[0].id });
    assert.ok(browser.supportingFiles.includes('scripts/with_server.py'));
    const support = await call('read_skill_file', { id: browser.skill.id, file: 'scripts/with_server.py' });
    assert.equal(support.content, fs.readFileSync(path.join(root, browser.skill.path, support.file), 'utf8'));

    for (const [name, arguments_] of [
      ['recommend_workflow', { task: ['invalid'] }],
      ['read_skill_file', { id: browser.skill.id, file: '../SKILL.md' }],
      ['get_skill', { id: 'code-review' }],
    ]) {
      const error = await client.callTool({ name, arguments: arguments_ });
      assert.equal(error.isError, true, error.content[0]?.text);
    }

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
    const reviewed = require(path.join(root, "catalog/local-assets.json"))["orchestrator/gravitas"];
    assert.deepEqual(plan.files, [...Object.keys(reviewed), "SOURCE.json", "SKILLKIT-LICENSE.txt"].sort());
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

#!/usr/bin/env python3
"""Generate registry/skills.json, registry/domains.json, and registry/resources.json
from the files that actually exist. No hand-maintained duplicates.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
RESOURCES = ROOT / "resources"
REGISTRY = ROOT / "registry"

DOMAINS = [
    ("orchestrator", "Agent Orchestration & Governance",
     "Routing, grilling, multi-agent coordination, context control, and reliability invariants."),
    ("planning", "Planning, Specs & Requirements",
     "Turning intent into PRDs, specs, tickets, implementation plans, and approved scope."),
    ("architecture", "Architecture & Knowledge Modeling",
     "Codebase design, domain modeling, ADRs, dependency boundaries, and knowledge graphs."),
    ("engineering-ops", "Engineering Operations & Code Quality",
     "TDD, debugging, review, verification, migrations, performance, and dead-code cleanup."),
    ("ui-ux", "UI/UX, Design Systems & Motion",
     "Visual hierarchy, design tokens, accessibility, taste, and production motion."),
    ("frontend", "Frontend Engineering",
     "React, Next.js, Three.js, web APIs, performance, and production UI implementation."),
    ("mobile", "Mobile Engineering",
     "Flutter, React Native, SwiftUI, Jetpack Compose, and native interaction patterns."),
    ("backend-api", "Backend, APIs & Data",
     "API contracts, MCP servers, databases, ORMs, and analytical pipelines."),
    ("security-bug-bounty", "Security & Reverse Engineering",
     "Security review, hardening, reverse engineering, recon, and vulnerability analysis."),
    ("automations", "Browser Agents & Automations",
     "Browser control, web app testing, DevTools inspection, and agent automation."),
    ("scraping-leads", "Scraping & Lead Generation",
     "Search visibility, lead enrichment, cold outreach, and structured extraction."),
    ("social-media", "Writing & Social Publishing",
     "Human-sounding writing, platform formatting, and publishing workflows."),
    ("media", "Video, Motion & Generative Media",
     "Programmatic video, motion design, canvas, and generative art."),
    ("agent-tooling", "Agent Tooling & Configuration",
     "Creating, configuring, and operating skills, hooks, rules, subagents, and agent CLIs."),
]

CATEGORY_TITLES = {
    "agent-workflows": "Agent Workflows & Skill Ecosystems",
    "planning-docs": "Planning, Specs & Documentation",
    "architecture-code-quality": "Architecture, Code Quality & Dead Code",
    "design-ui": "Design, UI & Motion",
    "frontend": "Frontend Platform & Performance",
    "backend-data": "Backend, Databases & Data",
    "mobile": "Mobile Platforms",
    "security": "Security & Reverse Engineering",
    "automation-scraping": "Automation, Scraping & Leads",
    "media-video": "Media, Video & Generative Art",
    "learning-reference": "Learning & Reference",
}


FEATURED = {
    "orchestrator/gravitas",
    "orchestrator/grill-me",
    "orchestrator/grilling",
    "orchestrator/find-skills",
    "orchestrator/swarm",
    "orchestrator/master-router",
    "orchestrator/model-council",
    "planning/vibe-planning-6docs",
    "planning/writing-plans",
    "planning/to-spec",
    "planning/planning-and-task-breakdown",
    "planning/brainstorming",
    "architecture/improve-codebase-architecture",
    "architecture/codebase-design",
    "architecture/domain-modeling",
    "architecture/graphify",
    "architecture/documentation-and-adrs",
    "engineering-ops/karpathy-guidelines",
    "engineering-ops/tdd",
    "engineering-ops/systematic-debugging",
    "engineering-ops/verification-before-completion",
    "engineering-ops/code-review",
    "engineering-ops/code-review-and-quality",
    "engineering-ops/code-simplification",
    "ui-ux/ui-ux-pro-max",
    "ui-ux/refactoring-ui",
    "ui-ux/ui-skills-root",
    "ui-ux/baseline-ui",
    "ui-ux/improve-ui",
    "ui-ux/framer-motion-animator",
    "ui-ux/emil-design-eng",
    "ui-ux/taste-skill",
    "ui-ux/impeccable",
    "ui-ux/astryx",
    "frontend/frontend-design",
    "frontend/web-design-guidelines",
    "frontend/vercel-react-best-practices",
    "frontend/threejs-fundamentals",
    "frontend/composition-patterns",
    "frontend/dataviz",
    "mobile/flutter-architecture",
    "mobile/react-native-skills",
    "backend-api/mcp-builder",
    "backend-api/supabase-postgres-best-practices",
    "backend-api/prisma-orm-setup",
    "security-bug-bounty/reverse-engineer-anything",
    "security-bug-bounty/review-security",
    "security-bug-bounty/security-and-hardening",
    "automations/ego-browser",
    "automations/agent-reach",
    "automations/webapp-testing",
    "automations/browser-testing-with-devtools",
    "automations/chrome-devtools",
    "scraping-leads/ai-seo",
    "scraping-leads/cold-email",
    "social-media/human-writer",
    "social-media/linkedin-autoposting",
    "social-media/instagram-autoposting",
    "social-media/writing-guidelines",
    "media/hyperframes",
    "media/motion-reel",
    "media/media-use",
    "media/canvas",
    "agent-tooling/create-skill",
    "agent-tooling/skill-creator",
    "agent-tooling/writing-skills",
    "agent-tooling/sdk",
    "agent-tooling/loop",
    "agent-tooling/split-to-prs",
}


def unquote(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] == '"':
        return value[1:-1].replace('\\"', '"').replace("\\\\", "\\")
    if len(value) >= 2 and value[0] == value[-1] == "'":
        return value[1:-1].replace("''", "'")
    return value


def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fm = text[3:end]
    data = {}
    lines = fm.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not m:
            i += 1
            continue
        key, value = m.group(1), m.group(2).strip()
        if value in (">-", ">", "|", "|-") or (value == "" and key in ("description", "when_to_use")):
            block = []
            i += 1
            while i < len(lines) and (lines[i].startswith((" ", "\t")) or lines[i].strip() == ""):
                block.append(lines[i].strip())
                i += 1
            data[key] = " ".join(x for x in block if x).strip()
            continue
        data[key] = unquote(value)
        i += 1
    return data


def body_description(text):
    """First prose paragraph after the title, for skills shipped without frontmatter."""
    lines = text.splitlines()
    start = 0
    for idx, line in enumerate(lines):
        if line.startswith("# "):
            start = idx + 1
            break
    para = []
    for line in lines[start:]:
        stripped = line.strip()
        if not para and (not stripped or stripped.startswith(("`", "#", ">", "-", "*", "|")) or stripped.endswith(":")):
            continue
        if not stripped:
            if para:
                break
            continue
        if stripped.startswith(("#", "```", ">")) and para:
            break
        para.append(stripped)
    text_out = " ".join(para)
    text_out = re.sub(r"\*\*(.+?)\*\*", r"\1", text_out)
    text_out = re.sub(r"`(.+?)`", r"\1", text_out)
    return text_out.strip()


LICENSE_ALIASES = {
    "Apache-2.0 (per-skill LICENSE.txt)": ("Apache-2.0", "bundled per-skill LICENSE.txt"),
    "MIT (per-skill frontmatter)": ("MIT", "declared in SKILL.md frontmatter"),
    "Complete terms in LICENSE.txt": ("Apache-2.0", "bundled LICENSE.txt"),
    "unverified-local": ("unverified", "user-authored or locally installed, no declared license"),
    "unverified-local-copy": ("unverified", "local copy without a declared license"),
    "unlicensed-upstream": ("unlicensed", "upstream repository ships no license"),
    "source-page-retained": ("unknown", "verbatim extraction of a public page, no license declared"),
}


def normalize_license(value):
    return LICENSE_ALIASES.get(value, (value, None))


def capabilities(path):
    """Inspect skill directory and return detected feature/asset capabilities."""
    caps = []
    feature_dirs = [
        ("templates", "templates"),
        ("prompts", "prompts"),
        ("references", "references"),
        ("rules", "rules"),
        ("scripts", "scripts"),
        ("evals", "evals"),
        ("agents", "agents"),
        ("data", "data"),
    ]
    for folder_name, tag in feature_dirs:
        if (path / folder_name).is_dir() and any((path / folder_name).iterdir()):
            caps.append(tag)
    return sorted(caps)


def build_registries():
    """Derive all registry values from source files without writing anything."""
    skills = []
    for domain, _, _ in DOMAINS:
        domain_dir = SKILLS / domain
        if not domain_dir.is_dir():
            continue
        for skill_dir in sorted(p for p in domain_dir.iterdir() if p.is_dir()):
            skill_file = skill_dir / "SKILL.md"
            if not skill_file.is_file():
                continue
            text = skill_file.read_text(encoding="utf-8", errors="replace")
            fm = parse_frontmatter(text)
            source_file = skill_dir / "SOURCE.json"
            source = json.loads(source_file.read_text()) if source_file.is_file() else {}
            rel = f"{domain}/{skill_dir.name}"
            description = fm.get("description", "")
            description_source = "frontmatter"
            if not description.strip():
                description = body_description(text)
                description_source = "derived" if description else "missing"
            raw_license = source.get("license") or fm.get("license") or "unverified"
            license_id, license_detail = normalize_license(raw_license)
            skills.append({
                "id": rel,
                "name": fm.get("name") or skill_dir.name,
                "domain": domain,
                "path": f"skills/{rel}",
                "description": description,
                "descriptionSource": description_source,
                "frontmatter": bool(fm),
                "license": license_id,
                "licenseDetail": license_detail,
                "origin": source.get("origin", "unknown"),
                "upstream": source.get("upstream"),
                "featured": rel in FEATURED,
                "capabilities": capabilities(skill_dir),
                "files": sum(len(files) for _, _, files in __import__("os").walk(skill_dir)),
            })

    # Stable ordering: domain order, featured first, then name.
    domain_order = {d[0]: i for i, d in enumerate(DOMAINS)}
    skills.sort(key=lambda s: (domain_order[s["domain"]], not s["featured"], s["id"]))

    # Two upstream skills may legitimately share a frontmatter name. Their IDs are
    # unique, so disambiguate the display label instead of editing upstream content.
    name_counts = {}
    for s in skills:
        name_counts[s["name"]] = name_counts.get(s["name"], 0) + 1
    for s in skills:
        s["displayName"] = s["name"]
        if name_counts[s["name"]] == 1:
            continue
        base = s["id"].split("/", 1)[1]
        qualifier = None
        if base != s["name"]:
            if base.endswith("-" + s["name"]):
                qualifier = base[: -len(s["name"]) - 1]
            elif base.startswith(s["name"] + "-"):
                qualifier = base[len(s["name"]) + 1:]
            else:
                qualifier = base
        if qualifier:
            s["displayName"] = f"{s['name']} ({qualifier.replace('-', ' ').title()})"

    counts = {d: 0 for d, _, _ in DOMAINS}
    for s in skills:
        counts[s["domain"]] += 1

    flagships = {}
    for s in skills:
        if s["featured"]:
            flagships.setdefault(s["domain"], []).append(s["id"].split("/", 1)[1])

    domains = []
    for domain, name, description in DOMAINS:
        domains.append({
            "id": domain,
            "name": name,
            "description": description,
            "path": f"skills/{domain}",
            "skillCount": counts[domain],
            "flagshipSkills": flagships.get(domain, []),
        })

    skills_registry = {
        "schemaVersion": "2.0.0",
        "generatedAt": "2026-11-17",
        "count": len(skills),
        "featuredCount": sum(1 for s in skills if s["featured"]),
        "skills": skills,
    }

    domains_registry = {
        "schemaVersion": "2.0.0",
        "count": len(domains),
        "domains": domains,
    }

    # Resources
    categories = []
    all_resources = []
    for path in sorted(RESOURCES.glob("*.json")):
        entries = json.loads(path.read_text())
        for entry in entries:
            entry.setdefault("category", path.stem)
            if "id" not in entry or "url" not in entry:
                raise SystemExit(f"resource missing id/url in {path.name}")
            all_resources.append(entry)
        categories.append({
            "id": path.stem,
            "name": CATEGORY_TITLES.get(path.stem, path.stem.replace("-", " ").title()),
            "path": f"resources/{path.name}",
            "count": len(entries),
        })

    resources_registry = {
        "schemaVersion": "1.0.0",
        "generatedAt": "2026-11-17",
        "count": len(all_resources),
        "categories": categories,
        "resources": all_resources,
    }
    return {"skills.json": skills_registry, "domains.json": domains_registry,
            "resources.json": resources_registry}


def main():
    registries = build_registries()
    if "--check" in sys.argv[1:]:
        stale = []
        for name, expected in registries.items():
            path = REGISTRY / name
            try:
                current = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                current = None
            if current != expected:
                stale.append(name)
        if stale:
            print("registry drift: " + ", ".join(stale) + "; run npm run build:registry")
            return 1
        print("OK — generated registries match all source files.")
        return 0

    REGISTRY.mkdir(exist_ok=True)
    for name, data in registries.items():
        (REGISTRY / name).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    skills = registries["skills.json"]["skills"]
    domains = registries["domains.json"]["domains"]
    all_resources = registries["resources.json"]["resources"]
    categories = registries["resources.json"]["categories"]
    print(f"skills: {len(skills)} ({sum(1 for s in skills if s['featured'])} featured)")
    for d in domains:
        print(f"  {d['id']}: {d['skillCount']}")
    print(f"resources: {len(all_resources)} across {len(categories)} categories")


if __name__ == "__main__":
    sys.exit(main())

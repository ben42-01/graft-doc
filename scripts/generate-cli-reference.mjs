// Builds src/content/docs/cli/reference/*.md: one page per CLI area, listing every
// `graft` command with its arguments, endpoint and an example.
//
// Commands are derived from data/api-catalogue.json with the same rule the CLI
// itself uses (cli/src/catalogue.ts in the Graft repo), and described with the
// prose already in data/endpoint-docs.mjs, so the reference follows the API.
// Fails if the rule cannot name two endpoints differently, or an endpoint has no prose.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { DOCS, GROUPS } from "../data/endpoint-docs.mjs";

const OUT = "src/content/docs/cli/reference";
const API_PREFIX = "/api/v1/";
// What the CLI leaves out: its own commands (auth), Stripe callbacks, the public
// surface visitors use, health checks, and anything platform-admin only.
const EXCLUDED_GROUPS = new Set(["system", "auth", "webhooks", "public", "admin"]);

const catalogue = JSON.parse(readFileSync("data/api-catalogue.json", "utf8"));
const endpoints = catalogue.endpoints.filter(
  (e) => e.auth !== "platform-admin" && !EXCLUDED_GROUPS.has(e.group) && e.path.startsWith(API_PREFIX),
);

// ---- derive commands (mirror of deriveCommands in the Graft repo's cli/src/catalogue.ts)
const isParam = (s) => s.startsWith(":");
const ITEM_VERB = { GET: "get", PATCH: "update", PUT: "set", DELETE: "delete", POST: "confirm" };
const COLLECTION_VERB = { GET: "list", POST: "create", PATCH: "update", PUT: "set", DELETE: "delete" };
const isCollectionName = (s) => /s$/.test(s) && !/(sales|usage|summary|settings|status)$/.test(s);

const paths = new Set(endpoints.map((e) => e.path));
const hasGet = new Set(endpoints.filter((e) => e.method === "GET").map((e) => e.path));
const hasItems = (path) => [...paths].some((p) => p.startsWith(`${path}/:`));

const commands = endpoints.map((e) => {
  const segments = e.path.slice(API_PREFIX.length).split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const statics = segments.filter((s) => !isParam(s));
  const base = { endpoint: e, method: e.method, path: e.path, params: e.params };
  if (isParam(last)) return { ...base, noun: statics, verb: ITEM_VERB[e.method] ?? e.method.toLowerCase() };
  const isAction = segments.length > 1 && e.method !== "GET" && !hasGet.has(e.path) && !hasItems(e.path);
  if (isAction) {
    const verb = e.method === "POST" ? last : `${last}-${COLLECTION_VERB[e.method] ?? e.method.toLowerCase()}`;
    return { ...base, noun: statics.slice(0, -1), verb };
  }
  const verb = e.method === "GET" && !hasItems(e.path) && !isCollectionName(last) ? "get" : COLLECTION_VERB[e.method];
  return { ...base, noun: statics, verb: verb ?? e.method.toLowerCase() };
});
const key = (c) => [...c.noun, c.verb].join(" ");
const seen = new Map();
for (const c of commands) seen.set(key(c), (seen.get(key(c)) ?? 0) + 1);
for (const c of commands) if (seen.get(key(c)) > 1) c.verb = `${c.verb}-${c.method.toLowerCase()}`;
commands.sort((a, b) => key(a).localeCompare(key(b)));

// ---- check the prose exists
const problems = [];
for (const c of commands) {
  if (!DOCS[c.endpoint.id]) problems.push(`no description for ${c.endpoint.id}`);
  if (!GROUPS[c.endpoint.group]) problems.push(`no group entry for "${c.endpoint.group}"`);
}
if (problems.length) {
  console.error("CLI reference is out of sync:\n - " + [...new Set(problems)].join("\n - "));
  process.exit(1);
}

// ---- write pages
const strip = (t) => t.replace(/\s+/g, " ").trim();
const args = (c) => c.params.map((p) => `<${p}>`).join(" ");
const jsonCompact = (v) => JSON.stringify(v);

function example(c, body) {
  const needsBody = ["POST", "PATCH", "PUT"].includes(c.method) && body;
  return `graft ${key(c)}${c.params.length ? " " + args(c) : ""}${needsBody ? ` -d '${jsonCompact(body)}'` : ""}`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const byArea = Object.groupBy(commands, (c) => c.noun[0]);
const areaOrder = Object.keys(GROUPS).filter((g) => byArea[g]);
const unplaced = Object.keys(byArea).filter((a) => !areaOrder.includes(a));
if (unplaced.length) {
  console.error(`CLI areas with no matching API group entry: ${unplaced.join(", ")}`);
  process.exit(1);
}

areaOrder.forEach((area, i) => {
  const list = byArea[area];
  const { title, blurb } = GROUPS[area];
  let md = `---\ntitle: "graft ${area}"\ndescription: "${blurb.replace(/"/g, '\\"')}"\nsidebar:\n  order: ${i + 1}\n---\n\n${blurb}\n\n`;
  md += `:::note\nThis page is generated from Graft's API catalogue. The same operations are in the [${title} API reference](../../../developers/api/${area}/). Run \`graft describe <command>\` for examples from the API test suite.\n:::\n\n`;
  md += `| Command | Does |\n|---|---|\n`;
  for (const c of list) {
    const first = strip(DOCS[c.endpoint.id].d).split(/(?<=\.)\s/)[0];
    md += `| [\`graft ${key(c)}\`](#${slug(c)}) | ${first.replace(/\|/g, "\\|")} |\n`;
  }
  md += `\n`;
  for (const c of list) {
    const doc = DOCS[c.endpoint.id];
    md += `## \`graft ${key(c)}${c.params.length ? " " + args(c) : ""}\`\n\n`;
    md += `${strip(doc.d)}\n\n`;
    md += `**Endpoint:** \`${c.method}\` \`${c.path}\``;
    if (c.params.length) md += ` · **Arguments:** ${c.params.map((p) => `\`<${p}>\``).join(", ")}`;
    md += `\n\n`;
    md += "```bash\n" + example(c, doc.body) + "\n```\n\n";
    if (c.method === "DELETE") md += `Asks for confirmation; pass \`--yes\` to skip it (required in scripts).\n\n`;
    if (c.method === "GET" && c.verb === "list") md += `Add \`--all\` to fetch every page.\n\n`;
  }
  writeFileSync(`${OUT}/${area}.md`, md);
});

// Starlight's heading id for "## `graft a b <x>`" is the text with punctuation dropped.
function slug(c) {
  return `graft ${key(c)}${c.params.length ? " " + args(c) : ""}`
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

writeFileSync(`${OUT}/index.md`,
  `---\ntitle: "Command reference"\ndescription: "Every graft command, by area."\nsidebar:\n  order: 0\n---\n\n` +
  `${commands.length} commands across ${areaOrder.length} areas, generated from Graft's API catalogue. For how commands, flags and output work, read [Using the CLI](../using/). Your installed CLI can list the same commands with \`graft commands\`.\n\n` +
  `Besides these, \`graft\` has its own commands: \`login\`, \`logout\`, \`whoami\`, \`workspace list | use\`, \`profiles\`, \`commands\`, \`describe\` and \`api\`.\n\n` +
  areaOrder.map((a) => `- [\`graft ${a}\`](./${a}/) (${byArea[a].length}): ${GROUPS[a].blurb}`).join("\n") + "\n");

console.log(`Generated ${commands.length} CLI commands across ${areaOrder.length} pages.`);

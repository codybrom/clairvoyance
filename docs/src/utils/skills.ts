import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";
import { Marked } from "marked";

export interface Skill {
  slug: string;
  name: string;
  title: string;
  description: string;
  pillar: string;
  pillarIcon: string;
  pillarHue: number;
  content: string;
  htmlContent: string;
  lastUpdated: string | null;
}

const PILLAR_HUES: Record<string, number> = {
  Structure: 75, // gold/amber
  Abstraction: 155, // teal
  Clarity: 275, // violet
  Process: 30, // orange
  Diagnostic: 25, // red
};

const PILLARS = [
  {
    icon: "Star",
    name: "Structure",
    hue: PILLAR_HUES.Structure,
    skills: [
      "deep-modules",
      "module-boundaries",
      "information-hiding",
      "pull-complexity-down",
    ],
  },
  {
    icon: "Plus",
    name: "Abstraction",
    hue: PILLAR_HUES.Abstraction,
    skills: ["general-vs-special", "error-design", "abstraction-quality"],
  },
  {
    icon: "Circle",
    name: "Clarity",
    hue: PILLAR_HUES.Clarity,
    skills: ["naming-obviousness", "comments-docs"],
  },
  {
    icon: "Diamond",
    name: "Process",
    hue: PILLAR_HUES.Process,
    skills: [
      "strategic-mindset",
      "design-it-twice",
      "code-evolution",
      "complexity-recognition",
    ],
  },
  {
    icon: "Waves",
    name: "Diagnostic",
    hue: PILLAR_HUES.Diagnostic,
    skills: ["red-flags", "design-review", "diagnose"],
  },
];

const SKILLS_DIR = path.resolve(import.meta.dirname, "../../../skills");

function findPillar(slug: string): { name: string; icon: string; hue: number } {
  for (const p of PILLARS) {
    if (p.skills.includes(slug)) {
      return { name: p.name, icon: p.icon, hue: p.hue };
    }
  }
  return { name: "Unknown", icon: "Circle", hue: 75 };
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) return "";
  return match[1].trim().replace(/\s+Review Lens$/, "");
}

function getLastCommitDate(filePath: string): string | null {
  try {
    const date = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: "utf-8",
      cwd: SKILLS_DIR,
    }).trim();
    return date || null;
  } catch {
    return null;
  }
}

const marked = new Marked();

let _cache: Skill[] | null = null;

export function getAllSkills(): Skill[] {
  if (_cache) return _cache;

  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills: Skill[] = [];

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const skillPath = path.join(SKILLS_DIR, dir.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;

    const raw = fs.readFileSync(skillPath, "utf-8");
    const { data, content } = matter(raw);
    const pillar = findPillar(dir.name);
    const title = extractTitle(content);

    skills.push({
      slug: dir.name,
      name: data.name || dir.name,
      title,
      description: data.description || "",
      pillar: pillar.name,
      pillarIcon: pillar.icon,
      pillarHue: pillar.hue,
      content,
      htmlContent: marked.parse(content) as string,
      lastUpdated: getLastCommitDate(skillPath),
    });
  }

  // Sort by pillar order, then by order within pillar
  const pillarOrder = PILLARS.flatMap((p) => p.skills);
  skills.sort(
    (a, b) => pillarOrder.indexOf(a.slug) - pillarOrder.indexOf(b.slug),
  );

  _cache = skills;
  return skills;
}

export function getSkill(slug: string): Skill | undefined {
  return getAllSkills().find((s) => s.slug === slug);
}

export function getSkillsByPillar(): {
  name: string;
  icon: string;
  hue: number;
  skills: Skill[];
}[] {
  const all = getAllSkills();
  return PILLARS.map((p) => ({
    name: p.name,
    icon: p.icon,
    hue: p.hue,
    skills: p.skills
      .map((slug) => all.find((s) => s.slug === slug)!)
      .filter(Boolean),
  }));
}

export { PILLARS, PILLAR_HUES };

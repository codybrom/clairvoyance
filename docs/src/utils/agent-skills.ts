// Artifacts for Agent Skills discovery (agentskills.io discovery v0.2.0,
// https://github.com/cloudflare/agent-skills-discovery-rfc): an index at
// /.well-known/agent-skills/index.json, plus one artifact per skill. A skill
// that is only SKILL.md is served as-is; one with references/ is served as a
// .tar.gz of its directory. Every index entry carries the SHA-256 of the
// exact bytes served, so artifacts and index are built from the same buffers.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { REPO_ROOT, getAllSkills } from "./skills";

export const DISCOVERY_SCHEMA =
  "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const BASE = "/.well-known/agent-skills";

export interface SkillArtifact {
  name: string;
  type: "skill-md" | "archive";
  description: string;
  url: string;
  bytes: Buffer;
}

let _cache: SkillArtifact[] | null = null;

export function getSkillArtifacts(): SkillArtifact[] {
  if (_cache) return _cache;
  _cache = getAllSkills().map((skill) => {
    const dir = path.join(REPO_ROOT, "skills", skill.slug);
    const files = listFiles(dir);
    const common = { name: skill.slug, description: skill.description };
    if (files.length === 1) {
      return {
        ...common,
        type: "skill-md",
        url: `${BASE}/${skill.slug}/SKILL.md`,
        bytes: fs.readFileSync(path.join(dir, "SKILL.md")),
      };
    }
    const mtime = skill.lastUpdated ? Date.parse(skill.lastUpdated) / 1000 : 0;
    return {
      ...common,
      type: "archive",
      url: `${BASE}/${skill.slug}.tar.gz`,
      bytes: tarGz(dir, files, mtime),
    };
  });
  return _cache;
}

export function discoveryIndex() {
  return {
    $schema: DISCOVERY_SCHEMA,
    skills: getSkillArtifacts().map(
      ({ name, type, description, url, bytes }) => ({
        name,
        type,
        description,
        url,
        digest: `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`,
      }),
    ),
  };
}

// Files under `dir` as sorted POSIX paths relative to it.
function listFiles(dir: string): string[] {
  return (fs.readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .map((f) => f.split(path.sep).join("/"))
    .sort();
}

// A gzipped ustar archive with `files` at its root. Fixed modes, owners and
// mtime keep the bytes (and so the digest) stable for unchanged content.
function tarGz(dir: string, files: string[], mtime: number): Buffer {
  const blocks: Buffer[] = [];
  for (const file of files) {
    const data = fs.readFileSync(path.join(dir, file));
    blocks.push(tarHeader(file, data.length, Math.floor(mtime)));
    blocks.push(data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(blocks), { level: 9 });
}

function tarHeader(name: string, size: number, mtime: number): Buffer {
  if (Buffer.byteLength(name) > 100)
    throw new Error(`tar path too long: ${name}`);
  const header = Buffer.alloc(512);
  const octal = (value: number, width: number) =>
    value.toString(8).padStart(width - 1, "0") + "\0";
  header.write(name, 0, 100);
  header.write(octal(0o644, 8), 100);
  header.write(octal(0, 8), 108);
  header.write(octal(0, 8), 116);
  header.write(octal(size, 12), 124);
  header.write(octal(mtime, 12), 136);
  header.write(" ".repeat(8), 148); // checksum is computed with this field as spaces
  header.write("0", 156); // regular file
  header.write("ustar\0", 257);
  header.write("00", 263);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148);
  return header;
}

/**
 * Clairvoyance plugin for OpenCode.
 *
 * Registers this repo's skills/ directory with OpenCode's native skill
 * discovery via the `config` hook, so all 16 skills load whether this
 * plugin is loaded locally (`.opencode/plugins/`, while developing this
 * repo) or installed as a git-sourced package via opencode.json:
 *
 *   { "plugin": ["clairvoyance@git+https://github.com/codybrom/clairvoyance.git"] }
 *
 * No symlinks or manual `skills.paths` config required.
 *
 * Plugin loader pattern (fileURLToPath + a `config` hook pushing an
 * absolute path into config.skills.paths) follows obra/superpowers:
 * https://github.com/obra/superpowers/blob/main/.opencode/plugins/superpowers.js
 */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, "../../skills");

export const ClairvoyancePlugin = async () => {
  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },
  };
};

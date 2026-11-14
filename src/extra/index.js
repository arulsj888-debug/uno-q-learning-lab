// Merges the extra lessons of slots a..e. Lesson ids are assigned when the lesson is added to a board (see addExtra).
import a from './a.js'; import b from './b.js'; import c from './c.js'; import d from './d.js'; import e from './e.js'; import f from './f.js'; import g from './g.js'; import h from './h.js'; import i from './i.js';
const SLOTS = [a, b, c, d, e, f, g, h, i];
export const EXTRA = { programs: {}, code: {}, checks: {} };
for (const s of SLOTS) { Object.assign(EXTRA.programs, s.programs); Object.assign(EXTRA.code, s.code); Object.assign(EXTRA.checks, s.checks); }
const PREFIX = { u3: 'u', e32: 'e', uq: 'q', pi: 'p' };
export function addExtra(board, list, modules) {
  for (const s of SLOTS) {
    for (const L of s.lessons[board] || []) { const n = list.length + 1; list.push({ ...L, id: PREFIX[board] + n, num: n }); }
    Object.assign(modules, s.modules[board] || {});
  }
}

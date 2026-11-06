import { LESSONS } from '../src/data/lessons.js';
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
for (const id of process.argv.slice(2)) {
  const L = LESSONS.find(l => l.id === id);
  console.log('\n######', L.num, L.title, '| goal:', L.goal);
  L.steps.forEach((s, i) => console.log(`  [${i + 1}] ${s.title}: ${strip(s.body)}`));
}

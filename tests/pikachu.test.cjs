const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, '_data', 'pikachu_roadmap.json'), 'utf8'));
const ids = new Set();
let lessonCount = 0;

assert.equal(data.modules.length, 15, 'Pikachu roadmap should contain the 15 core vulnerability modules.');
for (const module of data.modules) {
  assert.ok(module.id && module.title && module.number, 'Every module needs identity and display metadata.');
  assert.ok(Array.isArray(module.lessons) && module.lessons.length, `${module.id} must contain lessons.`);
  for (const lesson of module.lessons) {
    const key = `${module.id}/${lesson.id}`;
    assert.ok(!ids.has(key), `Duplicate skill key: ${key}`);
    ids.add(key);
    lessonCount += 1;
    for (const field of ['title', 'description', 'difficulty', 'duration', 'tools']) {
      assert.ok(lesson[field], `${key} is missing ${field}.`);
    }
  }
}

assert.ok(ids.has(data.defaultSkill), 'defaultSkill must point to an existing lesson.');
assert.ok(lessonCount >= 40, 'The roadmap should cover the complete core exercise set.');
for (const file of ['pikachu.md', '_layouts/pikachu.html', '_includes/pikachu-roadmap.html', 'assets/css/pikachu.css', 'assets/js/pikachu.js']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing Pikachu page file: ${file}`);
}

console.log(`Pikachu roadmap checks passed: ${data.modules.length} modules, ${lessonCount} lessons.`);


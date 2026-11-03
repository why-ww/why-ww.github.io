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


const progress = require(path.join(root, 'assets/js/pikachu-progress.js'));
const fixture = {title:'Pikachu Lab Report - 基于表单的暴力破解',skill:'',module:'暴力破解',completed:true,url:'/form-writeup/',date:'2026-11-04'};
let result = progress.buildProgress(data,[fixture]);
assert.ok(result.completedSkills.has('brute-force/form'),'Published exporter writeup with empty skill must match its exact lesson title.');
assert.equal(result.completedSkills.size,1,'One writeup must complete one lesson only.');
assert.equal(result.postMap.get('brute-force/form')[0].url,fixture.url);
result = progress.buildProgress(data,[{...fixture,title:'Pikachu Lab - 验证码绕过（on server）'}]);
assert.ok(result.completedSkills.has('brute-force/captcha-server'));
assert.ok(!result.completedSkills.has('brute-force/captcha-client'),'Server/client captcha lessons must not be conflated.');
result = progress.buildProgress(data,[{...fixture,title:'Pikachu Lab - 验证码绕过(on client)'}]);
assert.ok(result.completedSkills.has('brute-force/captcha-client'));
result = progress.buildProgress(data,[{...fixture,title:'Other title',skill:'brute-force/form'}]);
assert.ok(result.completedSkills.has('brute-force/form'),'Generic skill IDs must be accepted.');
result = progress.buildProgress(data,[{...fixture,pikachu_skill:'brute-force/form',completed:false}]);
assert.equal(result.completedSkills.size,0,'Explicitly incomplete reports must not count as completed.');
assert.ok(result.postMap.has('brute-force/form'),'Incomplete reports should remain readable.');
result = progress.buildProgress(data,[fixture,{...fixture,date:'2026-11-05',url:'/newer-form-writeup/'}]);
assert.equal(result.completedSkills.size,1,'Multiple writeups of one lesson count once.');
assert.equal(result.postMap.get('brute-force/form')[0].url,'/newer-form-writeup/');
result = progress.buildProgress(data,[{...fixture,title:'暴力破解',module:'暴力破解'}]);
assert.equal(result.completedSkills.size,0,'A module title alone must not complete all lessons.');
const ambiguous = {modules:[{id:'one',title:'One',lessons:[{id:'a',title:'Duplicate'}]},{id:'two',title:'Two',lessons:[{id:'b',title:'Duplicate'}]}]};
assert.equal(progress.buildProgress(ambiguous,[{title:'Duplicate'}]).completedSkills.size,0,'Ambiguous titles need an explicit lesson ID.');
console.log('Pikachu Writeup synchronization passed: empty-ID export, canonical ID, title aliases, completion flags, deduplication, latest link and ambiguous-title protection.');

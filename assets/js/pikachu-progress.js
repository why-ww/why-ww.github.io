/* Match published Pikachu Writeups to one unambiguous lesson. */
(function (global, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.PikachuProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function normalize(value) {
    return typeof value === 'string' ? value.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '') : '';
  }
  function titleName(value) {
    if (typeof value !== 'string') return '';
    return normalize(value
      .replace(/^\s*pikachu(?:\s+lab)?(?:\s+(?:report|writeup))?\s*[-:：|—–·]?\s*/i, '')
      .replace(/^\s*(?:实验报告|漏洞实验报告|writeup)\s*[-:：|—–·]\s*/i, '')
      .replace(/\s*[-:：|—–·]\s*(?:writeup|实验报告)\s*$/i, ''));
  }
  function createIndex(roadmap) {
    const skills = new Map();
    const names = new Map();
    const groups = new Map();
    for (const group of roadmap.modules) {
      groups.set(normalize(group.id), group.id);
      groups.set(normalize(group.title), group.id);
      for (const lesson of group.lessons) {
        const key = group.id + '/' + lesson.id;
        skills.set(key, { group, lesson });
        for (const name of [lesson.title, ...(lesson.aliases || [])]) {
          const normalized = normalize(name);
          if (!names.has(normalized)) names.set(normalized, new Set());
          names.get(normalized).add(key);
        }
      }
    }
    return { skills, names, groups };
  }
  function resolveSkill(post, index) {
    const explicit = post.pikachu_skill || post.skill;
    if (typeof explicit === 'string' && index.skills.has(explicit.trim())) return explicit.trim();
    const groupId = index.groups.get(normalize(post.module));
    const candidates = new Set();
    for (const value of [explicit, post.challenge, post.title]) {
      const normalized = titleName(value);
      if (!normalized) continue;
      const possibleNames = [normalized];
      if (groupId) {
        const group = [...index.skills.values()].find(x => x.group.id === groupId).group;
        for (const prefix of [normalize(group.title), normalize(group.id)]) {
          if (normalized.startsWith(prefix)) possibleNames.push(normalized.slice(prefix.length));
        }
      }
      for (const name of possibleNames) for (const key of index.names.get(name) || []) {
        if (!groupId || index.skills.get(key).group.id === groupId) candidates.add(key);
      }
    }
    return candidates.size === 1 ? [...candidates][0] : null;
  }
  function buildProgress(roadmap, posts) {
    const index = createIndex(roadmap);
    const postMap = new Map();
    const completedSkills = new Set();
    const unmatched = [];
    const sorted = [...posts].sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    for (const post of sorted) {
      const key = resolveSkill(post, index);
      if (!key) { unmatched.push(post); continue; }
      if (!postMap.has(key)) postMap.set(key, []);
      postMap.get(key).push(post);
      // Published writeups count by default; explicit incomplete records stay incomplete.
      if (post.completed !== false && post.completed !== 'false') completedSkills.add(key);
    }
    return { postMap, completedSkills, unmatched };
  }
  return { normalize, titleName, createIndex, resolveSkill, buildProgress };
});

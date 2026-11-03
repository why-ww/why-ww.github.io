(() => {
  'use strict';

  const lab = document.querySelector('[data-pikachu-lab]');
  const dataElement = document.getElementById('pikachu-roadmap-data');
  const postsElement = document.getElementById('pikachu-posts');
  if (!lab || !dataElement || !postsElement) return;

  let roadmap;
  let posts;
  try {
    roadmap = JSON.parse(dataElement.textContent);
    posts = JSON.parse(postsElement.textContent);
  } catch (error) {
    console.error('Pikachu roadmap data could not be read.', error);
    return;
  }

  const route = lab.querySelector('[data-route]');
  const live = lab.querySelector('[data-live]');
  const { postMap, completedSkills, unmatched } = window.PikachuProgress.buildProgress(roadmap, posts);
  if (unmatched.length) console.warn('Pikachu Writeups need an unambiguous lesson ID:', unmatched.map(post => post.title));

  const skills = new Map();
  roadmap.modules.forEach((module) => {
    module.lessons.forEach((lesson) => skills.set(`${module.id}/${lesson.id}`, { module, lesson }));
  });
  const displayOrder = [
    'brute-force', 'xss', 'csrf', 'sql-injection', 'unsafe-upload', 'over-permission',
    'rce', 'file-inclusion', 'unsafe-download', 'traversal', 'information-disclosure',
    'deserialization', 'xxe', 'url-redirect', 'ssrf'
  ];
  const displayModules = [...roadmap.modules].sort((a, b) => displayOrder.indexOf(a.id) - displayOrder.indexOf(b.id));

  const total = skills.size;
  const completed = Array.from(skills.keys()).filter((key) => completedSkills.has(key)).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const setText = (selector, value) => { const element = lab.querySelector(selector); if (element) element.textContent = value; };
  const setWidth = (selector, value) => { const element = lab.querySelector(selector); if (element) element.style.width = value; };

  setText('[data-progress-count]', `${completed} / ${total}`);
  setText('[data-progress-percent]', `${percent}%`);
  setText('[data-bottom-count]', `${completed} / ${total}`);
  setText('[data-bottom-copy]', `已完成 ${completed} 个实验，共 ${total} 个实验`);
  setWidth('[data-progress-bar]', `${percent}%`);
  setWidth('[data-bottom-bar]', `${percent}%`);

  let selectedSkill = decodeURIComponent(location.hash.slice(1));
  if (!skills.has(selectedSkill)) selectedSkill = roadmap.defaultSkill;

  function lessonStatus(key) {
    if (completedSkills.has(key)) return 'is-done';
    if (key === selectedSkill) return 'is-current';
    return '';
  }

  function renderRoute() {
    route.replaceChildren();
    displayModules.forEach((module, moduleIndex) => {
      const done = module.lessons.filter((lesson) => completedSkills.has(`${module.id}/${lesson.id}`)).length;
      const modulePercent = Math.round((done / module.lessons.length) * 100);
      const article = document.createElement('article');
      article.className = `pika-module${selectedSkill.startsWith(`${module.id}/`) ? ' is-selected' : ''}`;
      article.dataset.module = module.id;

      const visibleLessons = module.lessons.slice(0, 4);
      article.innerHTML = `
        <span class="pika-module-number">${String(moduleIndex + 1).padStart(2, '0')}</span>
        <button class="pika-module-card" type="button" aria-label="查看 ${module.title} 实验">
          <span class="pika-module-title"><i class="pika-module-icon" aria-hidden="true">${module.icon}</i>${module.title}</span>
          <span class="pika-module-count">${done} / ${module.lessons.length}</span>
          <span class="pika-module-bar"><i style="width:${modulePercent}%"></i></span>
        </button>
        <ol class="pika-lessons">
          ${visibleLessons.map((lesson) => {
            const key = `${module.id}/${lesson.id}`;
            return `<li class="pika-lesson ${lessonStatus(key)}" data-skill="${key}"><button type="button">${lesson.title}</button></li>`;
          }).join('')}
          ${module.lessons.length > visibleLessons.length ? `<li class="pika-lesson-more">另有 ${module.lessons.length - visibleLessons.length} 个实验</li>` : ''}
        </ol>`;

      article.querySelector('.pika-module-card').addEventListener('click', () => {
        const next = module.lessons.find((lesson) => !completedSkills.has(`${module.id}/${lesson.id}`)) || module.lessons[0];
        selectSkill(`${module.id}/${next.id}`, true);
      });
      article.querySelectorAll('[data-skill]').forEach((item) => {
        item.querySelector('button').addEventListener('click', () => selectSkill(item.dataset.skill, true));
        const writeup = (postMap.get(item.dataset.skill) || [])[0];
        if (writeup) {
          const articleLink = document.createElement('a');
          articleLink.className = 'pika-lesson-writeup';
          articleLink.href = writeup.url;
          articleLink.textContent = '↗';
          articleLink.setAttribute('aria-label', '阅读 ' + writeup.title);
          articleLink.title = '直接阅读 Writeup';
          item.appendChild(articleLink);
        }
      });
      route.appendChild(article);
    });
  }

  function updateCurrent() {
    const current = skills.get(selectedSkill);
    if (!current) return;
    const { module, lesson } = current;
    const article = (postMap.get(selectedSkill) || [])[0];
    setText('[data-current-title]', lesson.title);
    setText('[data-current-module]', module.title);
    setText('[data-current-description]', lesson.description);
    setText('[data-current-difficulty]', lesson.difficulty);
    setText('[data-current-duration]', lesson.duration);
    setText('[data-current-tools]', lesson.tools);
    setText('[data-current-status]', completedSkills.has(selectedSkill) ? '已完成' : '学习中');

    const link = lab.querySelector('[data-current-link]');
    if (article) {
      link.href = article.url;
      link.classList.remove('is-disabled');
      link.innerHTML = '查看 Writeup <span>→</span>';
    } else {
      link.href = '#';
      link.classList.add('is-disabled');
      link.innerHTML = '尚未发布 Writeup <span>→</span>';
    }
    live.textContent = `当前实验：${module.title}，${lesson.title}`;
  }

  function selectSkill(key, updateHash) {
    if (!skills.has(key)) return;
    selectedSkill = key;
    if (updateHash) history.replaceState(null, '', `#${encodeURIComponent(key).replace('%2F', '/')}`);
    renderRoute();
    updateCurrent();
  }

  window.addEventListener('hashchange', () => {
    const key = decodeURIComponent(location.hash.slice(1));
    if (skills.has(key)) selectSkill(key, false);
  });

  renderRoute();
  updateCurrent();
})();


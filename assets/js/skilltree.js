(function () {
  'use strict';

  // Roadmap edges describe visual order. Only page references define categories.
  function createModel(data, posts) {
    const articles = new Map();
    const unmapped = [];
    for (const post of posts) {
      if (!data.nodes[post.skill] || data.nodes[post.skill].page) {
        unmapped.push(post);
        continue;
      }
      if (!articles.has(post.skill)) articles.set(post.skill, []);
      articles.get(post.skill).push(post);
    }
    const cache = new Map();
    function members(pageId, visiting = new Set()) {
      if (cache.has(pageId)) return cache.get(pageId);
      if (visiting.has(pageId)) throw new Error('Circular category: ' + pageId);
      const next = new Set(visiting).add(pageId);
      const result = new Set();
      function walk(node, isRoot) {
        const definition = data.nodes[node.id];
        if (!definition) throw new Error('Unknown node: ' + node.id);
        if (!isRoot) {
          if (definition.page) {
            for (const id of members(definition.page, next)) result.add(id);
          } else result.add(node.id);
        }
        node.children.forEach(child => walk(child, false));
      }
      walk(data.pages[pageId].tree, true);
      cache.set(pageId, result);
      return result;
    }
    function status(id) {
      const def = data.nodes[id];
      const ids = def.page ? members(def.page) : new Set([id]);
      let done = 0;
      for (const key of ids) if (articles.has(key) || data.nodes[key].completed_without_writeup === true) done++;
      return {done, total: ids.size, state: done === 0 ? 'unlearned' : done === ids.size ? 'mastered' : 'learning'};
    }
    function path(pageId) {
      const result = [];
      const seen = new Set();
      while (pageId) {
        if (seen.has(pageId)) throw new Error('Circular breadcrumb');
        seen.add(pageId);
        result.unshift({id:pageId, title:data.pages[pageId].title});
        pageId = data.pages[pageId].parent;
      }
      return result;
    }
    return {articles, unmapped, members, status, path};
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {createModel};
  if (typeof document === 'undefined') return;
  const host = document.querySelector('[data-skilltree]');
  if (!host) return;
  const data = JSON.parse(document.getElementById('skilltree-data').textContent);
  const posts = JSON.parse(document.getElementById('skilltree-posts').textContent);
  const model = createModel(data, posts);
  const labels = {unlearned:'未学习', learning:'学习中', mastered:'已掌握'};
  const stage = host.querySelector('.skill-stage');
  const viewport = host.querySelector('.skill-viewport');
  const breadcrumbs = host.querySelector('.skill-breadcrumb');
  const back = host.querySelector('[data-back]');
  const live = host.querySelector('[data-live]');
  const dialog = host.querySelector('dialog');
  let current = 'root';
  let zoom = 1;
  let diagramWidth = 0;
  let diagramHeight = 0;
  let trigger;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = '15px "Segoe UI", Arial, sans-serif';
  function el(tag, cls, text) {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function postLink(post) {
    const link = el('a', 'skill-article-link', post.title);
    // Article URLs must be same-site relative paths, never executable schemes.
    link.href = typeof post.url === 'string' && /^\/(?!\/)/.test(post.url) ? post.url : '#';
    return link;
  }
  function openNode(id, button) {
    const matches = model.articles.get(id) || [];
    if (matches.length === 1) {
      location.assign(postLink(matches[0]).href);
      return;
    }
    trigger = button;
    const def = data.nodes[id];
    dialog.querySelector('h2').textContent = def.label;
    dialog.querySelector('[data-dialog-path]').textContent = model.path(def.owner).map(p => p.title).join(' / ');
    const content = dialog.querySelector('[data-dialog-content]');
    content.replaceChildren();
    if (!matches.length) {
      const completed = def.completed_without_writeup === true;
      content.append(el('p','skill-empty-title',completed ? '已掌握' : '尚未发布'));
      content.append(el('p','skill-muted',completed ? '已完成签到，无需发布 writeup。' : '这道题的 writeup 还在路上。'));
    } else {
      const list = el('ul','skill-articles');
      for (const post of matches) { const li = el('li'); li.append(postLink(post)); list.append(li); }
      content.append(list);
    }
    dialog.showModal();
  }
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (trigger?.isConnected) trigger.focus(); });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });

  function measure(raw) {
    const width = Math.max(106, Math.ceil(context.measureText(data.nodes[raw.id].label).width) + 42);
    const children = raw.children.map(measure);
    const branchWidth = children.reduce((sum,c) => sum + c.span,0) + Math.max(0,children.length-1)*22;
    return {id:raw.id,width,children,span:Math.max(width,branchWidth)};
  }
  function place(node, left, depth, nodes, edges) {
    node.x = left + node.span/2;
    node.y = 30 + depth*106;
    nodes.push(node);
    const childrenWidth = node.children.reduce((sum,c) => sum+c.span,0) + Math.max(0,node.children.length-1)*22;
    let childLeft = left + (node.span-childrenWidth)/2;
    for (const child of node.children) {
      place(child,childLeft,depth+1,nodes,edges);
      edges.push([node,child]);
      childLeft += child.span+22;
    }
  }
  function rescale(center = false) {
    const frame = stage.querySelector('.skill-canvas');
    if (!frame) return;
    stage.style.width = diagramWidth*zoom+'px';
    stage.style.height = diagramHeight*zoom+'px';
    frame.style.transform = 'scale('+zoom+')';
    host.querySelector('[data-zoom-label]').textContent = Math.round(zoom*100)+'%';
    host.querySelector('[data-zoom-out]').disabled = zoom <= .6;
    host.querySelector('[data-zoom-in]').disabled = zoom >= 1.4;
    if (center) viewport.scrollLeft = Math.max(0,(stage.offsetWidth-viewport.clientWidth)/2);
  }
  function render() {
    let key;
    try { key = decodeURIComponent(location.hash.slice(1)); } catch (_) { key = ''; }
    current = data.pages[key] ? key : !key && data.pages[host.dataset.initialPage] ? host.dataset.initialPage : 'root';
    zoom = 1;
    const page = data.pages[current];
    breadcrumbs.replaceChildren();
    const trail = model.path(current);
    for (let i=0;i<trail.length;i++) {
      if(i) breadcrumbs.append(el('span','skill-separator','/'));
      const part = trail[i];
      const item = el(i===trail.length-1 ? 'span' : 'a','',part.title);
      if (item.tagName === 'A') item.href = '#'+encodeURIComponent(part.id);
      else item.setAttribute('aria-current','page');
      breadcrumbs.append(item);
    }
    back.hidden = !page.parent;
    back.href = '#'+encodeURIComponent(page.parent || 'root');
    host.querySelector('[data-tree-title]').textContent = current==='root' ? '技能树' : page.title;
    const summary = model.status(current);
    host.querySelector('[data-progress]').textContent = '已掌握 '+summary.done+' / '+summary.total;
    const layout = measure(page.tree);
    const nodes = [], edges = [];
    place(layout,24,0,nodes,edges);
    diagramWidth = layout.span+48;
    diagramHeight = Math.max(...nodes.map(n=>n.y))+98;
    const frame = el('div','skill-canvas');
    frame.style.width = diagramWidth+'px';
    frame.style.height = diagramHeight+'px';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('skill-edges');
    svg.setAttribute('width',diagramWidth);
    svg.setAttribute('height',diagramHeight);
    svg.setAttribute('aria-hidden','true');
    for(const [from,to] of edges) {
      const path = document.createElementNS(svg.namespaceURI,'path');
      const bottom=from.y+58, joint=bottom+24;
      path.setAttribute('d',`M ${from.x} ${bottom} V ${joint} H ${to.x} V ${to.y}`);
      svg.append(path);
    }
    frame.append(svg);
    for(const node of nodes) {
      const definition = data.nodes[node.id];
      const status = model.status(node.id);
      const isCurrent = node.id===current;
      const item = el(isCurrent?'div':definition.page?'a':'button','skill-node is-'+status.state);
      item.dataset.node = node.id;
      if (definition.page && !isCurrent) item.href = '#'+encodeURIComponent(definition.page);
      if (item.tagName==='BUTTON') {
        item.type='button';
        item.addEventListener('click',()=>openNode(node.id,item));
      }
      if(isCurrent) item.classList.add('is-current');
      item.style.width=node.width+'px';
      item.style.left=(node.x-node.width/2)+'px';
      item.style.top=node.y+'px';
      const label=el('span','skill-node-label',definition.label);
      item.append(label);
      const detail=definition.page ? status.done+' / '+status.total : labels[status.state];
      item.append(el('span','skill-node-detail',detail));
      const action = model.articles.has(node.id) ? '阅读 writeup' : definition.completed_without_writeup === true ? '查看完成状态' : '尚未发布';
      item.setAttribute('aria-label',definition.label+'，'+labels[status.state]+(definition.page?'，'+detail+'，'+(isCurrent?'当前分类':'进入子树'):', '+action));
      if(definition.unavailable) item.title='CTFHub 暂无环境';
      frame.append(item);
    }
    stage.replaceChildren(frame);
    rescale(true);
    document.title=(current==='root'?'CTFHub 技能树':page.title+' · CTFHub')+" | WHY-WW'S BLOG";
    live.textContent=page.title+'，已掌握 '+summary.done+' / '+summary.total;
  }
  for(const [selector,delta] of [['[data-zoom-in]',.1],['[data-zoom-out]',-.1]]) {
    host.querySelector(selector).addEventListener('click',()=>{zoom=Math.max(.6,Math.min(1.4,Math.round((zoom+delta)*10)/10));rescale(true);});
  }
  host.querySelector('[data-center]').addEventListener('click',()=>{zoom=1;rescale(true);});
  window.addEventListener('hashchange',()=>{render(); const title=host.querySelector('[data-tree-title]');title.focus({preventScroll:true});});
  window.addEventListener('resize',()=>rescale(true));
  const extra = host.querySelector('[data-unmapped]');
  if (model.unmapped.length) {
    extra.hidden=false;
    const list=extra.querySelector('ul');
    for(const post of model.unmapped) {const li=el('li');li.append(postLink(post));list.append(li);}
  }
  render();
})();

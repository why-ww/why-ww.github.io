---
layout: ai-lab
title: 学习总览
ai_section: overview
permalink: /lab/
sitemap: false
---

{% assign ai_posts = site.posts | where_exp: "post", "post.tags contains 'ai-learning'" %}
<div class="ai-lab ai-dashboard" data-ui-version="dashboard-v2">
  <section class="ai-overview ai-hero-row">
    <div><p class="ai-kicker">PERSONAL LEARNING WORKSPACE</p><h1>AI 工程学习实验室<span class="ai-title-dot">.</span></h1><p>阅读、动手、记录。把学到的知识，变成能解释的实践。</p></div>
    <a class="ai-button" href="{{ '/lab/roadmap/' | relative_url }}">继续学习 <span>↗</span></a>
  </section>
  <section class="ai-metrics" aria-label="学习概况">
    <div><span>学习资料</span><strong>03<small> 份</small></strong><p>Agent · AI 协作开发 · Infra</p></div>
    <div><span>计划学习单元</span><strong>12<small> 个</small></strong><p>每阶段 4 个主题，循序推进</p></div>
    <div><span>已发布记录</span><strong>{{ ai_posts.size | prepend: '0' | slice: -2, 2 }}<small> 篇</small></strong><p>理解、实验与复盘</p></div>
    <div><span>实践连接</span><strong>02<small> 个项目</small></strong><p>CTF Mentor · Aemeth Agent</p></div>
  </section>
  <section class="ai-focus-bar"><span class="ai-focus-label">当前任务 <i></i></span><div><strong>{{ site.data.ai_learning.next_task }}</strong><p>从第一份资料开始 · 先理解，再动手验证</p></div><a href="{{ '/lab/roadmap/' | relative_url }}#agent-unit-1">进入学习 →</a></section>
  <section class="ai-section" id="courses">
    <div class="ai-heading"><div><span class="ai-kicker">YOUR LEARNING PATH</span><h2>三条主线，一步步深入</h2></div><a href="{{ '/lab/roadmap/' | relative_url }}">完整学习路线 ↗</a></div>
    <div class="ai-stage-grid">
    {% for stage in site.data.ai_learning.stages %}
      <article class="ai-stage{% if forloop.first %} is-active{% endif %}">
        <div class="ai-stage-top"><span class="ai-stage-number">{{ stage.number }}<small> / STAGE</small></span><span class="ai-status{% if forloop.first %} is-active{% endif %}">{{ stage.status }}</span></div>
        <h3>{{ stage.title }}</h3><p>{{ stage.description }}</p>
        <div class="ai-unit-list">{% for unit in stage.modules %}<a href="{{ '/lab/roadmap/' | relative_url }}#{{ stage.id }}-unit-{{ forloop.index }}"><span class="ai-unit-circle"></span><span>{{ forloop.index | prepend: '0' }} · {{ unit.title }}</span><span>↗</span></a>{% endfor %}</div>
        <div class="ai-stage-plan"><span>学习计划</span><strong>4 个单元</strong><div class="ai-plan-track"><span></span><span></span><span></span><span></span></div><small>完成后用学习记录留下成果</small></div>
        <div class="ai-stage-footer"><a href="{{ '/lab/roadmap/' | relative_url }}#{{ stage.id }}">查看学习内容 →</a><a href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer">原始资料 ↗</a></div>
      </article>
    {% endfor %}
    </div>
  </section>
  <div class="ai-workbench">
    <section class="ai-section" id="learning-log">
      <div class="ai-heading"><div><span class="ai-kicker">LEARNING JOURNAL</span><h2>最近学习记录</h2></div><span class="ai-caption">{{ ai_posts.size }} 篇已发布</span></div>
      <div class="ai-journal">
        <div class="ai-table-head"><span>日期 / 类型</span><span>学习主题</span><span>状态</span></div>
        {% for post in ai_posts limit: 6 %}<a class="ai-log-row" href="{{ post.url | relative_url }}"><time>{{ post.date | date: "%m-%d" }}</time><strong>{{ post.title | escape }}</strong><span>阅读 ↗</span></a>{% endfor %}
        {% if ai_posts.size == 0 %}<div class="ai-journal-intro"><span class="ai-outline-icon">↳</span><div><strong>从第一篇笔记开始</strong><p>记录一次理解的变化，比只记住结论更有价值。</p></div></div>{% endif %}
        {% if ai_posts.size == 0 %}<div class="ai-draft-row"><span>待记录 · 概念</span><strong>Agent 与普通聊天机器人，有什么区别？</strong><a href="{{ '/lab/roadmap/' | relative_url }}#agent-unit-1">去学习 ↗</a></div><div class="ai-draft-row"><span>待记录 · 实验</span><strong>一次工具调用的输入、执行与反馈</strong><a href="{{ '/lab/roadmap/' | relative_url }}#agent-unit-3">查看计划 ↗</a></div><div class="ai-draft-row"><span>待记录 · 复盘</span><strong>把一个新概念连接到已有项目</strong><a href="{{ '/lab/roadmap/' | relative_url }}#agent-unit-4">查看计划 ↗</a></div>{% endif %}
      </div>
    </section>
    <section class="ai-section" id="projects"><div class="ai-heading"><div><span class="ai-kicker">BUILD & EXPLORE</span><h2>项目实践</h2></div><span class="ai-caption">知识的落点</span></div>
      <div class="ai-project-list ai-project-cards"><article><div class="ai-project-title"><span class="ai-project-symbol">⌘</span><h3>CTF Mentor</h3><span class="ai-status">实践方向</span></div><p>把分层提示、学习过程和复盘，连接到 Agent 的上下文与工具系统。</p><div class="ai-topics"><span>上下文管理</span><span>分层提示</span><span>工具调用</span></div><a href="{{ '/lab/roadmap/' | relative_url }}#practice">查看实践问题 →</a></article><article><div class="ai-project-title"><span class="ai-project-symbol">◈</span><h3>Aemeth Agent</h3><span class="ai-status">实践方向</span></div><p>围绕角色一致性和长期记忆，思考信息如何保留、检索与更新。</p><div class="ai-topics"><span>记忆系统</span><span>角色一致性</span><span>语音交互</span></div><a href="{{ '/lab/roadmap/' | relative_url }}#practice">查看实践问题 →</a></article></div>
    </section>
  </div>
  <section class="ai-section ai-concept-board"><div class="ai-heading"><div><span class="ai-kicker">CONNECT THE DOTS</span><h2>串起 Agent 的核心概念</h2></div><span class="ai-caption">带着问题阅读</span></div><div class="ai-concept-flow"><div><small>01 / 输入</small><strong>Context <span>上下文</span></strong><p>这一次决策需要哪些信息？</p></div><div><small>02 / 保留</small><strong>Memory <span>记忆</span></strong><p>哪些经历值得跨轮次保存？</p></div><div><small>03 / 行动</small><strong>Tools <span>工具</span></strong><p>如何让模型可靠地采取行动？</p></div><div><small>04 / 决策</small><strong>Planning <span>规划</span></strong><p>怎样根据执行反馈调整下一步？</p></div></div></section>
</div>

---
layout: ai-lab
title: 学习总览
ai_section: overview
permalink: /lab/
sitemap: false
---

<div class="ai-lab">
  <section class="ai-overview">
    <p class="ai-kicker">AI ENGINEERING JOURNEY</p>
    <h1>从原理走向实践</h1>
    <p>沿着三份资料学习 AI 工程，留下每一次理解、实验和复盘。</p>
  </section>

  <section class="ai-status-panel" aria-label="当前学习状态">
    <div><span>当前阶段</span><strong>深入理解 AI Agent</strong><small>准备开始</small></div>
    <div><span>下一步</span><strong>{{ site.data.ai_learning.next_task }}</strong></div>
    <div><span>学习记录</span>
      {% assign ai_posts = site.posts | where_exp: "post", "post.tags contains 'ai-learning'" %}
      <strong>{{ ai_posts.size }} 篇</strong><small>仅统计已发布的学习记录</small>
    </div>
  </section>

  <section class="ai-section" id="courses">
    <div class="ai-heading">
      <div><span class="ai-kicker">THREE STAGES</span><h2>学习路线</h2></div>
      <a href="{{ '/lab/roadmap/' | relative_url }}">查看完整路线 →</a>
    </div>
    <div class="ai-stage-grid">
      {% for stage in site.data.ai_learning.stages %}
      <article class="ai-stage{% if forloop.first %} is-active{% endif %}">
        <div class="ai-stage-top"><span class="ai-stage-number">{{ stage.number }}</span><span class="ai-status{% if forloop.first %} is-active{% endif %}">{{ stage.status }}</span></div>
        <h3>{{ stage.title }}</h3>
        <p>{{ stage.description }}</p>
        <div class="ai-topics" aria-label="学习主题">{% for topic in stage.topics %}<span>{{ topic }}</span>{% endfor %}</div>
        <div class="ai-stage-footer">
          <a href="{{ '/lab/roadmap/' | relative_url }}#{{ stage.id }}">学习内容 →</a>
          <a href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer">{{ stage.source_label }} ↗</a>
        </div>
      </article>
      {% endfor %}
    </div>
  </section>

  <section class="ai-section ai-concepts" aria-label="知识脉络">
    <div><span class="ai-kicker">CORE CONCEPTS</span><h2>从概念到实践</h2></div>
    <div class="ai-concept-row">
      <span><b>Context</b> 上下文</span>
      <span><b>Memory</b> 记忆</span>
      <span><b>Tools</b> 工具</span>
    </div>
    <p>学到概念后，再对照已有项目思考：它解决什么问题？怎样通过实验验证？</p>
  </section>

  <div class="ai-bottom-grid">
    <section class="ai-section" id="learning-log">
      <div class="ai-heading">
        <div><span class="ai-kicker">LEARNING LOG</span><h2>最近学习记录</h2></div>
      </div>
      {% if ai_posts.size > 0 %}
      <div class="ai-log-list">
        {% for post in ai_posts limit: 6 %}
        <a class="ai-log-row" href="{{ post.url | relative_url }}">
          <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
          <strong>{{ post.title | escape }}</strong>
          <span>阅读 →</span>
        </a>
        {% endfor %}
      </div>
      {% else %}
      <div class="ai-empty"><strong>还没有学习记录</strong><p>发布带有 <code>ai-learning</code> 标签的笔记后，记录会自动出现在这里。</p></div>
      {% endif %}
    </section>

    <section class="ai-section" id="projects">
      <div class="ai-heading"><div><span class="ai-kicker">PROJECT PRACTICE</span><h2>已有项目中的实践场景</h2></div></div>
      <div class="ai-project-list">
        <article><h3>CTF Mentor</h3><p>结合学习记录与分层提示，思考怎样让 Agent 引导解题和复盘。</p><span>可探索：上下文 · 工具调用</span></article>
        <article><h3>Aemeth Agent</h3><p>对照现有的角色、记忆与工具系统，理解 Agent 的设计取舍。</p><span>可探索：记忆 · 工具系统</span></article>
      </div>
    </section>
  </div>
</div>

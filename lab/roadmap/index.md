---
layout: ai-lab
title: 学习路线
ai_section: roadmap
permalink: /lab/roadmap/
sitemap: false
---

<div class="ai-lab">
  <div class="ai-page-heading">
    <p class="ai-kicker">LEARNING ROADMAP</p>
    <h1>学习路线</h1>
    <p>从 Agent 设计到软件开发实践，再到 AI 基础设施。每一阶段都记录理解、练习和复盘。</p>
  </div>

  <div class="ai-route-list">
    {% for stage in site.data.ai_learning.stages %}
    <section class="ai-route-stage{% if forloop.first %} is-active{% endif %}" id="{{ stage.id }}">
      <span class="ai-route-number">{{ stage.number }}</span>
      <div class="ai-route-content">
        <div class="ai-route-top">
          <h2>{{ stage.title }}</h2>
          <span class="ai-status{% if forloop.first %} is-active{% endif %}">{{ stage.status }}</span>
        </div>
        <p>{{ stage.description }}</p>
        <div class="ai-topics" aria-label="学习主题">
          {% for topic in stage.topics %}<span>{{ topic }}</span>{% endfor %}
        </div>
        {% if forloop.first %}
        <div class="ai-route-next">
          <span>接下来</span>
          <strong>{{ site.data.ai_learning.next_task }}</strong>
        </div>
        {% endif %}
        <a class="ai-inline-link" href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer">{{ stage.source_label }} ↗</a>
      </div>
    </section>
    {% endfor %}
  </div>

  <section class="ai-section ai-method">
    <div class="ai-heading"><div><span class="ai-kicker">LEARNING LOOP</span><h2>每章的学习闭环</h2></div></div>
    <div class="ai-method-grid">
      <div><span>01</span><strong>用自己的话解释</strong><p>写下核心概念和仍然不懂的地方。</p></div>
      <div><span>02</span><strong>亲手完成实验</strong><p>记录步骤、结果、失败原因与改动。</p></div>
      <div><span>03</span><strong>连接已有项目</strong><p>在 CTF Mentor 或 Aemeth Agent 中寻找可验证的应用。</p></div>
      <div><span>04</span><strong>复盘并发布</strong><p>把经过验证的学习过程留在 GitHub。</p></div>
    </div>
  </section>
</div>

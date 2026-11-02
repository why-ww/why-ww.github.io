---
layout: default
permalink: /lab/
sitemap: false
---

<div class="ai-lab">
  <a class="ai-lab-back" href="{{ '/' | relative_url }}">← 返回博客</a>

  <section class="ai-lab-hero">
    <p class="ai-lab-eyebrow">AI ENGINEERING JOURNEY</p>
    <h1>AI 工程学习实验室</h1>
    <p class="ai-lab-intro">记录从理解 AI Agent、掌握 AI 时代的软件开发，到看懂模型基础设施的完整学习过程。</p>

    <div class="ai-lab-status">
      <div>
        <span>当前阶段</span>
        <strong>准备学习《深入理解 AI Agent》</strong>
      </div>
      <div class="ai-lab-next">
        <span>下一步</span>
        <strong>完成第一章第 1 级：建立 Agent 的基本认识</strong>
      </div>
    </div>
  </section>

  <section class="ai-lab-section">
    <div class="ai-lab-section-heading">
      <div>
        <p>LEARNING ROADMAP</p>
        <h2>三阶段学习路线</h2>
      </div>
      <span>理论 → 实验 → 项目 → 复盘</span>
    </div>

    <div class="ai-lab-roadmap">
      <article class="ai-lab-book is-current">
        <div class="ai-lab-book-top">
          <span class="ai-lab-step">01</span>
          <span class="ai-lab-badge">准备开始</span>
        </div>
        <h3>深入理解 AI Agent</h3>
        <p>从上下文、记忆、工具调用和规划开始，逐步理解并实现真正可运行的 Agent。</p>
        <div class="ai-lab-book-footer">
          <span>第一阶段</span>
          <a href="https://github.com/bojieli/ai-agent-book" target="_blank" rel="noopener noreferrer">教材仓库 ↗</a>
        </div>
      </article>

      <article class="ai-lab-book">
        <div class="ai-lab-book-top">
          <span class="ai-lab-step">02</span>
          <span class="ai-lab-badge">待开始</span>
        </div>
        <h3>Stanford CS146S</h3>
        <p>学习 AI 时代的软件开发方式，通过课程练习把 Agent 能力真正用到项目中。</p>
        <div class="ai-lab-book-footer">
          <span>第二阶段</span>
          <a href="https://themodernsoftware.dev/" target="_blank" rel="noopener noreferrer">课程主页 ↗</a>
        </div>
      </article>

      <article class="ai-lab-book">
        <div class="ai-lab-book-top">
          <span class="ai-lab-step">03</span>
          <span class="ai-lab-badge">待开始</span>
        </div>
        <h3>深入理解 AI Infra</h3>
        <p>理解算力、显存、推理与训练系统，建立 AI 工程所需的底层系统认识。</p>
        <div class="ai-lab-book-footer">
          <span>第三阶段</span>
          <a href="https://github.com/bojieli/ai-infra-book" target="_blank" rel="noopener noreferrer">教材仓库 ↗</a>
        </div>
      </article>
    </div>
  </section>

  <section class="ai-lab-section">
    <div class="ai-lab-section-heading">
      <div>
        <p>LEARNING LOG</p>
        <h2>最近学习记录</h2>
      </div>
      <span>理解 · 实验 · 失败 · 复盘</span>
    </div>

    {% assign ai_posts = site.posts | where_exp: "post", "post.tags contains 'ai-learning'" %}
    {% if ai_posts.size > 0 %}
      <div class="ai-lab-log">
        {% for post in ai_posts limit: 6 %}
          <a class="ai-lab-log-item" href="{{ post.url | relative_url }}">
            <div>
              <strong>{{ post.title | escape }}</strong>
              <span>{{ post.date | date: "%Y-%m-%d" }}</span>
            </div>
            <span>查看记录 →</span>
          </a>
        {% endfor %}
      </div>
    {% else %}
      <div class="ai-lab-empty">
        <strong>第一条学习记录将在这里出现。</strong>
        <p>每完成一个知识层级或实验，就用 <code>ai-learning</code> 标签保存理解、过程和复盘。</p>
      </div>
    {% endif %}
  </section>
</div>

---
layout: ai-lab
title: 学习路线
ai_section: roadmap
permalink: /lab/roadmap/
sitemap: false
---

<div class="ai-lab ai-roadmap" data-ui-version="roadmap-v2">
  <div class="ai-page-heading ai-hero-row"><div><p class="ai-kicker">LEARNING ROADMAP / 01—03</p><h1>把知识连成一条路<span class="ai-title-dot">.</span></h1><p>Agent 原理 → AI 协作开发 → 基础设施。每个单元都有问题，也有自己的产出。</p></div><a class="ai-button ai-button-quiet" href="{{ '/lab/' | relative_url }}">返回学习总览 ↗</a></div>
  <div class="ai-roadmap-layout">
    <aside class="ai-curriculum"><div class="ai-sidebar-title"><span class="ai-kicker">CURRICULUM</span><h2>学习目录</h2><p>3 个阶段 · 12 个学习单元</p></div>{% for stage in site.data.ai_learning.stages %}<details open class="ai-directory"><summary><span>{{ stage.number }}</span>{{ stage.title }}</summary><nav aria-label="{{ stage.title }}学习单元">{% for unit in stage.modules %}<a href="#{{ stage.id }}-unit-{{ forloop.index }}"><span class="ai-unit-circle"></span>{{ unit.title }}</a>{% endfor %}</nav></details>{% endfor %}<div class="ai-sidebar-note"><span class="ai-kicker">READ → BUILD → REFLECT</span><p>这里的单元是个人学习计划；教材章节与课程安排以原始资料为准。</p></div></aside>
    <div class="ai-route-main">
      <section class="ai-route-welcome"><span class="ai-kicker">START HERE</span><h2>先理解一个问题，再完成一个实验</h2><p>先从 Agent 的组成开始。读完后，用自己的话解释，再把概念放回已有项目里检查。</p><a href="#agent-unit-1">开始第一个单元 →</a></section>
      <div class="ai-route-list">{% for stage in site.data.ai_learning.stages %}<section class="ai-route-stage{% if forloop.first %} is-active{% endif %}" id="{{ stage.id }}"><div class="ai-route-stage-label"><span class="ai-stage-number">{{ stage.number }}</span><div><span class="ai-kicker">LEARNING STAGE</span><h2>{{ stage.title }}</h2></div><span class="ai-status">{{ stage.status }}</span></div><p class="ai-route-description">{{ stage.description }}</p><div class="ai-topics">{% for topic in stage.topics %}<span>{{ topic }}</span>{% endfor %}</div>
      <div class="ai-modules">{% for unit in stage.modules %}<details class="ai-module" id="{{ stage.id }}-unit-{{ forloop.index }}"{% if forloop.first %} open{% endif %}><summary><span class="ai-module-index">{{ stage.number }}.{{ forloop.index }}</span><strong>{{ unit.title }}</strong><span class="ai-module-state">计划学习</span><span class="ai-expand">+</span></summary><div class="ai-module-body"><p>{{ unit.description }}</p><div class="ai-output"><span>本单元产出</span><strong>{{ unit.output }}</strong></div><div class="ai-module-actions"><span>阅读理解 → 动手验证 → 记录复盘</span><a href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer">打开原始资料 ↗</a></div></div></details>{% endfor %}</div><div class="ai-route-source"><span>4 个学习单元 · 按自己的节奏推进</span><a href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer">{{ stage.source_label }} ↗</a></div></section>{% endfor %}</div>
      <section class="ai-section ai-method"><div class="ai-heading"><div><span class="ai-kicker">MAKE IT YOURS</span><h2>每次学习，留下四件事</h2></div></div><div class="ai-method-grid"><div><span>01 / 理解</span><strong>我学会了什么</strong><p>用自己的话解释核心概念。</p></div><div><span>02 / 验证</span><strong>我做了什么</strong><p>保存步骤、现象和结论。</p></div><div><span>03 / 追问</span><strong>我还不懂什么</strong><p>写出具体疑问与下一次实验。</p></div><div><span>04 / 连接</span><strong>可以用在哪里</strong><p>联系项目，记录设计取舍。</p></div></div></section>
    </div>
    <aside class="ai-route-aside">
      <section class="ai-side-card ai-side-current"><span class="ai-kicker">NEXT ACTION</span><span class="ai-status is-active">准备开始</span><h2>认识 AI Agent</h2><p>{{ site.data.ai_learning.next_task }}</p><div class="ai-task-checks"><span>○ 阅读并标出不懂的概念</span><span>○ 画出一次执行流程</span><span>○ 写下自己的解释与疑问</span></div><a class="ai-button" href="#agent-unit-1">进入学习单元 ↗</a></section>
      <section class="ai-side-card" id="practice"><span class="ai-kicker">PROJECT CONNECTION</span><h2>带回项目里验证</h2><div class="ai-practice-question"><strong>CTF Mentor</strong><p>一次提示需要哪些上下文？怎样保留用户的解题思路？</p><a href="#agent-unit-2">连接上下文与记忆 →</a></div><div class="ai-practice-question"><strong>Aemeth Agent</strong><p>什么记忆应当长期保留？工具执行失败后应如何回应？</p><a href="#agent-unit-3">连接工具调用 →</a></div></section>
      <section class="ai-side-card"><span class="ai-kicker">KNOWLEDGE MAP</span><h2>核心知识索引</h2><div class="ai-knowledge-tags"><a href="#agent-unit-2">上下文</a><a href="#agent-unit-2">长期记忆</a><a href="#agent-unit-3">Function Calling</a><a href="#agent-unit-3">规划与反馈</a><a href="#cs146s-unit-3">测试与调试</a><a href="#infra-unit-3">推理服务</a></div></section>
    </aside>
  </div>
</div>

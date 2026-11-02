---
layout: ai-overview
title: 学习总览
ai_section: overview
permalink: /lab/
sitemap: false
---
{% assign board = site.data.ai_learning.dashboard %}
{% assign ai_posts = site.posts | where_exp: "post", "post.tags contains 'ai-learning'" %}
<div class="ai-lab ov-board" data-ui-version="overview-reference-v4">
  <section class="ov-status ov-panel" aria-label="学习状态">
    <div><span class="ov-label">当前阶段</span><h1>深入理解 AI Agent</h1><p>掌握 Agent 的核心原理、架构与实践方法，建立从理论到工程的完整认知。</p></div>
    <div><span class="ov-label">下一步</span><a class="ov-next" href="{{ '/lab/roadmap/' | relative_url }}#experiment-1">第一章 · 第 1 级</a><p>Agent 是什么？从 LLM 到 Agent 的关键转变</p></div>
    <div><span class="ov-label">总体进度</span><div class="ov-progress-row"><span class="ov-progress-track"><i style="width:0%"></i></span><strong>0%</strong></div><p>准备开始 · 按学习成果更新进度</p></div>
    <div><span class="ov-label">实验任务数</span><strong class="ov-project-count">0 / {{ board.experiments.size }}</strong><p>0 个已完成 · {{ board.experiments.size }} 个待开始</p></div>
  </section>
  <section class="ov-courses" aria-label="学习课程">{% for stage in site.data.ai_learning.stages %}
    <article class="ov-course ov-panel{% if forloop.first %} is-active{% endif %}" data-search="{{ stage.title }} {{ stage.topics | join: ' ' }}">
      <div class="ov-course-top"><span>{% if forloop.first %}主线{% endif %}课程 {{ stage.number }}</span><span class="ov-course-state"><i></i>{{ stage.status }}</span></div>
      <h2><a href="{{ '/lab/roadmap/' | relative_url }}#{{ stage.id }}">{{ stage.title }}</a></h2>
      <p class="ov-course-description">{{ stage.description }}{% if forloop.first %}连接上下文、记忆与工具系统，在实践中形成自己的判断。{% elsif stage.id == 'cs146s' %}练习需求拆解、代码阅读、测试和交付，建立可验证的开发流程。{% else %}连接本机资源与模型服务，理解 AI 系统从运行到扩展的工程取舍。{% endif %}</p>
      <div class="ov-course-meta"><span><svg><use href="#i-book"/></svg> {{ stage.modules.size }} 个学习单元</span><span><svg><use href="#i-file"/></svg> {{ stage.topics.size }} 个核心主题</span><span><svg><use href="#i-target"/></svg> 按个人节奏</span></div>
      <h3>核心主题</h3><div class="ov-tags">{% for topic in stage.topics %}<a href="{{ '/lab/roadmap/' | relative_url }}#{{ stage.id }}">{{ topic }}</a>{% endfor %}</div>
      <div class="ov-course-source" id="source-{{ stage.id }}"><span>课程来源</span><a href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer"><span>♧</span> {{ stage.source_url | remove: 'https://' }} ↗</a></div>
    </article>{% endfor %}
  </section>
  <section class="ov-concepts ov-panel" id="knowledge"><div class="ov-concept-heading"><h2>核心知识脉络</h2><p>构建 Agent 的三大核心能力，形成完整的认知闭环</p></div><a href="{{ '/lab/roadmap/' | relative_url }}#agent" class="ov-concept"><svg><use href="#i-file"/></svg><div><h3>Context <span>上下文理解</span></h3><p>理解任务、环境与用户意图，构建有效的上下文表示</p></div></a><span class="ov-flow-arrow">→</span><a href="{{ '/lab/roadmap/' | relative_url }}#knowledge" class="ov-concept"><svg><use href="#i-memory"/></svg><div><h3>Memory <span>记忆机制</span></h3><p>存储历史经验、长期知识与个性化信息，实现持续学习</p></div></a><span class="ov-flow-arrow">→</span><a href="{{ '/lab/roadmap/' | relative_url }}#experiments" class="ov-concept"><svg><use href="#i-tools"/></svg><div><h3>Tools <span>工具使用</span></h3><p>调用外部工具与 API，扩展能力边界，完成复杂任务</p></div></a></section>
  <div class="ov-bottom">
    <section class="ov-panel ov-logs" id="learning-log"><div class="ov-section-heading"><h2>学习日志</h2><label for="ov-log-filter" class="ov-filter"><select id="ov-log-filter"><option value="0">全部记录</option><option value="7">最近 7 天</option><option value="30">最近 30 天</option></select></label></div><div class="ov-log-scroll"><table class="ov-log-table"><thead><tr><th>日期</th><th>类型</th><th>标题</th><th>摘要</th></tr></thead><tbody>{% for post in ai_posts limit:7 %}<tr data-log-date="{{ post.date | date_to_xmlschema }}" data-search="{{ post.title | escape }}"><td>{{ post.date | date: "%Y-%m-%d" }}</td><td><span class="ov-log-type">学习</span></td><td><a href="{{ post.url | relative_url }}">{{ post.title | escape }}</a></td><td>{{ post.excerpt | strip_html | truncate:65 }}</td></tr>{% endfor %}
    {% if ai_posts.size == 0 %}{% for experiment in board.experiments %}<tr data-search="{{ experiment.title }}"><td>--</td><td><span class="ov-log-type">待记录</span></td><td><a href="{{ '/lab/roadmap/' | relative_url }}#experiment-{{ forloop.index }}">{{ experiment.title }}</a></td><td>{{ experiment.description }}</td></tr>{% endfor %}<tr data-search="上下文 记忆 工具"><td>--</td><td><span class="ov-log-type">计划</span></td><td><a href="{{ '/lab/roadmap/' | relative_url }}#knowledge">理解上下文、记忆与工具</a></td><td>结合知识关联图，梳理核心概念与已有项目之间的关系。</td></tr><tr data-search="学习复盘 问题清单"><td>--</td><td><span class="ov-log-type">计划</span></td><td><a href="{{ '/lab/roadmap/' | relative_url }}#learning-log">整理学习问题清单</a></td><td>写下仍不理解的地方，把疑问转化为下一次实验。</td></tr>{% endif %}
    </tbody></table><p id="ov-log-empty" class="ov-empty" hidden>这个时间范围内还没有已发布的学习日志。</p></div></section>
    <section class="ov-panel ov-projects" id="projects"><div class="ov-section-heading"><h2>项目实践</h2><a href="{{ '/lab/roadmap/' | relative_url }}#projects">查看实践关联 →</a></div><div class="ov-project-list">
      <article class="ov-project" data-search="CTF Mentor Agent 工具调用 安全领域"><span class="ov-project-state"><i></i>实践方向</span><div class="ov-project-copy"><h3>CTF Mentor</h3><p>围绕 CTF 学习与复盘，连接上下文管理、分层提示和工具调用，让每一步实践留下可解释的过程。</p><div class="ov-tags"><span>Agent</span><span>工具调用</span><span>学习复盘</span><span>安全领域</span></div></div><div class="ov-project-action"><span>关联学习主题</span><strong>Context / Tools</strong><a href="{{ '/lab/roadmap/' | relative_url }}#projects">查看关联 ↗</a></div></article>
      <article class="ov-project" data-search="Aemeth Agent 角色 记忆 语音"><span class="ov-project-state"><i></i>实践方向</span><div class="ov-project-copy"><h3>Aemeth Agent</h3><p>围绕角色一致性、长期记忆与语音交互，思考信息的保留、检索和更新方式，在已有项目中验证设计。</p><div class="ov-tags"><span>长期记忆</span><span>角色一致性</span><span>语音交互</span><span>API 集成</span></div></div><div class="ov-project-action"><span>关联学习主题</span><strong>Memory / Tools</strong><a href="{{ '/lab/roadmap/' | relative_url }}#knowledge">查看关联 ↗</a></div></article>
    </div></section>
  </div>
  <details class="ov-resources" id="resources"><summary>资源收藏 · 教材与课程 ↗</summary><div>{% for stage in site.data.ai_learning.stages %}<a href="{{ stage.source_url }}" target="_blank" rel="noopener noreferrer">{{ stage.title }} ↗</a>{% endfor %}</div></details>
</div>

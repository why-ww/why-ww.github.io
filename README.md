# 博客文章维护

主页展示全部文章，顶部导航进入 CTFHub 或 bugku 专题。专题使用 `tags` 区分，不改变文章地址。

CTFHub 专题使用完整技能树，包含 60 个子树及 289 个可关联文章的节点。现有文章全部属于 bugku，不参与 CTFHub 学习状态计算。

以后在 `_posts/YYYY-MM-DD-题目名称.md` 中新增 CTFHub 文章，例如：

```yaml
---
layout: writeup
title: "CTFHub Writeup - 请求方式"
date: 2026-09-20
tags: [ctfhub, web]
skill: "web-http/请求方式"
---
```

正文写在第二个 `---` 后面。从 [CTFHub 节点索引](docs/ctfhub-skills.md) 复制对应题目的 `skill` 值即可自动关联；同名题目使用不同的值，避免误关联。

CTFHub 的其他领域可使用 `tags: [ctfhub, misc]`、`tags: [ctfhub, pwn]` 等。平台标签 `ctfhub` 必须小写。bugku 文章继续使用 `tags: [bugku]`，不需要 `skill`。

- 没有文章：未学习，点击题目提示「尚未发布」。
- 有文章：该题已掌握，点击进入 writeup；同一题有多篇文章时显示文章列表。
- 「签到」为无需 writeup 的已掌握节点，计入总进度；点击显示已完成签到的说明。
- 分类下部分题目有文章：学习中；全部有文章：已掌握。
- CTFHub 暂无环境的节点保留，并显示「暂无环境」标识；点击可查看说明。该标注来自整理时的官网截图，由 `unavailable` 字段维护，不实时检测平台环境；当前按未学习计算，不复制官网账号的完成情况。
- 有 `ctfhub` 标签但缺少或填错 `skill` 的文章显示在技能树下方「其他 CTFHub 文章」，不计入已掌握数量。

题目间的连线只表示学习顺序。例如先发布「整数型注入」的文章，就只标记这一题已掌握，不要求其后连接的题目完成。

旧的 `/ctfhub/web/` 和 `/ctfhub/misc/` 链接仍可访问，直接打开对应子树。新的分类链接形如 `/ctfhub/#web`。

`writeup` 布局继承 Minima 的文章布局，并显示专题返回链接；省略 `layout` 时也会默认使用它。

技能树结构位于 `_data/ctfhub_skilltree.json`，按提供的官网截图记录；未来官网新增内容时需要同步更新。`pages` 保存子树和父分类，`nodes` 保存节点，`tree.children` 仅保存画面中的连接关系。

本地逻辑检查（需要 Node.js，无额外依赖）：`node tests/skilltree.test.cjs`。

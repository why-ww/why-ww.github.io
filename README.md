# 博客文章维护

主页展示全部文章，顶部导航进入 CTFHub 或 bugku 专题。专题使用 `tags` 区分，不改变文章地址。

在 `_posts/YYYY-MM-DD-题目名称.md` 中新增文章：

```yaml
---
layout: writeup
title: "CTFHub Writeup - 题目名称"
date: 2026-09-19
tags: [ctfhub, web]
---
```

CTFHub 的 misc 文章使用 `tags: [ctfhub, misc]`，bugku 文章使用 `tags: [bugku]`。标签统一小写，每篇文章选择一个平台。可添加其他知识点标签，不影响专题筛选。

正文写在第二个 `---` 后面。CTFHub 文章会自动出现在「全部」及对应方向页面，页面上的数量也会自动更新。没有方向标签的 CTFHub 文章只在「全部」中展示。

`writeup` 布局继承 Minima 的文章布局，并显示专题返回链接；省略 `layout` 时也会默认使用它。

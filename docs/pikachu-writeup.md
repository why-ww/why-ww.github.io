# Pikachu Writeup 与路线同步

发布带 pikachu 标签的文章后，路线会按关卡关联 Writeup，并更新模块与总进度。

推荐的文章头部：
```yaml
---
layout: writeup
title: "Pikachu Lab Report - 基于表单的暴力破解"
date: YYYY-MM-DD
tags: [pikachu]
pikachu_skill: "brute-force/form"
completed: true
module: "暴力破解"
---
```

- pikachu_skill 为稳定关卡编号，格式“模块编号/关卡编号”；可在 _data/pikachu_roadmap.json 中查找。
- 兼容通用 skill 字段。导出文章没有编号或 skill 为空时，会根据明确的题目名称与别名匹配。
- 已发布 Writeup 默认计入完成；completed: false 可记录尚未完成的尝试，保留文章链接但不增加完成数量。
- 同一关卡发布多篇文章只计完成一次，入口优先指向日期最新的文章。
- 只有模块名称或名称存在歧义时不会猜测完成状态，请填写稳定编号。
- 发布并等待 Pages 构建成功后，模块进度、总进度、关卡勾选与 Writeup 链接一起更新。

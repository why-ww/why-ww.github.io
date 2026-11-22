---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - Cookie"
date: 2026-09-26

skill: web-http/Cookie
completed: true
---

# CTFHub CTF Writeup - Cookie


## 题目类型

WEB

## 题目描述

题目提示了Cookie



## 解题过程

<br>· thought： 题目提示了Cookie，按 F12 打开开发者工具找到Cookie看是否可更改

<br>· attempt： 查询得知服务器代码逻辑：读取 Cookie 里的 admin 值，如果等于 1，判定是管理员，返回 flag；等于 0 就是普通访客。 所以将Cookie 里的 admin 值改为1 刷新界面出现flag



## 本题的核心逻辑

服务器通过 Cookie 提供的身份信息，去确认用户对应的权限。


## 笔记

这道题主要学习了：
<br>1. Cookie 通常保存身份标识
<br>2. 如何修改 Cookie 权限


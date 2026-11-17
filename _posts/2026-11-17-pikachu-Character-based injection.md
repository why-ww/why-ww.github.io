---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - 字符型注入"
date: 2026-11-17

skill: "sql-injection/string"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 字符型注入

## 实验模块

模块：SQL注入

场景：字符型注入

## 漏洞场景

题目名称：字符型注入；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在输入框中输入用户名 allen 并点击查询，页面返回 your uid:2 和 your email is: allen@pikachu.com，说明正常情况下可以通过用户名查询对应用户信息。
<br>2. 在用户名后添加单引号，输入 allen' 并提交，页面出现 MySQL SQL 语法错误：You have an error in your SQL syntax。
<br>3. 输入 allen' AND '1'='1 并提交，页面仍然返回 Allen 的用户信息；记录中将 '1'='1' 说明为恒真条件。
<br>4. 将条件改为 allen' AND '1'='2 并提交后，页面提示“您输入的username不存在，请重新输入！”，查询结果为空。

## 其他观察

使用浏览器开发者工具查看 Network 请求，并使用 Burp Suite Repeater 分析请求，发现请求地址为 GET /pikachu/vul/sqli/sqli\_str.php?name=allen&submit=...；其中 name 是用户名参数，submit 是查询按钮提交的参数，请求方式为 GET。

观察请求参数时发现特殊字符会经过 URL 编码；通过 Burp 可以观察请求参数以及服务器返回的页面内容，进一步验证真假条件对查询结果的影响。


## 分析与解答

### 1.

<br>问题：输入 allen' 后出现 MySQL 语法错误说明了什么？
<br>解答：这提示后台很可能把 name 参数直接拼接到带引号的 SQL 语句中，单引号闭合了原有字符串并改变语句结构，因此该位置疑似存在字符型 SQL 注入。

### 2.

<br>问题：allen' AND '1'='1 返回正常而 allen' AND '1'='2 查询不存在说明了什么？
<br>解答：两次输入的差别在布尔条件，结果随条件真假改变，推断注入的 AND 逻辑被带入 SQL 查询；恒真时保留 Allen 记录，恒假时无结果，这进一步支持字符型注入判断。

### 3.

<br>问题：GET 请求中特殊字符显示为 URL 编码会影响注入测试吗？
<br>解答：GET 参数位于 URL 中，浏览器或抓包工具会对特殊字符进行百分号编码；服务端接收后会先解码再交给后端脚本处理，因此 Burp 中看到的编码形式并不代表注入内容失效。


## 漏洞原理与修复思路

<br>字符型 SQL 注入通常源于将用户输入直接拼接进带引号的 SQL 字符串。输入中的单引号可改变字符串边界，使后续内容被当作 SQL 语法解析；当布尔条件被带入查询时，真假条件会直接影响返回记录是否存在。

<br>修复时应优先使用参数化查询或预编译语句，让输入值作为数据绑定而不是 SQL 结构的一部分；同时可配合输入类型与长度校验、最小数据库权限和统一错误处理，避免向前端泄露详细 SQL 语法错误。


## 学习总结

本次靶场实验主要学习了：

<br>1. 该实验展示了字符型 SQL 注入的基本验证链：先以正常查询建立基线，再用单引号观察语法错误，最后通过恒真与恒假条件对比确认布尔逻辑是否可控。
<br>2. 抓包观察 GET 参数、URL 编码和服务器返回页面，有助于区分浏览器展示层与后端实际接收的数据；后续学习可继续关注参数化查询、错误信息控制以及不同 SQL 注入类型的判断方法。

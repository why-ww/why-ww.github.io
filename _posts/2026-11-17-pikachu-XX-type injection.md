---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - xx型注入"
date: 2026-11-17

pikachu_skill: "sql-injection/xx"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - xx型注入

## 实验模块

模块：SQL注入

场景：xx型注入

## 漏洞场景

题目名称：xx型注入；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 输入 allen 后，页面实际返回 uid 2 和 allen@pikachu.com。抓包确认请求为 GET /pikachu/vul/sqli/sqli\_x.php?name=allen&submit=查询，name 位于 URL Query 中。
<br>2. 当前源码直接读取 $name=$\_GET['name'];，并拼接 $query="select id,email from member where username=('$name')";。与普通字符型不同，输入外面同时有单引号和圆括号，因此需要一起处理闭合。
<br>3. 发送 allen%27 后，实际页面出现 SQL syntax error，说明新增单引号破坏了 SQL 结构。
<br>4. 在 Repeater 中发送 allen') OR ('1'='1，URL 编码为 allen%27%29%20OR%20%28%271%27%3D%271。实际响应返回多个用户的 UID 和邮箱，说明恒真条件扩大了结果集。
<br>5. 把条件改为 allen') OR ('1'='2 后，实际响应只返回 Allen。此时右侧条件为假，但左侧原本的 username='allen' 仍为真，所以只保留正常匹配记录。

## 其他观察

“xx 型”不是新的 SQL 语法类型，而是在提醒学习者不要只背固定 Payload。测试前应先从源码或报错判断引号、括号和原条件的位置，再设计能够组成合法 SQL 的输入。若照搬普通字符型 Payload，常见结果是括号数量不匹配并触发语法错误。


## 分析与解答

### 1.

<br>问题：为什么这里需要闭合右括号？
<br>解答：原查询把用户名写成 username=('输入')。只闭合单引号仍会留下模板中的右括号，注入片段可能无法形成合法表达式，因此需要同时考虑字符串和括号。

### 2.

<br>问题：为什么恒假条件仍返回 Allen？
<br>解答：构造后的逻辑可以理解为 username=('allen') OR ('1'='2')。右侧虽然为假，但左侧仍匹配 Allen，所以结果不会完全为空。

### 3.

<br>问题：Burp 中应该观察什么？
<br>解答：比较正常、单引号、恒真和恒假四组响应的正文与记录数，并确认括号和引号经过 URL 编码后仍保持预期结构。


## 漏洞原理与修复思路

<br>核心数据流是 $\_GET['name'] → $name → username=('$name')。问题仍然是直接拼接，只是原 SQL 的括号结构让闭合方式与普通字符型不同。

<br>修复时使用预处理语句绑定 username，并对用户名进行长度和格式校验。不要依靠增加括号、替换单引号或隐藏报错来防御；这些措施无法代替参数化查询。


## 学习总结

本次靶场实验主要学习了：

<br>1. 注入测试应先理解原 SQL 的语法结构，而不是死记某个 Payload。
<br>2. 本题已经通过报错、恒真和恒假对照完成实际验证。
<br>3. 无论外层有几层括号，参数绑定都能让输入只作为数据处理。

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

<br>1. 先在输入框中输入 allen 并点击查询，页面返回 uid：2、email：allen@pikachu.com，说明输入的用户名能够正常参与后台查询。
<br>2. 随后通过浏览器开发者工具 Network 定位到请求 GET /pikachu/vul/sqli/sqli\_x.php?name=allen&submit=...，确认请求方式为 GET，name 参数位于 URL Query，响应状态为 200 OK，并将该请求发送到 Burp Repeater，以便修改参数并观察响应。
<br>3. 在 name 参数后添加单引号 %27，发送 allen%27，响应页面出现 You have an error in your SQL syntax，说明单引号改变了原 SQL 语句的语法结构，初步判断该参数可能存在 SQL 注入。
<br>4. 根据报错信息和参数位置，尝试闭合原有的字符串和括号，使用 Payload allen') OR ('1'='1，并在 Burp Repeater 中 URL 编码为 allen%27%29%20OR%20%28%271%27%3D%271 后发送；响应中返回了多个用户的信息，包括不同用户的 UID 和邮箱，说明原本只查询单个用户名的条件被改变，注入成功。
<br>5. 将恒真条件改为恒假条件，使用 Payload allen') OR ('1'='2，并在 Burp Repeater 中 URL 编码为 allen%27%29%20OR%20%28%271%27%3D%272 后发送，页面只返回原本匹配的 allen 用户信息。

## 其他观察

对照结果记录为：正常输入 allen 只返回 allen；单引号测试出现 SQL 语法错误；恒真条件 1=1 返回多个用户；恒假条件 1=2 只返回 allen。通过恒真与恒假条件的对比，确认输入参数能够影响后台 SQL 查询逻辑，验证了 XX 型 SQL 注入。


## 分析与解答

### 1.

<br>问题：为什么在 name 参数后添加单引号会导致 SQL 语法错误？
<br>解答：如果后台把输入直接拼接到 SQL 字符串中，单引号会提前改变字符串边界，使后续 SQL 片段不再符合原语法，因此出现 SQL syntax error；本题中的错误提示可作为判断参数可能可注入的信号。

### 2.

<br>问题：为什么要同时测试 1=1 和 1=2？
<br>解答：恒真条件用于观察结果集是否被扩大，恒假条件用于验证返回结果是否回到正常匹配；两者与正常请求对照，可区分偶然异常和真正的注入，并确认参数能够改变 WHERE 条件。


## 漏洞原理与修复思路

<br>这类 SQL 注入的原理是应用将外部输入直接拼接到 SQL 语句中，输入中的引号、括号和逻辑运算符被数据库当作 SQL 语法解析，从而改变原有 WHERE 条件，导致查询结果超出预期并可能读取多行数据。

<br>修复时应使用参数化查询或预编译语句，将用户输入作为数据绑定而不是 SQL 结构；同时可对输入做类型与格式校验，避免向用户显示数据库报错，并为数据库账户配置最小权限。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题展示了 SQL 注入验证的典型证据链：正常查询建立基线，单引号触发语法错误以定位可疑参数，再通过闭合字符串和括号构造恒真与恒假条件，观察结果集变化来确认注入。
<br>2. 后续学习可重点关注不同闭合方式、注释符与 URL 编码在手工注入中的作用，并理解参数化查询为何能从根本上避免输入改变 SQL 结构。

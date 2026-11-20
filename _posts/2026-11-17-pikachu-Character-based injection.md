---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - 字符型注入"
date: 2026-11-17

pikachu_skill: "sql-injection/string"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 字符型注入

## 实验模块

模块：SQL注入

场景：字符型注入（GET）

## 漏洞场景

题目名称：字符型注入（GET）；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在输入框中提交 allen，页面实际返回 uid 2 和 allen@pikachu.com。抓包后确认请求为 GET /pikachu/vul/sqli/sqli\_str.php?name=allen&submit=查询，注入参数是 URL 中的 name。
<br>2. 当前源码读取 $name=$\_GET['name'];，再拼接 $query="select id,email from member where username='$name'";。name 位于一对单引号内，因此测试时需要处理字符串引号的闭合。
<br>3. 输入 allen' 后，实际页面出现 MySQL SQL syntax error。原因是新增的单引号打破了原查询的字符串边界；这只能说明参数可疑，还需要真假条件对照确认。
<br>4. 输入 allen' AND '1'='1 后仍返回 Allen；改为 allen' AND '1'='2 后，页面提示用户名不存在。两次请求只有布尔条件不同，响应随真假变化，确认 name 能改变 SQL 查询逻辑。

## 其他观察

GET 参数中的单引号和空格通常会显示为百分号编码，这是浏览器和 Burp 的正常传输方式。若直接在地址栏使用 #，浏览器可能把它当作页面片段而不发送给服务器；需要注释符时，应在 Burp 参数编辑器中处理或把 # 编码为 %23。本题已有真假条件证据，不依赖注释符也能完成验证。


## 分析与解答

### 1.

<br>问题：为什么单引号会触发语法错误？
<br>解答：原查询已经为 username 的值准备了一对单引号。用户再输入单引号会提前结束字符串，后面的内容无法组成合法 SQL，因此 execute() 把数据库错误直接输出到页面。

### 2.

<br>问题：恒真和恒假测试为什么比只看报错更可靠？
<br>解答：报错也可能来自普通输入问题。恒真返回记录、恒假不返回记录，说明输入中的逻辑表达式确实进入了 WHERE 条件，证据更完整。

### 3.

<br>问题：Burp 中应该重点观察什么？
<br>解答：比较两次响应正文中的 uid、email 和“用户名不存在”提示，同时确认请求中的 name 已被正确 URL 编码。HTTP 200 本身不能证明查询成功或失败。


## 漏洞原理与修复思路

<br>核心数据流是 $\_GET['name'] → $name → username='$name'。输入被放进字符串常量，却没有转义或参数绑定，所以引号和逻辑运算符会被数据库解释为 SQL 结构。

<br>修复时应使用预处理语句，把 username 绑定为字符串参数；同时限制用户名长度和允许字符，并统一处理数据库错误。转义可以作为辅助措施，但不能替代参数化查询。


## 学习总结

本次靶场实验主要学习了：

<br>1. 字符型注入需要先看清输入处于单引号中的位置，再设计闭合方式。
<br>2. 本题已通过正常查询、单引号报错、恒真与恒假对照完成实际验证。
<br>3. 安全方案的重点是参数绑定，而不是依赖请求方法或前端输入限制。

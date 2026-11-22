---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - 数字型注入"
date: 2026-11-17

pikachu_skill: "sql-injection/numeric"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 数字型注入

## 实验模块

模块：SQL注入

场景：数字型注入（POST）

## 漏洞场景

题目名称：数字型注入（POST）；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 进入 SQL-Inject → 数字型注入（POST），选择用户 ID 4 并查询，页面返回 Allen 的用户信息。使用 Burp Suite 抓取请求后确认，请求方法为 POST，地址为 /pikachu/vul/sqli/sqli\_id.php，请求体包含 id=4&submit=查询。
<br>2. 当前源码先读取 $id=$\_POST['id'];，随后直接拼接 $query="select username,email from member where id=$id";。id 没有经过整数校验或参数绑定，因此请求体中的内容会直接进入 WHERE 条件。
<br>3. 在 Repeater 中分别发送 id=4 AND 1=1 和 id=4 AND 2=1，对比恒真与恒假条件。Burp 中应重点比较响应正文是否仍包含 Allen，而不是只比较 HTTP 状态码。
<br>4. 将参数改为 id=4 OR 1=1 后，实际响应中出现 vince、allen、kobe、grady、kevin、lucy、lili 等多个用户。拼接后的条件相当于 WHERE id=4 OR 1=1，恒真条件扩大了结果集，说明数字型注入成立。

## 其他观察

页面表单虽然只提供固定的下拉选项，但 Burp Repeater 可以直接修改 POST 请求体，所以前端选项限制不是安全校验。若只在浏览器页面操作而不改请求，就无法覆盖注入测试。出现 SQL 语法错误时，应先检查空格、运算符和 URL 编码；本题是数字上下文，不需要先闭合引号。


## 分析与解答

### 1.

<br>问题：为什么 id=4 OR 1=1 会返回多条记录？
<br>解答：后端最终执行的条件是 id=4 OR 1=1。1=1 永远为真，数据库会把许多原本不满足 id=4 的记录也加入结果集，而源码又使用 mysqli\_num\_rows($result)>=1 并循环输出每一行，所以页面会显示多个用户。

### 2.

<br>问题：为什么 POST 请求也会发生 SQL 注入？
<br>解答：GET 或 POST 只决定参数如何传输，不能决定参数是否安全。只要服务端把外部输入直接拼接进 SQL，POST 参数同样可以成为注入点。

### 3.

<br>问题：AND 1=1 与 AND 2=1 的对比有什么作用？
<br>解答：它们只改变布尔条件的真假。若响应随真假发生稳定变化，就能说明该参数影响了 SQL 条件；这种对照比只发送一次异常输入更可靠。


## 漏洞原理与修复思路

<br>核心逻辑是“数字参数直接拼接”：$\_POST['id'] → $id → WHERE id=$id。因为 SQL 中没有包裹 id 的引号，AND、OR 等内容会直接被数据库当作语法执行。

<br>修复时应使用预处理语句和参数绑定，例如先把 id 作为整数参数绑定到 WHERE id=?；同时在服务端验证 id 必须为合法整数。前端下拉框只能改善操作体验，不能代替服务端校验。数据库账户还应采用最小权限，并避免把详细 SQL 错误直接返回给用户。


## 学习总结

本次靶场实验主要学习了：

<br>1. 数字型注入通常不需要闭合引号，关键是观察数值参数是否被直接放入 SQL。
<br>2. Burp Repeater 可绕过前端下拉选项，使用恒真、恒假条件建立清晰对照。
<br>3. 本题已经实际验证；根本修复方式是参数化查询和服务端整数校验。

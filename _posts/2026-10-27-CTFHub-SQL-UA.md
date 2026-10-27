---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - UA注入"
date: 2026-10-27

skill: "web-sql/UA注入"
completed: true
---

# CTFHub Writeup - UA注入

## 题目类型

Web

## 题目描述

UA注入
输入点在User-Agent，试试吧

select * from news where id=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0

## 解题过程

<br>1. 访问挑战首页，页面直接回显了后端的 SQL 语句：User-Agent 被拼接进 select \* from news where id=...，并且拼接处没有引号包裹；页面下方的 ID 与 Data 为回显位。
<br>2. 将 User-Agent 设为 1，并在 URL 中附加 ?id=999 请求，页面仍显示 select \* from news where id=1、ID: 1、Data: ctfhub，说明 URL 参数没有进入 SQL，后端读取的是 User-Agent 头。
<br>3. 使用 -1 union select 1,2 判断列数，回显 ID=1、Data=2，确定为 2 列；使用 -1 union select 1,database() 回显数据库名 sqli；使用 1 and sleep(2) 时响应约 2.23 秒，确认 and 可正常执行。
<br>4. 由于当前环境的表名、列名是随机串，改为查询 information\_schema：先用 group\_concat(table\_name) 从 information\_schema.tables 取得 vadwspthtq,news，再查询 information\_schema.columns 得到列名 qlvyppbxfi；最后使用 -1 union select 1,qlvyppbxfi from vadwspthtq 读取数据，Data 回显 ctfhub\{cf320a2ccf72e05607118f0e\}。

## 疑问与解答

### 1.

<br>问题：为什么注入点是 User-Agent 而不是 URL 参数？
<br>解答：从页面回显看，后端把 User-Agent 原样拼进了 select \* from news where id=...；而附加 ?id=999 后 SQL 语句仍显示 id=1，说明 URL 参数未被使用，实际可控输入是 HTTP 请求头 User-Agent。这类注入常被称为 UA 注入。

### 2.

<br>问题：联合查询时为什么使用 -1 union select 而不是 1 union select？
<br>解答：原查询本身会返回一行数据，如果前半段能查到结果，页面可能优先显示原查询的行；把前半段设为 -1 等不存在的值，可以让原查询为空，从而只回显 union 后半段构造的结果，便于定位回显列。

### 3.

<br>问题：为什么必须查询 information\_schema？
<br>解答：information\_schema 是 MySQL 提供的元数据库，tables 与 columns 表分别记录库中的表名和列名。当业务表名、列名被随机化时，无法直接猜表，需要先通过 information\_schema.tables 和 information\_schema.columns 枚举结构，再用 union 查询目标列。


## 本题的核心逻辑：



<br>本题把 User-Agent 请求头直接拼接进 SQL 语句，且拼接位置没有引号包裹，因此 User-Agent 成为注入参数；页面又直接回显 SQL 语句、ID 和 Data，属于有回显的联合查询注入场景。

<br>联合注入的基本流程是：先用 union select 数字判断列数与回显位，再把 database() 等函数放到回显列获取信息；确认可执行 and 后，还可以配合时间函数验证语句执行。由于当前环境的表名、列名随机，需要转向 information\_schema 完成库表列枚举，最后读取目标字段。


## 笔记

这道题主要学习了：

<br>1. HTTP 请求头同样可能成为 SQL 注入入口。判断注入点时，应比较不同参数或请求头的回显变化，确认哪一处输入真正进入了后端 SQL 语句。
<br>2. 有回显的注入优先使用联合查询：先确定列数，再确定回显列，随后把 database()、group\_concat() 等放入回显位置。遇到随机表名、列名时，应通过 information\_schema 枚举结构，而不是盲目猜表。

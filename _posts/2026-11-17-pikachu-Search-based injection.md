---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - 搜索型注入"
date: 2026-11-17

pikachu_skill: "sql-injection/search"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 搜索型注入

## 实验模块

模块：SQL注入

场景：搜索型注入

## 漏洞场景

题目名称：搜索型注入；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在搜索框输入 allen，页面实际返回 username、uid 2 和 allen@pikachu.com。抓包后确认请求为 GET /pikachu/vul/sqli/sqli\_search.php，搜索词由 name 参数传递。
<br>2. 当前源码读取 $name=$\_GET['name'];，随后拼接 $query="select username,id,email from member where username like '%$name%'";。输入位于 LIKE 两侧百分号之间，没有过滤或参数绑定。
<br>3. 在 Burp Repeater 中把 name 改为 %' OR '1'='1' # 并发送。若在原始 URL 中编辑，应把 # 编码为 %23，避免它被客户端当作片段丢弃。
<br>4. 实际响应返回 Vince、allen、Kobe、Grady 等多个用户。拼接后，输入先闭合 LIKE 字符串，再加入恒真 OR 条件并注释剩余内容，查询范围因此从单个用户名扩大为多条记录。

## 其他观察

搜索型注入与普通字符型注入的区别主要在原查询使用 LIKE '%输入%'。百分号是 LIKE 的通配符，可以匹配任意长度的字符；但真正造成越权查询的是引号闭合、OR 条件和注释符共同改变了 SQL 结构。若 Burp 中没有返回预期结果，应先确认 %、空格、单引号和 # 是否被正确编码。


## 分析与解答

### 1.

<br>问题：为什么普通搜索只返回 Allen，而构造参数后返回多条记录？
<br>解答：正常 SQL 只匹配用户名中包含 allen 的记录。构造参数闭合了 LIKE 字符串并加入 OR '1'='1'，恒真条件使更多记录满足 WHERE 条件。

### 2.

<br>问题：# 在这里有什么作用？
<br>解答：MySQL 把 # 后面的内容当作注释。它用于屏蔽模板原本追加的 %'，避免多余字符破坏注入后的语法。通过 URL 发送时通常要写成 %23。

### 3.

<br>问题：Burp 中应该观察什么？
<br>解答：比较正常搜索和构造请求的响应正文、记录数量与用户名列表，同时确认服务器实际收到的 name 参数。不要只看状态码，因为两种请求通常都返回 200。


## 漏洞原理与修复思路

<br>核心数据流是 $\_GET['name'] → $name → LIKE '%$name%'。用户输入被当作 SQL 字符串的一部分，导致引号、逻辑条件和注释符都能改变查询。

<br>修复时应使用 LIKE ? 的参数化查询，并由程序把普通搜索词组成 %关键词% 后再绑定。若业务允许用户输入字面百分号或下划线，还应按需求转义 LIKE 通配符。数据库错误不应直接展示，数据库账户也应采用最小权限。


## 学习总结

本次靶场实验主要学习了：

<br>1. 搜索型注入需要同时理解字符串闭合和 LIKE 通配符。
<br>2. 本题已实际观察到结果集由一条扩大为多条。
<br>3. 参数化 LIKE 查询是根本修复方式，单纯删除百分号并不能解决 SQL 拼接问题。

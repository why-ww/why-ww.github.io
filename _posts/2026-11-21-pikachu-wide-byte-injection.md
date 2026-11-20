---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - 宽字节注入"
date: 2026-11-21

pikachu_skill: "sql-injection/wide-byte"
completed: false
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 宽字节注入

## 实验模块

模块：SQL注入

场景：宽字节注入

## 漏洞场景

题目名称：宽字节注入；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对当前部署源码和页面入口，没有实际发送宽字节 Payload，也没有记录查询结果。

## 测试过程

<br>1. 当前页面为 POST /pikachu/vul/sqli/sqli\_widebyte.php，请求体参数是 name 和 submit。连接建立时 connect() 先调用 mysqli\_set\_charset($link,'utf8')。
<br>2. 页面先执行 $name=escape($link,$\_POST['name']);，escape() 内部使用 mysqli\_real\_escape\_string()；随后拼接 $query="select id,email from member where username='$name'";。
<br>3. 关键问题出现在查询前：源码又执行 SET character\_set\_client=gbk。也就是说，转义时按 UTF-8 连接处理，数据库解析输入时却按 GBK 客户端字符集理解，字符集不一致为宽字节绕过创造了条件。
<br>4. 建议在 Burp Repeater 的原始 POST 请求体中使用 name=%df%27%20OR%201%3D1%23&submit=1。URL 解码后，单引号通常会被转义为反斜杠加单引号；在 GBK 解析下，前面的 0xDF 可能与反斜杠字节 0x5C 组成一个双字节字符，使后面的单引号重新获得闭合作用。
<br>5. 如果绕过成立，理论上 OR 1=1 会让页面返回多条 uid/email；如果失败，可能显示用户名不存在或 SQL 错误。Burp 中应确认原始字节没有被浏览器、编辑器或代理转换成 Unicode 字符。本次未实际发送，所以不记录任何成功响应。

## 其他观察

宽字节注入依赖具体字符集和字节序列，不是输入一个普通汉字就会触发。常见失败原因包括：Payload 被重复 URL 编码、%df%27 被工具重新编码、数据库连接字符集与预期不同，或测试时没有在原始请求体中保留字节。建议先保存正常请求，再逐项比较编码和服务器行为。


## 分析与解答

### 1.

<br>问题：已经调用 mysqli\_real\_escape\_string()，为什么仍可能注入？
<br>解答：转义函数依赖连接字符集。此处转义时使用 UTF-8，查询前却把客户端字符集改成 GBK；同一组字节在两个阶段被不同方式解释，反斜杠可能被“吃进”一个双字节字符。

### 2.

<br>问题：为什么 Payload 要在 Burp 原始请求中检查？
<br>解答：宽字节利用关注的是实际字节，而不是屏幕上看到的字符。任何自动转码或重复编码都会改变字节序列，使原理不再成立。

### 3.

<br>问题：Burp 中应该观察什么？
<br>解答：确认请求体中的百分号编码只解码一次，比较正常请求与测试请求的记录数、错误信息和响应长度，并保留原始请求作为证据。


## 漏洞原理与修复思路

<br>核心问题不是“转义函数完全无效”，而是连接字符集管理错误：escape() 与数据库解析阶段使用了不一致的字符集，导致转义字节可能被重新组合。

<br>修复时优先使用预处理语句和参数绑定，并在连接建立后通过 mysqli\_set\_charset() 统一设置正确字符集，之后不要再用 SET character\_set\_client 单独改变解析方式。避免依赖手工 addslashes 或字符替换，并保持应用、连接与数据表字符集策略一致。


## 学习总结

本次靶场实验主要学习了：

<br>1. 宽字节注入来自字符集解释不一致与 SQL 拼接的组合问题。
<br>2. 当前源码确认先转义、后切换 GBK 的危险顺序，但本篇尚未实操。
<br>3. 参数化查询和一致的连接字符集是正确防护方式。

---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - 布尔盲注"
date: 2026-11-21

pikachu_skill: "sql-injection/boolean-blind"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 布尔盲注

## 实验模块

模块：SQL注入

场景：布尔盲注

## 漏洞场景

题目名称：盲注（base on boolian）；平台：Pikachu；方向：Web。


## 测试过程

<br>1. 当前页面为 GET /pikachu/vul/sqli/sqli\_blind\_b.php，输入参数是 name。源码直接读取 $name=$\_GET['name'];，再拼接 $query="select id,email from member where username='$name'";。
<br>2. 与普通字符型页面不同，这里使用 mysqli\_query()，不会通过 execute() 把 SQL 错误直接打印出来。查询恰好返回一条记录时显示 uid 和 email；其他情况统一显示“您输入的username不存在”。因此可以把页面差异当作真假信号。
<br>3. 在 Burp Repeater 中先发送 name=kobe&submit=1 建立正常基线，再比较 kobe' AND 1=1# 与 kobe' AND 1=2#。在 URL 中，单引号、空格和 # 应分别正确编码，尤其 # 通常要写成 %23。
<br>4. 若第一条仍显示 kobe 的 uid/email，而第二条显示用户名不存在，就说明真假条件影响了查询。通过两组响应的稳定差异判断条件真假。
<br>5. 在确认真假通道后，可继续用条件 kobe' AND ASCII(SUBSTRING(DATABASE(),1,1))=112# 猜测数据库名第一个字符是否为 p。实际学习时应一次只改变一个位置，并记录每次响应中的固定文本或长度差异，并用响应差异逐步判断。

## 其他观察

布尔盲注的“盲”表示页面不直接展示数据库错误或目标数据，但仍存在可比较的真假差异。若正常用户名本身不存在，左右两组都会显示失败，所以应先确认基线用户名真实存在。网络缓存、登录状态或动态页面内容也可能干扰响应长度，优先比较稳定提示文本。


## 分析与解答

### 1.

<br>问题：没有 SQL 报错，为什么还能判断注入？
<br>解答：攻击者可以把想知道的问题写成布尔条件，再根据页面显示“存在”或“不存在”推断真假。错误回显不是 SQL 注入成立的必要条件。

### 2.

<br>问题：为什么要先测试 1=1 和 1=2？
<br>解答：这组条件能验证页面是否真的提供稳定真假通道。若两次响应没有可重复差异，就不应直接进入逐字符猜测。

### 3.

<br>问题：Burp 中应该记录什么？
<br>解答：记录完整请求、Payload、响应中的固定提示、正文长度和重复测试结果。布尔盲注依赖很多次比较，清晰记录可以减少把偶然差异当作证据的风险。


## 漏洞原理与修复思路

<br>核心数据流仍是 $\_GET['name'] → username='$name'。区别只是 mysqli\_query() 隐藏了错误，而页面通过“有一条记录 / 没有一条记录”泄露了布尔结果。

<br>修复时使用预处理语句绑定 name，并为查询结果设计统一、不过度泄露的提示。仅关闭错误回显只能让注入变成盲注，不能消除漏洞。还应限制数据库账户权限并记录异常重复查询。


## 学习总结

本次靶场实验主要学习了：

<br>1. 布尔盲注通过稳定的真假页面差异逐步推断信息。
<br>2. 当前源码确认 name 被直接拼接。
<br>3. 正确学习顺序是先建立基线、确认真假通道，再尝试逐字符条件。

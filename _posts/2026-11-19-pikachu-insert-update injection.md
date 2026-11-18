---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - “insert/update”注入"
date: 2026-11-19

pikachu_skill: "sql-injection/insert-update"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - “insert/update”注入

## 实验模块

模块：SQL注入

场景：“insert/update”注入

## 漏洞场景

题目名称：“insert/update”注入；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 打开 Pikachu 漏洞练习平台，进入 SQL-Inject → “insert/update” 注入。页面显示当前会员的个人资料，并提供修改个人信息的表单。
<br>2. 使用 Burp Suite 拦截修改资料时产生的 HTTP 请求。请求方式为 POST，地址为 /pikachu/vul/sqli/sqli\_iu/sqli\_edit.php，请求体包含 sex=1、phonenum=12345678901、add=test、email=test4@example.com、submit=submit，其中 add 对应住址字段。
<br>3. 通过分析后端 PHP 代码，发现程序直接将 POST 参数拼接到 UPDATE 语句中：$getdata=$\_POST; $query="update member set sex='\{$getdata\['sex'\]\}',phonenum='\{$getdata\['phonenum'\]\}',address='\{$getdata\['add'\]\}',email='\{$getdata\['email'\]\}' where username='\{$\_SESSION\['sqli'\]\['username'\]\}'"; $result=execute($link, $query);。其中 add 参数未经转义，直接进入 SQL 语句的字符串部分，因此可以修改 add 参数测试 SQL 注入是否成立。
<br>4. 在 Burp Repeater 中修改 POST 请求的 add 参数，构造能够改变 UPDATE 语句执行逻辑的测试输入。第一次构造的请求出现了 SQL syntax 错误；检查 SQL 语句的引号闭合情况和后续语句结构后，调整参数并重新发送请求。
<br>5. 最终请求执行成功。POST 请求返回 HTTP 302 Found，响应头中的 Location 指向 sqli\_mem.php；浏览器跟随重定向发送 GET 请求，GET 请求返回 HTTP 200 OK。重新查看会员中心，发现住址字段由原来的 test 变成了 sqli\_true，其他资料保持不变，由此证明修改后的参数成功影响了数据库 UPDATE 操作，SQL 注入验证成功。

## 分析与解答

### 1.

<br>问题：为什么 add 参数能够形成 SQL 注入？
<br>解答：因为 add 被直接拼接到 address='...' 这样的字符串位置，输入中的引号等内容可能改变原 SQL 语句的结构。如果程序没有转义或参数化处理，攻击者就能让 UPDATE 语句按不同条件执行。

### 2.

<br>问题：构造 UPDATE 注入时，为什么要关注引号闭合和后续语句结构？
<br>解答：注入点位于字符串常量内部时，需要先让输入闭合前面的引号，再构造合法的 SQL 片段，并处理后面的引号和 WHERE 子句。若闭合不正确，数据库会报 SQL syntax 错误，因此语法错误可用于辅助判断语句结构。

### 3.

<br>问题：为什么 POST 返回 302 后还要查看会员中心？
<br>解答：修改资料成功后，服务端可能通过 302 重定向回会员资料页。最终是否成功执行 UPDATE，需要结合重定向后的页面或数据库中的字段变化判断；本题观察到住址字段变为 sqli\_true，说明修改操作确实生效。


## 漏洞原理与修复思路

<br>该场景的漏洞本质是 SQL 语句拼接：后端把 sex、phonenum、add、email 等 POST 参数直接放入 UPDATE 语句的字符串中，add 参数未经过转义就进入 address 字段位置。攻击者可以通过闭合引号、插入 SQL 片段来改变 UPDATE 的执行逻辑，而不仅是修改住址内容。

<br>修复时应使用预处理语句和参数绑定，让用户输入作为数据而不是 SQL 代码参与执行；同时对字段格式做白名单或类型校验，并遵循最小权限原则配置数据库账号。还应避免向用户暴露详细 SQL 错误信息，以增加盲注和结构探测的难度。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题展示了 INSERT/UPDATE 类 SQL 注入的典型路径：修改资料功能把表单参数拼接到 UPDATE 语句中，add 等字符串字段未转义时可能被用来改变语句结构。验证时既要关注请求是否成功，也要观察数据库字段是否发生了预期变化。
<br>2. 后续学习可重点掌握引号闭合、注释符和 WHERE 子句对 UPDATE 注入构造的影响，并对比报错回显、布尔条件和时间盲注等验证方式。同时应理解预处理语句如何从根源上避免 SQL 拼接漏洞。

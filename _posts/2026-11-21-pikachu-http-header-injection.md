---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - HTTP Header注入"
date: 2026-11-21

pikachu_skill: "sql-injection/header"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - HTTP Header注入

## 实验模块

模块：SQL注入

场景：HTTP Header注入

## 漏洞场景

题目名称：HTTP Header注入；平台：Pikachu；方向：Web。


## 测试过程

<br>1. 当前入口为 /pikachu/vul/sqli/sqli\_header/sqli\_header\_login.php。登录表单中的 username 和 password 会先经过 escape()，登录成功后再跳转到 sqli\_header.php；页面提示的本地测试账户为 admin/123456。
<br>2. sqli\_header.php 直接读取 $\_SERVER['REMOTE\_ADDR']、$\_SERVER['HTTP\_USER\_AGENT']、$\_SERVER['HTTP\_ACCEPT'] 和 $\_SERVER['REMOTE\_PORT']，然后拼接 INSERT INTO httpinfo(userid,ipaddress,useragent,httpaccept,remoteport) VALUES(...)。源码中原本对这些值调用 escape() 的代码已经被注释。
<br>3. 先正常登录，在 Burp Proxy 中拦截进入 sqli\_header.php 的 GET 请求并发送到 Repeater。保持登录 Cookie 不变，只修改 User-Agent；先用普通标记 header-probe 建立基线，再用单引号 header-probe' 检查是否触发 SQL syntax error。
<br>4. 进一步可将 Payload 可把 User-Agent 设置为 header-probe','text/plain','12345')#。按当前 SQL 结构推导，它会尝试提前结束 VALUES，并注释模板后续内容。该 Payload 会写入本地测试数据库，只应在隔离靶场中使用；完成后再用只读查询确认测试标记。
<br>5. Burp 中应比较普通请求与测试请求的响应正文、长度和数据库错误。若要确认是否写入，应使用只读 SELECT 检查 httpinfo 表中的测试标记；没有数据库证据时不能只凭 HTTP 200 判断成功。

## 其他观察

check\_sqli\_login() 还会直接把 ant[uname] 和 ant[pw] Cookie 拼接进 SELECT，这也是当前源码中的另一处可疑输入点。但本实验先聚焦 User-Agent 和 Accept 进入 INSERT 的主路径，避免同时修改 Cookie 导致登录校验失败。Header 注入并不代表“请求头天然危险”，真正问题仍是服务端把请求头当成可信数据直接拼接 SQL。


## 分析与解答

### 1.

<br>问题：为什么登录表单做了转义，页面仍然存在 SQL 注入？
<br>解答：登录参数和登录后的请求头是不同数据源。username、password 被转义，并不能保护后续直接进入 INSERT 的 User-Agent、Accept 等字段。

### 2.

<br>问题：为什么只改 User-Agent 就可能影响数据库？
<br>解答：浏览器发送的 User-Agent 最终进入 $\_SERVER['HTTP\_USER\_AGENT']，源码没有转义或绑定，直接把它放入 VALUES 的第三个字符串位置，因此其中的引号可能改变 SQL 结构。

### 3.

<br>问题：Burp 中最重要的观察点是什么？
<br>解答：确认登录 Cookie 仍有效、实际发送的 Header 与预期一致，并用响应差异或只读数据库查询验证结果。页面状态码相同并不能排除 SQL 错误或写入行为。


## 漏洞原理与修复思路

<br>核心数据流是 HTTP Header → $\_SERVER → INSERT VALUES。请求头来自客户端，同样是不可信输入；直接拼接会让其中的单引号、逗号和注释符被数据库解释。

<br>修复时应对 httpinfo 的所有字段使用预处理语句和参数绑定，并限制 User-Agent、Accept 等字段长度。登录 Cookie 的查询也应改为参数化查询。数据库账户采用最小权限，详细错误写入服务端日志，不能只给某几个表单字段调用 escape() 就认为整条链路安全。


## 学习总结

本次靶场实验主要学习了：

<br>1. SQL 注入入口不仅是表单参数，请求头和 Cookie 也可能进入数据库。
<br>2. 当前源码确认 HTTP Header 被直接拼接到 INSERT。
<br>3. 验证应使用本地隔离环境，并以只读查询确认写入结果。

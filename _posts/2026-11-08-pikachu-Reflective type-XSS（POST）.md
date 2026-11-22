---
layout: writeup
tags: [pikachu, XSS]

title: "Pikachu Lab Report - 反射型 XSS（POST）"
date: 2026-11-08

pikachu_skill: "xss/reflected-post"
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 反射型 XSS（POST）

## 实验模块

模块：XSS

场景：反射型 XSS（POST）

## 漏洞场景

题目名称：反射型 XSS（POST）；平台：Pikachu；方向：Web。

完成状态依据旧稿中保留的登录、提交和弹窗记录；本次整理没有重新发送攻击请求。源码复核对象为 `vul/xss/xsspost/xss_reflected_post.php`。

## 测试过程

<br>1. 既有记录进入“反射型 XSS（POST）”后，先通过靶场登录页进入实验页面。当前源码调用 `check_xss_login($link)` 检查登录状态，未登录时会跳转到 `post_login.php`。
<br>2. 在实验输入框中提交 `<script>alert(1)</script>`，旧稿记录浏览器弹出内容为 `1` 的对话框，说明 POST 请求体中的内容被当成脚本执行。
<br>3. 当前源码读取 `$_POST['message']`。输入不为空且不等于 `kobe` 时，程序把它直接拼入 `<p class='notice'>who is ...</p>`，再通过 `echo $html` 输出。
<br>4. POST 参数通常不显示在地址栏中。验证时应在开发者工具或 Burp 中检查请求体里的 `message` 与 `submit` 字段，并在响应正文中定位反射位置。

## 源码数据流

<br>1. 来源（source）：POST 请求体中的 `message`，由 `$_POST['message']` 读取。
<br>2. 前置条件：会话必须通过 `check_xss_login`；登录控制只限制谁能访问页面，不会净化输入。
<br>3. 处理：程序仅做空值和 `kobe` 比较，没有 HTML 编码。
<br>4. 输出点（sink）：输入进入 `<p>` 标签正文并随当前响应返回，页面刷新或重新访问时不会自动保留，所以它属于反射型而不是存储型 XSS。

## 验证观察点与常见问题

<br>1. 地址栏没有测试内容并不代表没有输入；POST 数据应在请求体中查看。
<br>2. 若提交后被跳回登录页，应先确认靶场登录 Cookie 是否仍有效，不要把鉴权跳转误判为过滤成功。
<br>3. 只看到输入回显还不能证明脚本已执行，应继续确认响应上下文和浏览器行为；旧稿中的弹窗是本题的实际执行证据。
<br>4. “使用 POST”不是防护。请求方法改变的是传输位置，不会自动编码输出。

## 分析与解答

### 1. POST 型与 GET 型反射 XSS 有什么区别？

主要区别是输入位置：GET 参数位于 URL，POST 参数通常位于请求体。两者的漏洞条件相同，都是当前请求的可控数据未经正确编码就进入响应页面。

### 2. 登录检查能阻止 XSS 吗？

不能。登录检查可以缩小可访问范围，但登录用户提交的内容仍是不可信数据。只要输出点缺少编码，登录后的页面仍可能执行注入脚本。

### 3. 应该怎样修复？

在 `<p>` 文本节点输出前进行 HTML 实体编码，并让模板引擎默认转义。服务端可以补充长度和格式校验；CSP、HttpOnly Cookie 等措施用于纵深防御，但不能替代输出编码。

## 学习总结

<br>1. 本题已经实际验证，数据流是 `POST message → PHP 拼接 → 当前 HTML 响应 → 浏览器执行`。
<br>2. 测试 POST 输入时要检查请求体、登录状态和响应上下文，不能只看地址栏。
<br>3. 鉴权与 XSS 防护解决的是不同问题，已登录页面同样必须安全处理输出。

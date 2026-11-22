---
layout: writeup
tags: [pikachu, 敏感信息泄露]

title: "Pikachu Lab Report - I can see your ABC"
date: 2026-11-22

pikachu_skill: "information-disclosure/abc"
completed: false
module: "敏感信息泄露"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - I can see your ABC

## 实验模块

模块：敏感信息泄露

场景：I can see your ABC

## 漏洞场景

题目名称：I can see your ABC；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 findabc.php 和 abc.php，但没有使用测试账号登录，也没有记录浏览器历史、Cookie 或响应差异。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前入口为 /pikachu/vul/infoleak/findabc.php。登录表单使用 GET 方法，因此 username、password 和 submit 会出现在 URL 查询字符串中，可能被浏览器历史、服务器日志、代理记录或 Referer 保存。
<br>2. 查看页面源码可以发现 HTML 注释“测试账号:lili/123456”。这组凭据不会显示在普通页面文本中，但会随 HTML 响应发送给所有访问者，因此源码注释不能用于存放账号、密码或内部说明。
<br>3. 登录失败时，代码会先检查用户名是否存在：存在则显示“密码错误”，不存在则显示“账号错误”。建议只使用题目自带用户名和明显不存在的本地标记账号比较响应；不同提示可被用于枚举有效用户名。本篇没有发送测试请求。
<br>4. 登录成功后，源码设置 abc[uname] 为原始用户名，abc[pw] 为密码的 MD5 值，有效期约 10 小时。setcookie() 没有设置 Secure、HttpOnly 或 SameSite 属性；这些认证相关信息会暴露在客户端 Cookie 中。MD5 摘要也不应被当成可以公开的安全凭据。
<br>5. 跳转后的 abc.php 只处理退出操作，没有看到对 abc Cookie 或 Session 的登录校验。建议使用未登录浏览器直接访问 abc.php，观察是否仍能查看页面内容；本篇没有实际访问，因此不声称已经绕过登录。

## 其他观察

本题不是单一泄露点，而是多处小问题叠加：GET 传递密码、源码注释暴露测试账号、错误提示枚举用户名、客户端 Cookie 保存身份信息，以及目标页缺少明显的访问校验。敏感信息泄露往往不需要复杂 Payload，查看 URL、响应源码、Cookie 和错误信息就能发现。


## 分析与解答

### 1.

<br>问题：密码输入框使用 type=password，为什么密码仍会泄露？
<br>解答：type=password 只负责把屏幕上的字符显示成圆点。表单使用 GET 时，真实密码仍会进入 URL，并可能被历史记录、日志和中间设备保存。

### 2.

<br>问题：写在 HTML 注释里的测试账号，用户看不到就安全吗？
<br>解答：不安全。注释仍属于服务器返回的 HTML，查看页面源码或开发者工具即可读取。任何发送到客户端的秘密都不能依赖“界面没有显示”来保护。

### 3.

<br>问题：分别提示账号错误和密码错误有什么风险？
<br>解答：攻击者可以根据提示判断用户名是否存在，缩小后续口令测试或社会工程的目标范围。认证失败提示应尽量统一。


## 漏洞原理与修复思路

<br>核心问题是敏感数据跨越了不必要的信任边界：凭据进入 URL，测试账号进入客户端源码，账号存在性进入错误提示，密码摘要进入可读 Cookie，而目标页面又缺少明确的服务端访问校验。

<br>修复时应使用 POST 传递登录表单并全站启用 HTTPS；删除客户端源码中的凭据和内部注释，统一认证失败提示。服务端使用 Session 保存登录状态，Cookie 只保存随机会话标识，并设置 Secure、HttpOnly、SameSite 和合理有效期。密码应使用 password\_hash() 等专用算法存储，所有受保护页面都必须在服务端重新验证 Session。


## 学习总结

本次靶场实验主要学习了：

<br>1. 敏感信息可能从 URL、HTML 注释、错误提示和 Cookie 多个位置泄露。
<br>2. 当前源码确认存在多条泄露路径和访问校验疑点，但本篇尚未实际登录或访问目标页。
<br>3. 防护重点是减少敏感数据暴露、统一错误提示，并在服务端正确维护和校验登录状态。

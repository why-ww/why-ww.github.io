---
layout: writeup
tags: [pikachu, URL重定向]

title: "Pikachu Lab Report - 不安全 URL 重定向"
date: 2026-11-23

pikachu_skill: "url-redirect/redirect"
completed: true
module: "URL 重定向"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 不安全 URL 重定向

## 实验模块

模块：URL 重定向

场景：不安全 URL 重定向

## 漏洞场景

题目名称：不安全 URL 重定向；平台：Pikachu；方向：Web。


## 测试过程

<br>1. 当前入口为 /pikachu/vul/urlredirect/urlredirect.php。页面中正常链接使用 url=unsafere.php 返回模块概述，特殊值 url=i 则只显示一段文字，不执行跳转。
<br>2. 源码通过 $url=$\_GET['url'] 取得参数。除 url=i 外，其他任意非空值都会直接进入 header("location:{$url}")，没有检查协议、主机、端口或是否属于本站。
<br>3. 先点击 url=unsafere.php，使用浏览器开发者工具或 Burp 确认正常响应中的 Location 指向站内页面。然后把请求发送到 Repeater，将 url 改为无害公共地址 https://example.com/ 并禁止工具自动跟随重定向。
<br>4. 若响应状态为 3xx，且 Location 完整等于外部地址，就能证明用户可控制跳转目标。启用自动跟随时浏览器会直接离开靶场，容易错过第一跳响应，因此应优先查看原始响应头。测试时保存原始请求与响应作为记录。
<br>5. 还应分别检查相对路径、以 // 开头的协议相对 URL、大小写不同的协议和经过编码的地址。验证目的只是确认校验边界，不要制作仿冒登录页，也不要把可控跳转链接发送给他人。

## 其他观察

header.php 开头调用了 ob\_start()，因此即使页面模板已经产生内容，后续 Location 头仍可能被缓冲机制允许发送。开放重定向通常不会直接读取服务器数据，但可信域名可被用作钓鱼跳板，还可能泄露 URL 中的 OAuth code、token 等参数，或者绕过只检查首个域名的安全策略。


## 分析与解答

### 1.

<br>问题：为什么跳转到 example.com 就能证明漏洞？
<br>解答：安全的站内跳转不应让客户端参数决定任意外部主机。原始响应中的 Location 指向外域，已经证明信任边界失效，不需要搭建仿冒页面。

### 2.

<br>问题：浏览器最终打开外部页面，为什么还要看第一跳响应？
<br>解答：自动跟随会隐藏服务端最关键的 3xx 状态与 Location。检查第一跳可以区分服务端重定向、前端脚本跳转和普通链接跳转，也能准确记录参数怎样进入响应头。

### 3.

<br>问题：只判断 URL 中包含本站域名是否足够？
<br>解答：不够。恶意主机名、用户名信息、子域名和编码差异都可能骗过字符串包含判断。应解析 URL 后比较规范化的 scheme、host 和 port，或直接使用服务端固定映射。


## 漏洞原理与修复思路

<br>核心数据流是 GET 参数 url → $url → Location 响应头。应用把用户输入当成可信跳转目标，浏览器因此会从 Pikachu 域名跳向任意地址。受害者首先看到的是可信域名，这会增强恶意链接的迷惑性。

<br>最稳妥的修复是只接收短 ID，例如 next=profile，再由服务端映射到固定站内路径。如果业务必须跳转外域，应使用 parse\_url() 解析并执行精确的协议、主机和端口白名单，拒绝协议相对 URL、用户信息、反斜线与异常编码；校验后再生成规范化地址。敏感令牌不应放在可能被重定向转发的 URL 中。


## 学习总结

本次靶场实验主要学习了：

<br>1. 开放重定向的判断依据是客户端能否控制 Location 指向站外目标。
<br>2. 当前源码除特殊值 i 外直接使用 url 参数发送 Location。
<br>3. 防护首选服务端固定映射；确需外跳时，应解析并精确校验规范化后的目标地址。

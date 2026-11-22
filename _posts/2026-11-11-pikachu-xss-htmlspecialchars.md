---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - xss之htmlspecialchars"
date: 2026-11-11

skill: ""
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - xss之htmlspecialchars

## 实验模块

模块：XSS

场景：xss之htmlspecialchars

## 漏洞场景

题目名称：xss之htmlspecialchars；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在输入框中输入 111'"\<\> 并点击 submit，然后按 F12 打开 Elements 面板。观察到的生成 HTML 为 \<a href="111&quot;&lt;&gt;"\>111'"\<\>\</a\>：双引号被编码为 &quot;，小于号和大于号分别被编码为 &lt; 与 &gt;，单引号仍然保留。
<br>2. 记录中的分析认为，输入被放入 a 标签的 href 属性中，且原属性使用单引号包裹；由于单引号未被编码，随后尝试用单引号提前结束属性。
<br>3. 构造并提交 Payload：test' onclick='alert(1)。在 Elements 面板中看到浏览器解析后的 DOM 为 \<a href="test" onclick="alert(1)"\>test' onclick='alert(1)\</a\>，输入中的 onclick 成为独立的 HTML 事件属性。
<br>4. 关闭开发者工具后点击页面中生成的蓝色链接，浏览器弹出 1，说明注入的 JavaScript 被执行。

## 分析与解答

### 1.

<br>问题：为什么 htmlspecialchars 处理后仍可能发生 XSS？
<br>解答：htmlspecialchars 只按指定 flags 编码部分 HTML 特殊字符；若没有使用 ENT\_QUOTES，单引号可能保持原样。在单引号包裹的属性中，单引号可提前闭合属性，后续内容就可能被解析为新的属性或标签。

### 2.

<br>问题：本题为什么不需要插入 \<script\> 标签？
<br>解答：输入落在 HTML 属性上下文，闭合 href 属性后可以注入 onclick 等事件属性；点击该链接时事件处理程序中的 JavaScript 就会执行。

### 3.

<br>问题：如何判断 XSS 的注入上下文？
<br>解答：可先提交包含引号、尖括号等特殊字符的探针，查看 Elements 面板中这些字符被编码、被丢弃还是原样保留，从而判断输入进入的是 HTML 文本、属性、URL 还是脚本上下文。


## 漏洞原理与修复思路

<br>本题的关键点是输出编码不完整：双引号、\<、\> 被实体编码，但单引号未处理；在单引号包裹的属性值中，单引号可结束属性，空格后的 onclick='alert(1)' 被浏览器当作新属性解析。

<br>修复时应按输出上下文进行编码：HTML 属性值使用 ENT\_QUOTES 的 htmlspecialchars（并指定 UTF-8 等编码），同时优先使用 allowlist 校验和对属性值加引号，避免把不可信输入直接拼进事件属性或 URL。


## 学习总结

本次靶场实验主要学习了：

<br>1. 测试特殊字符并观察 Elements 中的编码结果，是判断 XSS 上下文和过滤策略的起点。
<br>2. HTML 属性上下文中的 XSS 不一定需要 \<script\>，闭合属性后注入事件处理器即可在交互时触发。
<br>3. htmlspecialchars 并非万能，必须结合 flags 与输出位置使用；对属性值采用 ENT\_QUOTES、正确字符集和上下文编码，才能避免单引号闭合导致的注入。

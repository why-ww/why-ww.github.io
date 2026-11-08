---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - DOM型xss-x"
date: 2026-11-09

skill: ""
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - DOM型xss-x

## 实验模块

模块：XSS

场景：DOM型xss-x

## 漏洞场景

题目名称：DOM型xss-x；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在输入框中输入 Payload：\#' onclick='alert(1)，然后点击「请说出你的伤心往事」按钮。浏览器通过 GET 请求提交数据，地址栏出现类似 xss\_dom\_x.php?text=%23%27+onclick%3D%27alert(1) 的 URL，说明输入内容进入 text 参数。
<br>2. 点击页面下方文字「有些费尽心机想要忘记的事情，后来真的就忘掉了」，该链接执行页面中的 domxss() 函数。该函数从 URL 读取 text 参数，经过解码和处理后，将内容拼接到 HTML 超链接中。
<br>3. 打开浏览器开发者工具（F12），进入 Elements 面板，查看 div id="dom" 中生成的内容，可见类似 \<a href="\#" onclick="alert(1)"\> 就让往事都随风，都随风吧 \</a\> 的结构。原本的 href 属性被用户输入中的单引号闭合，同时注入了新的 onclick 事件属性。
<br>4. 回到页面，点击新生成的蓝色超链接「就让往事都随风，都随风吧」，浏览器成功弹出内容为 1 的提示框，说明注入的 JavaScript 代码已经执行，完成 DOM 型 XSS-X 漏洞验证。

## 分析与解答

### 1.

<br>问题：为什么在地址栏看到 text 参数后，还需要点击页面下方文字？
<br>解答：URL 中的 text 参数只是数据的来源，本题的 domxss() 函数会在点击该链接时读取 URL 参数，并把处理后的内容拼接到 HTML 超链接中，因此需要触发该函数后才进入 DOM 写入和事件触发阶段。

### 2.

<br>问题：Payload 中的单引号为什么能改变超链接结构？
<br>解答：当用户输入被直接拼接进 href 属性值时，单引号可能闭合原有属性值，后续内容就被浏览器解析为新的属性。本题记录中 onclick="alert(1)" 被注入到生成的链接上，说明输入进入了 HTML 属性上下文。

### 3.

<br>问题：如何判断该漏洞偏向 DOM 型 XSS？
<br>解答：本题证据显示，页面 JavaScript 从 URL 的 text 参数读取数据，经过处理后拼接到 HTML 中；在 Elements 面板中可以看到浏览器最终生成的 DOM 包含注入的 onclick。这类由客户端脚本读取可控来源并写入 DOM 的过程，是 DOM 型 XSS 的典型特征。


## 漏洞原理与修复思路

<br>DOM 型 XSS 的关键在于客户端脚本把可控数据写入危险 DOM 位置。本题中 URL 的 text 参数是输入来源，JavaScript 函数读取并解码后将其拼接到超链接 HTML 中，单引号闭合 href 属性并注入 onclick，用户点击链接时触发 JavaScript 执行。

<br>修复时应避免把不可信输入直接拼接到 innerHTML 等 HTML 解析入口，优先使用 textContent 或 DOM API 设置文本和属性；如必须生成 HTML，应进行上下文相关的编码与白名单校验，并结合 CSP 等防御措施降低脚本执行风险。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题展示了 DOM 型 XSS 的基本验证流程：先确认可控输入进入 URL 参数，再找到读取该参数并写入 DOM 的 JavaScript 逻辑，最后通过生成的 HTML 结构和实际弹窗验证脚本执行。
<br>2. 后续学习可重点关注 DOM 型 XSS 的 source 与 sink、HTML 属性上下文的闭合方式，以及使用安全 DOM API、输出编码和 CSP 进行防护的思路。

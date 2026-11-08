---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - DOM型xss"
date: 2026-11-09

skill: ""
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - DOM型xss

## 实验模块

模块：XSS

场景：DOM型xss

## 漏洞场景

题目名称：DOM型xss；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 打开 Pikachu 靶场，进入 XSS 模块下的「DOM 型 XSS」页面；页面提供输入框和 click me\! 按钮。
<br>2. 在输入框中输入测试 Payload：javascript:alert(1)。
<br>3. 点击 click me\! 按钮，页面通过 JavaScript 读取输入框内容并动态生成一个超链接。
<br>4. 点击页面生成的蓝色超链接 what do you see?，浏览器执行 href 中的 JavaScript 代码，成功弹出内容为 1 的提示框，完成 DOM 型 XSS 漏洞验证。

## 其他观察

使用浏览器开发者工具 F12 进入 Elements 面板，展开对应 div 后，可看到生成的 HTML 为 \<a href="javascript:alert(1)"\>what do you see?\</a\>，说明输入内容被放入了超链接的 href 属性中。


## 分析与解答

### 1.

<br>问题：为什么输入 javascript:alert(1) 后，需要点击生成的链接才会触发弹窗？
<br>解答：因为该值被写入 a 标签的 href 属性，javascript: 是伪协议，只有浏览器导航到该链接时才执行其中的脚本；点击链接即触发导航并执行 alert(1)。

### 2.

<br>问题：如何从现象判断这属于 DOM 型 XSS，而不是服务端反射或存储型 XSS？
<br>解答：记录中页面由前端 JavaScript 读取输入框内容并动态生成超链接，开发者工具能在 DOM 中看到输入被写入 href；这类在浏览器端完成 source 到 sink 的过程符合 DOM 型 XSS 的特征。

### 3.

<br>问题：这类 href 注入应如何修复？
<br>解答：不要直接把不可信输入拼入 href，可先解析并只允许 http/https 等安全协议，使用 textContent 或安全的 DOM API 设置文本，必要时用可信 URL 和 HTML sanitizer 进行过滤。


## 漏洞原理与修复思路

<br>DOM 型 XSS 的成因是前端 JavaScript 将可控数据源（source）写入危险输出位置（sink），例如把输入值放入 a 标签的 href 属性；当用户点击链接时，javascript: 伪协议中的脚本会在当前页面上下文执行。

<br>修复时应避免将不可信输入直接拼接进 href 等可执行上下文；推荐对 URL 做协议白名单校验，只允许 http、https 等安全协议，并通过 textContent 或安全的 DOM API 写入文本，必要时结合可信 URL 校验或 HTML sanitizer 过滤。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题验证的是 DOM 型 XSS：前端脚本读取输入框内容并写入 href，点击链接后触发 javascript: 伪协议执行；它与服务端拼接响应的反射型或存储型 XSS 在触发链路上不同。
<br>2. 使用开发者工具查看生成后的 DOM，可以确认输入最终落入的 sink；分析时重点关注 source 是否可控、sink 是否危险，以及是否存在协议过滤或编码处理。

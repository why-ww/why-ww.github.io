---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - xss之js输出"
date: 2026-11-11

skill: ""
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - xss之js输出

## 实验模块

模块：XSS

场景：xss之js输出

## 漏洞场景

题目名称：xss之js输出；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 打开 Pikachu 靶场中的“XSS 之 JS 输出”页面，输入普通内容并提交；随后通过浏览器开发者工具查看页面源代码，发现页面通过 GET 请求传递 message 参数。
<br>2. 在开发者工具的源代码中找到相关 JavaScript 代码：$ms = 'Kobe';，其后续逻辑会根据 $ms 的内容更新页面文本。记录中据此判断，用户输入被放入由单引号包裹的 JavaScript 字符串中，若未正确处理，可能通过单引号提前结束字符串并插入 JavaScript 代码。
<br>3. 在输入框中构造并输入 Payload：';alert(1);//，然后点击 Submit 提交。
<br>4. 提交后页面成功弹出数字 1，说明注入的 JavaScript 代码被浏览器执行，该 XSS 漏洞验证成功。

## 分析与解答

### 1.

<br>问题：为什么 Payload “';alert(1);//” 能使 JavaScript 代码执行？
<br>解答：从已查看的代码可知，输入被拼接到单引号字符串中。Payload 开头的单引号可提前结束原字符串，分号结束当前语句，随后 alert(1) 被作为 JavaScript 语句执行，而 // 会注释掉后续内容，避免残留引号或代码造成语法错误。

### 2.

<br>问题：如何判断这里属于 JavaScript 输出型 XSS，而不是普通 HTML 反射？
<br>解答：关键在于用户输入进入了 script 代码中的字符串上下文，浏览器会先按 JavaScript 语法解析并执行；当单引号闭合字符串后，注入内容便不再只是页面文本，而会成为可执行脚本。本题中弹出 1 的结果验证了这条执行链。


## 漏洞原理与修复思路

<br>该漏洞的根因是服务端把可控输入直接拼接到内联 JavaScript 的单引号字符串中，未按 JavaScript 上下文进行转义。攻击者可用单引号闭合字符串，再插入任意脚本语句，最终由浏览器执行，形成 XSS。

<br>修复时应避免把不可信数据直接拼接进 script；如必须传递数据，可使用安全的数据传递方式并进行 JSON 编码，同时针对 JavaScript 字符串上下文转义单引号、双引号、反斜杠和换行等特殊字符。还可结合输入校验、输出编码和 CSP 等纵深防御措施降低 XSS 风险。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题展示了 JavaScript 输出型 XSS 的典型路径：用户输入进入 script 中的字符串，单引号闭合后改变原有语法结构，注入的 alert(1) 被执行，最终通过弹窗验证漏洞。
<br>2. 后续学习应重点区分 HTML 上下文、属性上下文和 JavaScript 上下文中的不同闭合方式与编码策略，理解“上下文决定 Payload”和“输出编码必须匹配上下文”的原则。

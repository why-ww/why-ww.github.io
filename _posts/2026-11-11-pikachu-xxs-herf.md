---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - xss之href输出"
date: 2026-11-11

skill: ""
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - xss之href输出

## 实验模块

模块：XSS

场景：xss之href输出

## 漏洞场景

题目名称：xss之href输出；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 用户首先输入 https://www.baidu.com 并点击 Submit，页面成功生成一个蓝色超链接。
<br>2. 用户按 F12 打开开发者工具，在 Elements 面板中找到生成的超链接，观察到 a 标签的 href 值为 https://www.baidu.com，说明用户输入的 URL 被放入了 href 属性中。
<br>3. 用户将输入内容修改为 javascript:alert(1) 并点击 Submit，页面再次生成了一个蓝色超链接。
<br>4. 用户点击新生成的蓝色超链接，而不是 Submit 按钮，浏览器成功弹出内容为 1 的 JavaScript 弹窗，说明 JavaScript 代码已经执行，XSS 验证成功。

## 分析与解答

### 1.

<br>问题：为什么点击新生成的超链接后才触发弹窗，而不是点击 Submit 时立即触发？
<br>解答：因为测试中的 Payload 被放入 a 标签的 href 属性，浏览器会在用户激活链接时解析该 URL；javascript: 伪协议被允许时，点击即可执行其中的脚本。证据中记录的触发方式正是点击蓝色超链接后出现弹窗。

### 2.

<br>问题：仅看到页面生成了蓝色超链接，能否直接判断存在 XSS？
<br>解答：不能。还需要确认输入落在哪个 HTML 上下文，例如是否进入 href 属性，并验证危险协议是否会被浏览器执行。本次记录先通过开发者工具确认 href 结构，再用 javascript:alert(1) 生成链接并通过点击触发弹窗，形成了完整的验证链。


## 漏洞原理与修复思路

<br>该场景的核心是 URL 输出点位于 a 标签的 href 属性。若用户输入未经过协议白名单校验，攻击者可提交 javascript: 等伪协议；当受害者点击链接时，浏览器会把该值当作可执行 URL 处理，从而运行脚本。此次证据显示正常 URL 会进入 href，替换为 javascript:alert(1) 后点击链接成功触发弹窗。

<br>修复时应优先对 URL 做协议白名单校验，只允许 http、https 等预期协议，拒绝 javascript、data、vbscript 等危险协议；同时对输出到 HTML 属性的内容进行正确的属性上下文编码，并避免将未经校验的用户输入直接拼入 href。可结合内容安全策略等纵深防御措施降低脚本执行风险。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本次记录呈现了从正常输入建立基线、检查 HTML 结构、替换为危险协议到点击验证的完整测试思路。关键在于先确认输入所处的上下文，再选择匹配该上下文的 Payload。
<br>2. href 输出型 XSS 与普通文本节点 XSS 的触发方式不同，危险点在于 URL 协议而非标签闭合。后续学习可重点关注 URL 解析、协议白名单、属性上下文编码以及点击型 XSS 的验证方法。

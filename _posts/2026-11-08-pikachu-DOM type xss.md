---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - DOM型xss"
date: 2026-11-08

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

<br>1. 在留言框中输入 \<script\>alert(1)\</script\>，点击 submit 提交留言。
<br>2. 提交后，浏览器成功弹出内容为 1 的提示框，说明输入的 JavaScript 代码被浏览器执行，而不是作为普通文本显示。
<br>3. 关闭弹窗后刷新当前页面，浏览器再次弹出 1；记录据此判断提交内容没有随页面刷新消失，而是被保存下来并在页面重新加载时再次执行，进而将现象判定为存储型 XSS。

## 分析与解答

### 1.

<br>问题：提交 \<script\>alert(1)\</script\> 后出现弹窗，为什么能说明 XSS？
<br>解答：弹窗表明浏览器把输入内容放进了 HTML 或 JavaScript 执行上下文，并将其中代码当作脚本运行，而不是作为普通文本展示；alert(1) 只是用于直观验证脚本执行。

### 2.

<br>问题：刷新后仍弹窗是否一定说明是存储型 XSS？
<br>解答：不一定。刷新后仍执行说明该内容在刷新后还能被页面重新取用，但来源可能是服务端保存，也可能是 URL 参数、浏览器本地存储、前端状态恢复或缓存；题目标为 DOM 型时，应进一步查看前端 JavaScript 的 source 与 sink。

### 3.

<br>问题：DOM 型 XSS 应重点观察什么？
<br>解答：重点看前端 JavaScript 是否从 location.hash、location.search、输入框值等来源读取不可信数据，再将其写入 innerHTML、document.write、eval 等危险位置；这类漏洞的触发链路主要发生在浏览器端。


## 漏洞原理与修复思路

<br>


<br>DOM 型 XSS 的核心是前端脚本把不可信数据从 source 读取后，未经安全处理写入危险 sink，导致数据被当作 HTML 或 JavaScript 执行。与反射型、存储型相比，DOM 型更强调客户端 JavaScript 中的数据流。

<br>修复时应避免把外部输入直接交给 innerHTML、document.write、eval 等危险接口，优先使用 textContent 等按文本处理的方式；必要时进行上下文相关编码和过滤，并可配合 CSP 降低脚本执行风险。若确认数据被服务端保存并在刷新后再次输出，则还需在服务端输出处做编码与校验。

<br>本题记录中的“刷新后仍弹窗”可能提示 payload 被保存在可再次读取的位置，也可能只是前端状态或参数恢复造成的复现；若源码显示输入由前端脚本写入 DOM，则更符合 DOM 型 XSS，若由服务端保存并回显，则更接近存储型 XSS。


## 学习总结

本次靶场实验主要学习了：

<br>1. 验证 XSS 时，alert(1) 能直观看到脚本是否被执行；刷新测试则用于观察同一 payload 是否会在页面重新加载后再次生效。
<br>2. XSS 分类不能只依据是否弹窗，而要定位数据来源与输出位置：DOM 型关注前端 source 到 sink 的数据流，存储型关注服务端保存与再次输出。
<br>3. 后续学习可结合页面源码和浏览器开发者工具观察 DOM 变化、网络请求与存储位置，从而确认 payload 的保存位置、读取方式和最终执行路径。

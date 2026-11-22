---
layout: writeup
tags: [pikachu, XSS]

title: "Pikachu Lab Report - DOM 型 XSS"
date: 2026-11-09

pikachu_skill: "xss/dom"
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - DOM 型 XSS

## 实验模块

模块：XSS

场景：DOM 型 XSS

## 漏洞场景

题目名称：DOM 型 XSS；平台：Pikachu；方向：Web。

完成状态依据旧稿中保留的输入、生成链接、开发者工具观察和点击触发记录；本次整理没有重新执行测试。源码复核对象为 `vul/xss/xss_dom.php`。

## 测试过程

<br>1. 既有记录进入页面后，在输入框中填写 `javascript:alert(1)`，然后点击 `click me!`。
<br>2. 页面没有向服务器提交表单，而是由前端 `domxss()` 函数读取输入框的 `value`，并在 `div#dom` 中生成一个超链接。
<br>3. 开发者工具可观察到输入值进入新链接的 `href` 属性。点击生成的 `what do you see?` 链接后，旧稿记录浏览器出现内容为 `1` 的对话框。
<br>4. 当前源码确认了这条链路：`document.getElementById("text").value` 取得输入，再通过 `innerHTML = "<a href='" + str + "'>..."` 进行字符串拼接。

## 源码数据流

<br>1. 来源（source）：浏览器页面中 `input#text` 的 `value`。
<br>2. 处理：前端函数没有校验 URL 协议，也没有进行属性上下文编码。
<br>3. 输出点（sink）：`element.innerHTML`，它会让浏览器重新解析拼接后的 HTML。
<br>4. 触发：输入最终成为 `href`；当值使用可执行协议时，需要点击生成的链接才会运行。整个危险数据流发生在浏览器端。

## 验证观察点与常见问题

<br>1. 点击 `click me!` 只负责创建链接；若测试值位于 `href`，通常还要点击新链接才能观察到执行结果。
<br>2. 本题输入不会出现在网络请求中，抓包工具可能看不到关键数据。应优先使用开发者工具检查事件函数和生成后的 DOM。
<br>3. 只看“页面源代码”可能找不到动态生成的链接，应查看 Elements 面板中的当前 DOM。
<br>4. DOM 型描述的是客户端 source 到 sink 的危险数据流，并不表示服务端一定参与了反射或存储。

## 分析与解答

### 1. 为什么需要点击生成的链接？

输入被放入 `a` 标签的 `href` 属性。`javascript:` 只有在浏览器导航到该链接时才执行，所以创建链接与触发脚本是两个步骤。

### 2. 为什么这是 DOM 型 XSS？

不可信数据由页面脚本从输入框读取，再由同一段脚本写入 `innerHTML`。服务端没有接收这次输入，漏洞形成于客户端 DOM 操作。

### 3. 应该怎样修复？

不要把不可信字符串拼进 `innerHTML`。可用 `document.createElement('a')` 创建元素、用 `textContent` 设置文本，并对目标 URL 进行协议白名单校验，只允许 `http:`、`https:` 等业务需要的协议。CSP 可作为补充防线。

## 学习总结

<br>1. 本题已经实际验证，数据流是 `input.value → 字符串拼接 → innerHTML → href → 用户点击执行`。
<br>2. DOM 型 XSS 分析要找清 source、sink 和触发动作，网络请求不一定包含关键输入。
<br>3. 安全 DOM API 与 URL 协议白名单比直接拼接 HTML 更可靠。

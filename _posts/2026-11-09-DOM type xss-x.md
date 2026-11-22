---
layout: writeup
tags: [pikachu, XSS]

title: "Pikachu Lab Report - DOM 型 XSS-X"
date: 2026-11-09

pikachu_skill: "xss/dom-x"
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - DOM 型 XSS-X

## 实验模块

模块：XSS

场景：DOM 型 XSS-X

## 漏洞场景

题目名称：DOM 型 XSS-X；平台：Pikachu；方向：Web。

完成状态依据旧稿中保留的 URL、Elements 面板和点击弹窗记录；本次整理没有重新执行测试。源码复核对象为 `vul/xss/xss_dom_x.php`。

## 测试过程

<br>1. 既有记录在输入框中填写 `#' onclick='alert(1)`，点击“请说出你的伤心往事”后，浏览器以 GET 方式把内容放入 URL 的 `text` 参数。
<br>2. 服务端检测到 `text` 参数后，只输出一个调用 `domxss()` 的链接；它并没有把参数值直接拼进响应 HTML。
<br>3. 点击该链接后，前端函数读取 `window.location.search`，取出 `text=` 后的字符串，执行 `decodeURIComponent`，再把加号替换为空格。
<br>4. 函数把解码后的值拼入 `innerHTML` 中的 `href` 属性。既有记录在 Elements 面板看到原属性被单引号闭合并出现新的 `onclick` 属性；点击新生成的链接后，浏览器弹出内容为 `1` 的对话框。

## 源码数据流

<br>1. 来源（source）：`window.location.search` 中的 `text` 查询参数。
<br>2. 处理：使用字符串分割、URL 解码和加号替换；这些步骤只还原输入，不会提供 HTML 安全编码。
<br>3. 输出点（sink）：`document.getElementById("dom").innerHTML`。
<br>4. 结构变化：输入中的单引号闭合原有 `href` 值，后续内容被浏览器解释为新的事件属性，点击链接时执行。

## 验证观察点与常见问题

<br>1. 本题有两次点击：第一次提交 GET 参数并生成调用 `domxss()` 的链接，第二次调用函数生成受污染的 DOM；最后还要触发新链接上的事件。漏掉任一步都可能看不到现象。
<br>2. 地址栏里看到百分号编码是正常的。真正危险发生在 `decodeURIComponent` 还原内容后又进入 `innerHTML`。
<br>3. 服务器响应只提供触发函数的入口，注入结构由浏览器脚本生成，因此应结合 Sources 与 Elements 面板分析，不能只搜索原始响应。
<br>4. 源码用 `split("text=")[1]` 手工解析参数，遇到参数顺序、缺失值或额外参数时也可能出现异常；这既不稳健，也不是安全校验。

## 分析与解答

### 1. 为什么 URL 参数没有直接出现在响应里仍能形成 XSS？

客户端脚本可以在页面加载后读取地址栏。只要它把可控参数写入危险 DOM 接口，漏洞无需服务端把参数直接反射进 HTML。

### 2. 单引号在这里起什么作用？

拼接模板使用单引号包裹 `href`。可控输入中的单引号会提前结束该属性值，使后续文本被浏览器解析为新的 HTML 属性，从而改变元素结构。

### 3. 应该怎样修复？

使用 `URLSearchParams` 正确读取参数，并避免 `innerHTML`。通过 `createElement`、`textContent` 和 `setAttribute` 构建 DOM；如果输入用于 URL，必须解析后执行协议白名单校验。必要时再配合严格 CSP 限制内联脚本和事件处理器。

## 学习总结

<br>1. 本题已经实际验证，完整链路是 `URL text → window.location.search → 解码 → innerHTML → 属性结构被改变 → 点击执行`。
<br>2. DOM 型 XSS 可能不出现在原始响应中，开发者工具里的当前 DOM 才是关键证据。
<br>3. URL 解码不是安全处理；安全重点是避免 HTML 字符串拼接，并按最终上下文验证数据。

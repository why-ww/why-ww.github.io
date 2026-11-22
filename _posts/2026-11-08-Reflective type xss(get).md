---
layout: writeup
tags: [pikachu, XSS]

title: "Pikachu Lab Report - 反射型 XSS（GET）"
date: 2026-11-08

pikachu_skill: "xss/reflected-get"
completed: true
module: "XSS"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 反射型 XSS（GET）

## 实验模块

模块：XSS

场景：反射型 XSS（GET）

## 漏洞场景

题目名称：反射型 XSS（GET）；平台：Pikachu；方向：Web。

完成状态依据旧稿中保留的浏览器与 Burp Suite 实操记录；本次整理没有重新发送攻击请求。源码复核对象为当前 Pikachu 的 `vul/xss/xss_reflected_get.php`。

## 测试过程

<br>1. 既有记录先在输入框中提交 `Kobe Bryant`，页面返回 `who is Kobe Bryant,i don't care!`，说明 `message` 参数会进入当前请求的响应。
<br>2. 随后提交较长的 `<script>alert(1)</script>`，页面没有弹窗。Burp 响应中的表单显示输入框带有 `maxlength="20"`，说明浏览器正常输入时会截断超过 20 个字符的内容。
<br>3. Proxy 抓到的请求为 GET，请求路径包含 `xss_reflected_get.php?message=...&submit=submit`。`<`、`>` 等字符在 URL 中会被百分号编码，这是传输编码，不代表服务端已经做了 HTML 安全编码。
<br>4. 既有记录改用刚好 20 个字符的 `<svg onload=alert()>` 后，浏览器出现 JavaScript 对话框，因此该输入点已实际验证为反射型 XSS。
<br>5. 当前源码与现象一致：提交按钮存在时，程序读取 `$_GET['message']`；除 `kobe` 分支外，输入被直接拼入 `<p class='notice'>who is ...</p>`，没有进行 HTML 输出编码。

## 源码数据流

<br>1. 来源（source）：URL 查询字符串中的 `message`，由 `$_GET['message']` 读取。
<br>2. 处理：仅判断是否为空、是否等于 `kobe`；源码没有调用 `htmlspecialchars` 或模板自动转义。
<br>3. 输出点（sink）：`$html` 中的 `<p>` 标签正文，最后通过 `echo $html` 写入响应。
<br>4. 结果：浏览器把输入中的标签和事件属性当成 HTML 解析，而不是普通文本显示。

## 验证观察点与常见问题

<br>1. 不要只看是否弹窗，还应在响应中确认 `message` 最终落在 HTML 文本上下文，并比较原始输入与响应内容。
<br>2. `maxlength` 是前端体验限制，不是安全边界。直接构造请求或使用 Repeater 可以提交更长内容；真正的防护必须发生在服务端输出阶段。
<br>3. URL 编码只保证字符可以在 URL 中传输。服务器解码后若仍原样写入 HTML，XSS 风险依旧存在。
<br>4. 若页面只显示残缺内容，应先检查字符长度、请求参数名和编码，而不是立即判断“没有漏洞”。

## 分析与解答

### 1. 为什么第一次使用 script 标签没有成功？

`<script>alert(1)</script>` 超过输入框的 20 字符限制，浏览器正常提交时可能只发送前 20 个字符。换用满足长度限制的测试内容后成功触发，说明失败原因是输入被截断，而不是输出点已经安全。

### 2. 为什么 GET 请求会形成反射型 XSS？

GET 只决定数据位于 URL 查询字符串。风险来自服务端把本次请求的 `message` 直接拼回 HTML 响应，浏览器随后把它解析成可执行内容。

### 3. 应该怎样修复？

输出到 HTML 文本节点时，应使用 `htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` 等可靠方式进行上下文相关编码。输入校验和长度限制可以辅助防御，但不能代替输出编码；还可配置 CSP 降低遗漏时的影响。

## 学习总结

<br>1. 本题已经实际验证，核心链路是 `GET message → PHP 字符串拼接 → HTML 文本节点 → 浏览器解析执行`。
<br>2. 排查 XSS 要同时观察请求、响应和浏览器解析结果，并区分 URL 编码与 HTML 输出编码。
<br>3. 前端长度限制可以影响测试内容，却不能阻止攻击者直接修改请求。

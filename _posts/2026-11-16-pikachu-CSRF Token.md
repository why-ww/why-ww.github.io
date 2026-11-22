---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - CSRF Token"
date: 2026-11-16

skill: "csrf/token"
completed: true
module: "CSRF"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - CSRF Token

## 实验模块

模块：CSRF

场景：CSRF Token

## 漏洞场景

题目名称：CSRF Token；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 使用用户名 allen、密码 123456 登录系统，登录成功后进入个人会员中心。
<br>2. 点击「修改个人信息」进入资料编辑页面，使用浏览器开发者工具的 Network 面板观察请求，并在 Elements 中检查表单，发现隐藏字段 \<input type="hidden" name="token" value="动态生成的Token"\>，说明提交资料时除个人信息外还需携带 Token。
<br>3. 将地址修改为 csrf-token-test-01 并提交，在 Network 中找到 token\_get\_edit.php，确认请求方法为 GET，Token 通过 URL 查询参数传递，同时请求携带 PHPSESSID Cookie。
<br>4. 查看请求详情中的 Cookie 标签，确认请求携带 PHPSESSID；该值用于标识当前 PHP 会话。
<br>5. 对比正常 Token 与错误 Token：正常 Token 提交后个人资料成功修改；错误 Token 提交后没有完成资料修改，仍停留在编辑页面，说明服务器会对提交的 Token 进行验证。
<br>6. 实验记录总结显示：已完成登录、资料修改、请求抓包和 Token 验证，并观察到修改资料请求使用 GET 方法、表单中存在隐藏 Token 字段、请求携带 PHPSESSID，错误 Token 无法正常完成资料修改。

## 其他观察

记录中已指出 PHPSESSID 用于标识当前 PHP 会话，而 Token 是额外的请求验证参数，两者作用不同。


## 分析与解答

### 1.

<br>问题：隐藏的 Token 字段在资料修改中起什么作用？
<br>解答：CSRF Token 通常由服务器生成，并与用户会话或表单关联；提交敏感操作时，服务器要求请求携带该随机值并进行校验。本题表单中存在隐藏 token，且错误 Token 未能完成资料修改，说明该请求流程包含 Token 校验。

### 2.

<br>问题：资料修改使用 GET 且 Token 放在 URL 查询参数中，有什么潜在风险？
<br>解答：这可能使 Token 更容易出现在浏览器历史、访问日志、Referer 等位置；如果攻击者能够获取或预测有效 Token，CSRF 防护可能被削弱。本题记录只确认了 GET 方法与 Token 的传递方式，并未记录实际利用过程，因此这里只能视为潜在风险。


## 漏洞原理与修复思路

<br>CSRF 利用受害者已经登录的会话，诱导浏览器向目标站点发起非预期请求。若服务器仅依赖 Cookie 识别身份、不校验请求是否来自可信页面，就可能执行敏感操作；CSRF Token 通过在请求中附带服务器生成并校验的随机值，提高攻击者伪造请求的难度。

<br>针对这类资料修改场景，修复思路包括使用 POST 等非幂等请求方法、将 Token 放在请求体或自定义请求头中而不是 URL 查询参数、在服务端严格校验 Token 与当前会话的绑定关系，并结合 SameSite Cookie、Origin/Referer 校验等防护措施。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本实验展示了带 CSRF Token 的资料修改流程：登录后表单中包含隐藏 Token，提交时携带 PHPSESSID，服务器会校验 Token；正常 Token 可完成修改，错误 Token 则无法完成。
<br>2. 后续学习可重点关注 Token 的生成与绑定方式、请求方法选择、Token 传输位置以及 SameSite 和 Origin/Referer 等辅助防护，理解单一防护措施与组合防护之间的差异。

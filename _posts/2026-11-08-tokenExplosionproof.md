---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - token防爆破?"
date: 2026-11-08

skill: ""
completed: true
module: "暴力破解"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - token防爆破?

## 实验模块

模块：暴力破解

场景：token防爆破?

## 漏洞场景

题目名称：token防爆破?；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在 Burp Suite 中开启 Proxy 拦截，进入 Pikachu 的 Token 防爆破页面，输入用户名 admin 和密码 123456 后点击 Login。Burp 拦截到发往 /pikachu/vul/burteforce/bf\_token.php 的 POST 请求，请求正文包含 username=admin、password=123456、token=493946... 与 submit=Login，同时请求头带有用于维持 PHP 会话的 PHPSESSID。
<br>2. 将该请求 Forward 到服务器后查看 Response；响应 HTML 中存在隐藏字段 name=token、value=812126...，并返回 login success。该响应显示本次登录成功，且服务器下发了新的 Token。
<br>3. 将原始 POST 请求发送到 Burp Repeater，保持原 Cookie 和请求参数不变再次发送；服务器返回 csrf token error，登录未成功，响应页面中又出现一个新 Token。记录中据此判断原来的 Token 不能直接重复使用。
<br>4. 将上一次错误响应中返回的新 Token 替换请求中的旧 Token，保持用户名、密码和 PHPSESSID 不变后再次发送；服务器返回 login success，并且响应中又生成了新的 Token。
<br>5. 记录中归纳出三点：Token 会随请求处理发生变化；重复使用旧 Token 会导致验证失败；使用服务器返回的最新 Token 可以再次正常提交登录请求。

## 其他观察

在 Repeater 重放请求时，响应状态码仍为 200，而响应正文为 csrf token error，登录并未成功；这说明状态码本身不能直接等同于登录结果。


## 分析与解答

### 1.

<br>问题：为什么同一个 Token 不能在重放请求中继续使用？
<br>解答：这类防护通常把 Token 与当前会话关联，并在服务端校验后使其失效或更新；旧 Token 再次提交时就无法通过校验，记录中的 csrf token error 与该机制相符。

### 2.

<br>问题：HTTP 200 是否代表登录成功？
<br>解答：不代表。HTTP 状态码描述请求层面的响应，应用可以在 200 响应正文中返回 csrf token error 等业务错误；判断登录结果应查看响应正文和业务状态。

### 3.

<br>问题：使用最新 Token 后又能登录成功，是否说明 Token 防爆破可以被绕过？
<br>解答：本次记录只能说明该 Token 具有更新或一次性校验特征；推测如果自动化脚本能够从每次响应中自动提取最新 Token 并回填，且服务端没有其他限速、锁定或验证码措施，可能仍具备自动化尝试空间，但是否可行仍需进一步验证。


## 漏洞原理与修复思路




<br>Token 防爆破的核心是把一次性随机值与会话绑定，并在服务端校验其是否与当前会话匹配、是否已被使用。记录中旧 Token 重放返回 csrf token error、换用新 Token 后成功，体现了服务端更新 Token 后旧值失效的校验逻辑。

<br>修复时不能只依赖客户端可自动获取的 Token；还应结合登录失败计数、速率限制、验证码或短时账户锁定，并确保 Token 校验失败时返回明确错误，避免仅靠状态码判断。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本次实验围绕 Token 参数展开，确认了请求中除用户名、密码外还包含 Token，并且服务端会在处理请求后下发新的 Token。
<br>2. 旧 Token 重放会触发 csrf token error，而替换为响应中的最新 Token 后可以继续提交；这说明 Token 与请求处理之间存在一次性或更新式校验关系。
<br>3. 后续学习可重点关注如何在 Burp 中自动提取并回填动态 Token、如何结合限速与验证码设计防爆破，以及如何通过响应正文而不是只看 HTTP 状态码判断业务结果。

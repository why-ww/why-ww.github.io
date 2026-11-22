---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - CSRF(post)"
date: 2026-11-15

skill: "csrf/post"
completed: true
module: "CSRF"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - CSRF(post)

## 实验模块

模块：CSRF

场景：CSRF(post)

## 漏洞场景

题目名称：CSRF(post)；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 打开本地 Pikachu 靶场，进入 CSRF → CSRF(post)。登录后进入个人会员中心并点击修改个人信息，页面中可修改性别、手机、地址和邮箱等信息。
<br>2. 打开浏览器开发者工具的 Network 面板，修改个人资料并提交后，在网络请求中找到 csrf\_post\_edit.php。该请求的方法为 POST，状态码为 302 Found，请求 URL 为 http://localhost/pikachu/vul/csrf/csrfpost/csrf\_post\_edit.php；记录中说明 302 表示服务器返回重定向响应，提交后会跳转回个人中心。
<br>3. 在 Network 中选择对应请求，打开“负载（Payload）”查看 Form Data，得到参数 sex=boy、phonenum=13800000000、add=test、email=test@example.com、submit=submit。记录中还区分了 GET 将参数放在 URL 的 Query String 中，而 POST 将参数放在请求正文的 Form Data 中。
<br>4. 为理解 CSRF 的请求构造方式，创建本地文件 csrf\_post\_test.html，使用 HTML 表单模拟原页面的 POST 请求。表单的 action 指向 http://localhost/pikachu/vul/csrf/csrfpost/csrf\_post\_edit.php，并通过隐藏字段传递 sex、phonenum、add、email、submit 参数，同时提供一个手动提交按钮。
<br>5. 在 HTML 页面中增加 window.onload 自动提交表单的 JavaScript，期望浏览器打开页面后自动提交。实际访问目标页面时遇到 404，未能完成由独立 HTML 页面发起 POST 请求的验证；记录中明确，本次已确认正常 POST 请求及其参数，但尚未确认自行构造页面能够成功完成跨站修改。

## 分析与解答

### 1.

<br>问题：CSRF(post) 为什么需要先抓取正常提交产生的 POST 请求？
<br>解答：CSRF 利用的是受害者浏览器中已有的登录状态。攻击页面需要让浏览器向目标站点发起一个与正常业务等价的请求；对于 POST 场景，必须先明确目标接口、请求方法、参数名和参数值，才能用表单等 HTML 机制伪造该请求。POST 只是将参数放在请求正文中，并不会自动阻止跨站伪造。

### 2.

<br>问题：已经抓到了正常 POST 请求，为什么仍不能认定独立 HTML 页面利用成功？
<br>解答：记录中访问构造页面时遇到 404，说明该页面或目标路径未被正确访问，表单可能根本没有提交到 csrf\_post\_edit.php，因此不能把 404 之后的状况视为跨站修改成功。404 可能是由 HTML 文件放置位置、访问路径或本地服务配置不正确导致的；需要先确保测试页面可访问，再观察目标账户资料是否发生变化。

### 3.

<br>问题：正常提交后返回 302 是否就能证明 CSRF 利用成功？
<br>解答：不能。302 只表示服务器处理请求后要求浏览器重定向，正常登录状态下的手动提交也会出现该响应。判断 CSRF 是否成功，应确认请求是否由第三方页面自动触发并携带受害者会话，同时检查目标账户资料是否被实际修改；仅凭状态码不能区分正常提交与跨站伪造。


## 漏洞原理与修复思路

<br>CSRF 的核心不是窃取响应内容，而是借用受害者浏览器中已有的 Cookie 等凭证，让浏览器向目标站点发送一个用户并非本意发起的请求。POST 场景中，攻击者可构造 action 指向目标接口的表单并通过隐藏字段填入参数；浏览器提交表单时会按目标站点规则携带会话凭证，如果服务端只检查用户已登录而不校验请求是否来自本站业务页面，就可能把伪造请求当成正常操作。

<br>修复 CSRF 不能依赖“使用 POST”或“字段被隐藏”。常见思路是给敏感操作加入服务端生成、与用户会话绑定且不可预测的 CSRF Token，并在提交时校验；同时可结合 SameSite Cookie、Origin/Referer 校验以及对修改密码、邮箱等敏感操作要求重新认证。令牌应随机且一次性或具备时效性，避免被攻击页面提前获取和复用。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本次记录已确认 Pikachu 的 CSRF(post) 个人资料修改接口为 csrf\_post\_edit.php，请求方法为 POST，参数位于 Form Data 中，并成功抓取到 sex、phonenum、add、email、submit 等字段；同时构造了对应的 HTML 表单和自动提交脚本，但独立页面的验证因 404 未完成。
<br>2. 理解 CSRF(post) 的关键是区分“参数如何放置”和“请求是否可被跨站伪造”。POST 只改变参数位置，不提供抗 CSRF 能力；真正的防护应依赖不可预测的 CSRF Token、会话绑定校验及适当的浏览器安全策略，而不是隐藏字段或请求方法本身。
<br>3. 后续验证时应先保证构造页面可被正常访问，再观察目标账户资料是否变化，并把 404、302 等响应与业务结果分开判断。这样可以避免仅凭网络状态码得出错误结论。

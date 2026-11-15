---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - CSRF(get) login"
date: 2026-11-15

skill: ""
completed: true
module: "CSRF"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - CSRF(get) login

## 实验模块

模块：CSRF

场景：CSRF(get) login

## 漏洞场景

题目名称：CSRF(get) login；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 在 Pikachu 的 CSRF(get) 页面使用测试账号登录，Username 为 kobe，Password 为 123456；随后打开浏览器开发者工具（F12）的 Network 面板观察登录请求。
<br>2. 捕获到的请求 URL 为 http://localhost/pikachu/vul/csrf/csrfget/csrf\_get\_login.php?username=kobe&password=123456&submit=Login，请求方法为 GET，用户名和密码直接以 URL 参数形式传递。
<br>3. 分析 HTTP 响应时看到：登录处理接口返回 302 Found，浏览器随后访问 csrf\_get.php 返回 200，页面显示 hello,kobe，进入个人会员中心。据此判断服务器通过 GET 请求完成登录处理，再以 302 重定向进入会员页面。
<br>4. 退出 Pikachu 当前账号后，在 Windows 桌面新建 csrf\_demo.html，并用记事本编写自动提交的测试表单：form 的 action 指向 http://localhost/pikachu/vul/csrf/csrfget/csrf\_get\_login.php，method 为 GET，三个 hidden 输入分别携带 username=kobe、password=123456、submit=Login，页面加载时由脚本调用 requestSubmit() 自动提交表单。
<br>5. 用户记录指出，最初在脚本中使用 submit() 时未成功，改为 requestSubmit() 后成功；记录中对失败原因的推测是表单中存在名为 submit 的输入框，覆盖了表单原有的同名方法。
<br>6. 保存 HTML 文件后，先退出 Pikachu 当前账号，再双击打开 csrf\_demo.html；浏览器自动提交表单并跳转到 Pikachu 站点，最终页面显示 hello,kobe 和“欢迎来到个人会员中心”，成功进入 kobe 账号的会员中心。
<br>7. 用户由此得出结论：即使事先退出登录，也可以通过外部 HTML 页面构造请求，诱导浏览器自动完成登录。

## 其他观察

时间线记录中另补充提到，可直接构造并访问 http://localhost/pikachu/vul/csrf/csrfget/csrf\_get\_login.php?username=kobe&password=123456&submit=Login 来验证服务器是否接受 URL 中的登录参数；记录中未显示该方式被单独执行及其结果。


## 分析与解答

### 1.

<br>问题：本例中的 GET 型登录接口为什么属于 CSRF 风险点？
<br>解答：登录动作完全由 URL 参数 username、password、submit 决定，服务端仅凭这些参数完成身份认证并下发会话，不校验请求来源，也不要求任何额外的、攻击者无法预知的一次性凭据。因此第三方页面只要诱导浏览器发起同样格式的请求，服务端就会照常处理，这正是 CSRF 的成立条件。

### 2.

<br>问题：为什么脚本里用 submit() 没成功，换成 requestSubmit() 才生效？
<br>解答：表单元素可以用 name="submit" 命名，而表单对象上原本也有 submit() 方法；当存在名为 submit 的控件时，通过 id 取到的表单对象上该名字可能指向控件本身，从而遮蔽原生方法，导致调用失败。requestSubmit() 不依赖这一命名，会按浏览器标准流程触发提交并执行约束校验，因此更为稳妥。

### 3.

<br>问题：为什么退出登录后仍能“进入” kobe 的会员中心？
<br>解答：该实验演示的是登录动作本身可被跨站构造，而不是窃取已有会话。外部页面携带完整账号口令参数发起请求，服务端验证通过后即建立新会话并重定向到会员页，所以浏览器最终显示 hello,kobe；这说明登录接口缺少针对跨站请求的防护，实际风险在于可被诱导以受害者不知情的方式完成指定账号的登录或状态变更。


## 漏洞原理与修复思路

<br>CSRF 的本质是浏览器会自动携带目标站点的会话凭据，而服务端无法区分请求是用户主动发起还是被第三方页面诱导发起；当敏感操作只依赖会话凭据、不校验请求来源时，攻击者就可借受害者的浏览器完成操作。GET 型接口的危险性还在于参数暴露在 URL 中，易被图片、链接、表单等简单载体触发。

<br>常见修复思路包括：为会话相关的敏感请求增加不可预测的 CSRF Token 并在服务端校验；使用 SameSite 属性的 Cookie 降低跨站携带凭据的可能；校验 Origin/Referer 等来源信息；避免用 GET 承载状态变更操作，改为 POST 并配合一次性令牌；登录等关键接口还应结合验证码或二次校验，降低被自动化构造请求的可能。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本次实验串联了抓包观察、响应分析与自建页面验证三个环节：先在 Network 面板确认登录请求的方法与参数位置，再通过 302 跳转与页面回显确认服务端处理逻辑，最后用本地 HTML 复现跨站请求，形成从观察到验证的完整闭环。
<br>2. 技术细节上，值得记住的是表单控件名与原生方法同名时可能造成的方法遮蔽问题；当 name="submit" 的输入存在时，form.submit 可能不再指向函数，改用 requestSubmit() 可规避该问题，这是一条可复用的前端调试经验。
<br>3. 后续可继续学习 POST 型 CSRF、带 Token 的防护场景以及 SameSite Cookie 的实际效果，并结合靶场对比“有防护/无防护”两种登录接口的差异，加深对请求来源校验与一次性令牌机制的理解。

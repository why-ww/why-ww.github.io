---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - 验证码绕过(on server)"
date: 2026-11-04

skill: ""
completed: true
module: "暴力破解"
deployment: "docker"
environment_status: "ready"
---

# Pikachu Lab - 验证码绕过(on server)

## 实验模块

模块：暴力破解

场景：验证码绕过(on server)

## 漏洞场景

 Please Enter Your Information
Username
 
Password
 
验证码
 

login success

## 测试过程

<br>1. 在登录页填入 admin、任意错误密码和当前验证码后点击 Login，目标是在会话中获得一个可用的“正确验证码 + Session”组合。
<br>2. 使用 Burp 抓取该 POST 请求并查看响应；返回内容与“username or password is not exists～”相同，据此判断验证码校验已通过，该请求可用于后续测试。
<br>3. 将请求发送到 Intruder，选择 Sniper 模式，只对 password 的值添加 § 标记；username=admin、vcode=抓包时的验证码、submit=Login 以及 Cookie: PHPSESSID=... 保持不变。
<br>4. 在 Payloads 中填入 8 条弱口令：123456、admin、password、111111、12345678、qwerty、root、test，并检查确保没有空行。
<br>5. 根据响应长度 35347/35348 与 35371/35372 的差异，判断长度较短的一组为成功；payload=123456 的 Request 1 位于较短组中。
<br>6. 随后使用 admin / 123456 与当前页面的验证码登录一次，以验证是否能进入。

## 分析与解答

### 1.

<br>问题：为什么测试时要固定 vcode 和 PHPSESSID？
<br>解答：服务端验证码通常与会话绑定；若验证码校验后没有被一次性消费，或未在连续失败后刷新，那么保持同一个 Session 和已验证的验证码不变，只替换 password，就可能让多次密码尝试共用同一次验证码通过状态。

### 2.

<br>问题：为什么可以用响应长度判断爆破结果？
<br>解答：当请求模板只改变 password 时，登录成功页与失败提示页的 HTML 长度可能不同；在 Intruder 结果中对比响应长度，可以把明显偏离错误响应的一组作为成功候选，再结合具体 payload 进行复核。

### 3.

<br>问题：本题的“验证码绕过（on server）”可能指什么？
<br>解答：结合记录推测，服务端可能只检查了验证码是否正确，却没有保证验证码只能使用一次，也没有在多次登录尝试后强制更新验证码；因此同一个验证码可能被重复用于暴力破解密码。


## 漏洞原理与修复思路




<br>从记录中固定 vcode 与同一个 PHPSESSID 后连续提交不同密码来看，推测服务端验证码存在可重复利用问题，可能未在一次校验后立即失效，或未与当前登录尝试次数和会话状态严格绑定。

<br>修复时应让验证码成为一次性凭证：每次校验后立即失效，登录失败后强制刷新；同时将验证码与 Session、时间窗口和客户端请求绑定，并对同一账号或 IP 的失败次数实施限速、锁定或验证码升级，避免攻击者在固定验证码状态下反复尝试密码。

<br>该场景也说明服务端验证码不能只做“值匹配”，还必须管理其生命周期和可重放性；否则验证码只能增加一次交互成本，不能真正阻断自动化口令尝试。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本题实践展示了在 Burp Intruder 中固定 username、vcode 和 Cookie，仅对 password 设置 payload 位置的做法；通过对比响应长度，可以从多次请求中定位异常成功的候选。
<br>2. 验证码类防护的关键不只在识别字符，还在于服务端是否正确处理一次性消费、会话绑定、失败次数限制和失效刷新；这些设计缺失时，验证码可能被绕过并失去防暴力破解作用。

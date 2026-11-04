---
layout: writeup
tags: [pikachu]

title: "Pikachu Lab Report - 验证码绕过(on client)"
date: 2026-11-04

skill: ""
completed: true
module: "暴力破解"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 验证码绕过(on client)

## 实验模块

模块：暴力破解

场景：验证码绕过(on client)

## 漏洞场景

题目名称：验证码绕过(on client)；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 先通过前端页面获取登录请求：页面只读框显示验证码，记录中截图显示为 6QQ5G；填写 admin、任意密码和 6QQ5G 后提交，即可抓到登录数据包。
<br>2. 随后在 Repeater 中验证服务端是否检查验证码：将 vcode=6QQ5G 改为 vcode=whatever，甚至删除整个 vcode 参数后重发；回包为 username or password is not exists～，记录判断服务端对 vcode 没有实际校验。
<br>3. 接着在 Intruder 中选择 Sniper 模式，只给 password 参数加 §，username 设为 admin，vcode 保持原样或删除均可，并在 Grep 中加入 login success。
<br>4. 爆破结果为 admin / 123456，响应中出现 login success。

## 其他观察

推测该验证码只在前端由 JavaScript 或页面逻辑校验，服务端登录接口没有把验证码结果作为认证前置条件；删除 vcode 后仍返回账号密码不存在提示，与这一推断相符。


## 分析与解答

### 1.

<br>问题：为什么删除 vcode 后仍能走到账号密码校验？
<br>解答：从回包 username or password is not exists～ 可以推断，服务端处理登录请求时未强制检查验证码，删除参数后仍继续校验用户名和密码，因此验证码没有形成服务端安全边界。

### 2.

<br>验证码只有在服务端生成、存储、一次性校验并绑定会话时才能抵抗自动化请求；如果只在前端比对，攻击者可以直接构造或重放 HTTP 请求，绕过页面验证码进行口令爆破。


## 漏洞原理与修复思路




<br>客户端验证码的缺陷在于校验逻辑位于浏览器端，攻击者可以查看验证码值、修改或删除 vcode 参数，并直接向登录接口发送请求。服务端若未再次校验验证码，就无法区分正常登录与自动化爆破。

<br>修复时应在服务端生成并保存验证码，与当前会话绑定，设置有效期并一次性消费；登录接口必须先验证验证码，再校验账号密码。同时可增加失败次数限制、账号锁定、统一错误提示和异常登录日志，降低口令爆破与账号枚举风险。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本次记录的关键不只在于 Intruder 爆破，而在于先用 Repeater 修改和删除 vcode，验证服务端是否真正校验验证码，再决定能否进行口令爆破。
<br>2. 客户端验证码只能增加页面交互成本，不能作为安全边界；判断验证码是否有效，应关注服务端是否生成、存储、一次性消费并与会话绑定。
<br>3. 后续学习可围绕服务端验证码实现、会话绑定、失败次数限制、账号锁定和统一错误提示展开，以理解认证接口的完整防护设计。

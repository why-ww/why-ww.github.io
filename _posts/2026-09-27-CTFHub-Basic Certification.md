---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 基础认证"
date: 2026-09-28

skill: web-http/基础认证
completed: true
---

# CTFHub Writeup - 基础认证

## 题目类型

Web

## 题目描述

题目名称：基础认证；平台：CTFHub；方向：Web。

## 解题过程

<br>1. 题目要求输入账号密码获得 flag，首先考虑对网页请求进行抓包分析。
<br>2. 打开 Burp 代理，输入一次账号密码并点击登录，使用 Burp 捕获登录请求。
<br>3. 捕获到的请求为 \`GET /flag.html HTTP/1.1\`，其中包含请求头 \`Authorization: Basic YWFhOmJiYg==\`。
<br>4. 发送请求后，响应中出现 \`WWW-Authenticate: Basic realm="Do u know admin ?"\`。
<br>5. 响应状态为 \`HTTP/1.1 401 Unauthorized\`，据此判断当前账号密码认证失败。
<br>6. 由于题目提供了密码对照表，决定使用爆破方式尝试密码。
<br>7. 将请求发送到 Burp Intruder，并把 \`Authorization: Basic YWFhOmJiYg==\` 中的 Base64 内容设置为 Payload 位置，形成 \`Authorization: Basic §YWFhOmJiYg==§\`。
<br>8. 在 Payload 设置中选择 \`Simple list\`，并加载密码字典。
<br>9. 在 Payload 的前缀设置中填写 \`admin:\`，并在编码选项中选择 \`Base64 encode\`，使字典中的密码与用户名组合后编码为 Basic Authentication 所需的格式。
<br>10. 启动攻击后，根据状态码区分结果：失败请求返回 \`401\`，成功请求返回 \`200\`。
<br>11. 结果中的第 29 条 Payload 为 \`YWRtaW46NjQzMjE=\`，状态码为 \`200\`，响应长度为 \`383\`。查看该条请求的 Response 后获得 flag。

## 疑问与解答

### 1.

<br>问：Authorization: Basic ...  的内容是什么？
<br>答：HTTP Basic Authentication 通常将 用户名:密码 拼接后进行 Base64 编码，并放入 Authorization 请求头中。Base64 只是编码方式，不是加密，因此在能够观察请求的情况下可以直接分析或重新生成该字段。

<br>

### <br>2.

<br>问： 401 Unauthorized  和  WWW-Authenticate  分别表示什么？
<br>答： 401 Unauthorized  表示当前请求未通过身份认证； WWW-Authenticate  用于告知客户端服务器要求使用的认证方案及相关提示。本题响应中的  Basic  realm 提示了目标使用 HTTP Basic Authentication。



### <br>3.

<br>问：为什么可以通过状态码判断爆破结果？
<br>答：在本题的实际响应中，认证失败对应状态码  401 ，认证成功对应状态码  200 。因此可以将状态码作为 Intruder 的结果筛选条件；对于其他题目，还应结合响应长度、响应正文或重定向行为进行确认，避免仅依赖单一特征。

### <br>4.问：为什么爆破要在Add prefix输入：admin:
<br>在Encode选择：Base64 encode？
<br>答：1. Add prefix：admin: -这是前缀，会自动拼接到 payload前面。 -结果就是 admin: + pass123 = admin:pass123（这就是 username:password 的正确格式）。
<br>2. Encode：Base64 - 把上面拼接好的字符串再做 Base64编码。 -最终发送的 Header就变成了 Authorization: Basic YWRtaW46cGFzNTEy，完全符合服务器要求。
## 本题的核心逻辑：

<br>本题的核心是识别并利用 HTTP Basic Authentication。请求通过  Authorization: Basic  携带认证信息，认证内容由用户名和密码组成，并经过 Base64 编码。由于 Base64 可逆，且题目提供了密码对照表，可以固定用户名为  admin ，依次组合候选密码并编码后发送请求。

<br>根据第 29 条 Payload 为  YWRtaW46NjQzMjE=  且响应状态为  200 ，可以推断该候选认证信息通过了服务器校验，并因此在响应中获得 flag。


## 笔记

这道题主要学习了：
<br>1.HTTP基础认证机制，遇到需要账号密码的 Web 题目时，可以先观察请求和响应，确认认证方式、认证头以及失败和成功响应之间的差异，再选择合适的测试策略。
<br>2.Basic Authentication 的关键是用户名和密码组合后的 Base64 编码。理解这一格式后，可以在代理工具中配合字典和编码功能批量构造候选认证凭据。
<br>3.爆破方法


---
layout: writeup
tags: [pikachu, 越权]

title: "Pikachu Lab Report - 水平越权"
date: 2026-11-22

pikachu_skill: "over-permission/horizontal"
completed: false
module: "越权"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 水平越权

## 实验模块

模块：越权

场景：水平越权

## 漏洞场景

题目名称：水平越权；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 op1\_login.php 和 op1\_mem.php，但没有登录测试账号、修改 username 参数或查看其他测试用户资料。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前登录入口为 /pikachu/vul/overpermission/op1/op1\_login.php。页面提示提供 lucy、lili、kobe 三个本地测试账号，密码均为 123456。登录成功后，服务端把当前 username 和密码摘要保存到 $\_SESSION['op']，并跳转到 op1\_mem.php。
<br>2. op1\_mem.php 会调用 check\_op\_login() 确认请求者已经登录，但查询个人资料时没有使用 Session 中的当前用户名。源码读取 GET 参数 username，拼接查询 select * from member where username='$username'，然后输出姓名、性别、手机、地址和邮箱。
<br>3. 页面表单虽然把 $\_SESSION['op']['username'] 放进 hidden 输入框，但隐藏字段仍由浏览器提交，用户可以修改。建议在隔离靶场中以 lucy 登录，正常请求形如 op1\_mem.php?username=lucy&submit=点击查看个人信息，再发送到 Burp Repeater。
<br>4. 将 username 改为另一个题目自带账号，例如 lili，并保持同一登录 Session。如果响应理论上返回 lili 的资料，就说明服务端只验证了“是否登录”，没有验证 lucy 是否有权访问 lili 这一对象。本篇没有发送修改后的请求，因此不声称已经读取到资料。
<br>5. 验证时应分别保存当前用户基线和修改对象参数后的响应，确认 Cookie 没有变化、唯一变量是 username。不要使用真实用户数据；靶场自带测试账号已经足以说明对象级授权缺失。

## 其他观察

水平越权发生在权限级别相同的用户之间，问题不是登录失效，而是对象所有权没有绑定。hidden 输入框、只读控件或前端按钮都不能保护 username；攻击者可以直接修改 URL 或重放请求。参数已经经过 escape() 只能降低 SQL 注入风险，不能替代授权检查。


## 分析与解答

### 1.

<br>问题：已经调用 check\_op\_login()，为什么仍然越权？
<br>解答：该检查只能证明请求者拥有一个有效登录状态，不能证明请求者有权访问 GET 参数指定的用户。认证和对象授权是两个不同步骤。

### 2.

<br>问题：隐藏字段为什么不安全？
<br>解答：hidden 只是不在普通界面中显示，字段仍存在于 HTML 和请求中，可以被开发者工具、Burp 或自定义请求任意修改。

### 3.

<br>问题：对 username 做 SQL 转义能修复越权吗？
<br>解答：不能。转义解决的是输入进入 SQL 语法的问题，越权需要检查目标对象是否属于当前 Session 用户。两种安全控制不能互相替代。


## 漏洞原理与修复思路

<br>核心数据流是已登录 Session → 客户端 username 参数 → member 查询 → 个人资料输出。服务端把“要查看谁”交给客户端决定，却没有把查询条件绑定到当前身份，因此同级用户可以替换对象标识访问其他记录。

<br>修复时应从服务端 Session 取得当前用户身份，并以 Session 用户作为查询条件；如果业务允许管理员查询其他用户，应在统一授权层明确检查角色和对象范围。对所有查看、修改、删除接口执行相同的对象级权限校验，并使用不可预测 ID 作为附加防护，但不能依赖 ID 难猜来代替授权。


## 学习总结

本次靶场实验主要学习了：

<br>1. 登录成功只代表身份认证通过，不代表可以访问任意用户对象。
<br>2. 当前源码确认资料查询信任 GET username，而没有绑定 Session 用户；本篇尚未实际修改参数。
<br>3. 水平越权的正确修复点是服务端对象级授权，而不是隐藏字段或 SQL 转义。

---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - “insert/update”注入"
date: 2026-11-19

pikachu_skill: "sql-injection/insert-update"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - “insert/update”注入

## 实验模块

模块：SQL注入

场景：“insert/update”注入

## 漏洞场景

题目名称：“insert/update”注入；平台：Pikachu；方向：Web。

当前版本把注册时的 INSERT 与会员资料修改时的 UPDATE 放在同一个子实验和同一个 Skill 中。UPDATE 已有真实实验记录；INSERT 部分以下仅作源码原理分析和建议验证步骤，不描述为已实操成功。

## 测试过程

<br>1. 已实操的 UPDATE 路径位于 /pikachu/vul/sqli/sqli\_iu/sqli\_edit.php。登录会员中心后，修改资料的 POST 请求包含 sex、phonenum、add、email 和 submit，其中 add 对应住址。
<br>2. UPDATE 源码使用 $getdata=$\_POST;，并直接拼接 $query="update member set sex='...',phonenum='...',address='...',email='...' where username='会话用户名'";。原本的 escape() 调用已被注释，因此 add 等字段可以改变 SQL 字符串结构。
<br>3. 实际测试中，第一次修改 add 后出现 SQL syntax error；重新检查引号闭合并调整参数后，请求返回 302，Location 指向 sqli\_mem.php。浏览器跟随重定向后，会员中心的住址实际由 test 变为 sqli\_true，其他资料保持不变，说明 UPDATE 注入已被验证。
<br>4. INSERT 路径位于 /pikachu/vul/sqli/sqli\_iu/sqli\_reg.php。源码同样直接读取 $getdata=$\_POST;，然后拼接 INSERT INTO member(username,pw,sex,phonenum,email,address) VALUES(...)。username、password、sex、phonenum、email、add 都进入字符串值，且转义代码被注释。
<br>5. 建议验证 INSERT 时，先在隔离的本地数据库中用普通注册建立基线，再在 Burp Repeater 中给某个非关键字段加入单引号，例如 add=test'，观察 execute() 是否返回 SQL syntax error。该步骤只用于确认闭合位置；若要继续构造可执行 Payload，应使用专门测试账号，并在实验后清理测试数据。本次没有记录 INSERT 成功注入结果。

## 其他观察

UPDATE 请求成功后可能返回 302，而不是直接在响应正文显示修改结果，所以要同时检查 Location 和重定向后的会员资料。INSERT 页面只有 username 和 password 做非空判断，其余字段并没有安全处理。Burp 中应保留完整表单字段，否则请求可能先被业务校验拦截，无法到达 SQL 执行位置。


## 分析与解答

### 1.

<br>问题：为什么 INSERT 和 UPDATE 共用一个 Skill？
<br>解答：当前 Pikachu 菜单把两条路径放在同一个“insert/update”子实验中，博客路线和 CTF Mentor 也只定义 sql-injection/insert-update 一个节点，因此不应重复创建两篇文章。

### 2.

<br>问题：UPDATE 为什么要关注 302 重定向？
<br>解答：源码在受影响行数为 1 或 0 时跳转到 sqli\_mem.php。是否真正修改成功，需要查看跳转后的字段值，不能只凭 302 判断。

### 3.

<br>问题：INSERT 部分为什么只写原理分析？
<br>解答：现有证据只包含 UPDATE 的成功结果，没有 INSERT 的成功请求、响应或数据库记录。为了不虚构实操，本篇只依据当前源码给出建议验证步骤。


## 漏洞原理与修复思路

<br>核心问题是两条写入语句都把 $\_POST 数组中的值直接放入 SQL。UPDATE 可被输入中的引号改变 SET 或 WHERE 结构；INSERT 可被引号和逗号改变 VALUES 中的值与表达式。写入类注入可能直接污染或破坏数据，风险高于只读查询。

<br>修复时应分别为 INSERT 和 UPDATE 使用预处理语句，并为性别、手机号、邮箱等字段设置服务端白名单或格式校验。数据库账户应采用最小权限，错误信息应记录到服务端日志而不是展示给用户。业务层的受影响行数判断只能处理结果，不能防止 SQL 注入。


## 学习总结

本次靶场实验主要学习了：

<br>1. UPDATE 已实际验证，证据是请求、302 跳转和资料字段的真实变化。
<br>2. INSERT 已通过当前源码确认存在直接拼接，但尚未完成成功利用，仅保留原理分析和建议步骤。
<br>3. 当前版本应保留一个 sql-injection/insert-update 节点，由一篇文章同时说明两条路径。

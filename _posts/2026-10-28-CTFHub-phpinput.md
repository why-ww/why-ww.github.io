---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - php://input"
date: 2026-10-28

skill: "web-rce/php://input"
completed: true
---

# CTFHub Writeup - php://input

## 题目类型

Web

## 题目描述

<?php
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
<a href="phpinfo.php">phpinfo</a>
i don't have shell, how to get flag?
phpinfo

## 解题过程

<br>1. 查看题目源码与页面提示：源码在 file 参数存在时检查其前 6 个字符是否为 php://，满足才 include，否则输出 Hacker\!\!\!；否则高亮当前文件。页面底部给出 phpinfo.php 链接。phpinfo 中记录到 PHP 5.6.40、allow\_url\_fopen On、allow\_url\_include On。
<br>2. 理解 php:// 流包装器：php://input 表示 POST 请求的原始 body，只读一次；include 不区分磁盘文件和流，会读取内容并交给 PHP 解析，因此 include('php://input') 等价于把 POST 内容当作 PHP 文件执行。
<br>3. 使用 curl 请求 ?file=php://input，并通过 --data-binary 提交 \<?php system('id'); ?\>，返回 uid=33(www-data) gid=33(www-data) groups=33(www-data)，确认代码执行。
<br>4. 随后将 --data-binary 内容改为 \<?php system('ls /'); ?\>，根目录列表中看到 flag\_30683；再改为 \<?php echo file\_get\_contents('/flag\_30683'); ?\>，读取到 ctfhub\{085340a5417d913bdf100d19\}。

## 疑问与解答

### 1.

<br>问题：为什么 php://input 能配合 include 执行代码？
<br>解答：php://input 是 PHP 的流包装器，读取的是 POST 请求体；include 会把读到的内容按 PHP 代码解析。当 allow\_url\_include 开启时，这种流包含才可用，因此提交的 PHP 标签会被执行。

### 2.

<br>问题：源码里的 substr 检查起什么作用？
<br>解答：它只允许 file 参数以 php:// 开头，其他路径会输出 Hacker\!\!\!。本题直接把 php://input 作为合法入口，不是绕过该检查，而是利用被允许的 PHP 流包装器。

### 3.

<br>问题：读取 flag 时为什么可以用 file\_get\_contents？
<br>解答：file\_get\_contents 在 PHP 中读取文件内容并返回，适合直接读取已知路径；system 则执行系统命令并输出命令结果。记录中先用 system 执行 id 和 ls 验证与定位，再用 file\_get\_contents 读取 flag 文件。


## 本题的核心逻辑：



<br>该题的利用链是文件包含配合 PHP 流包装器：file 参数被限制为 php:// 开头，php://input 可读取 POST 原始 body；当 allow\_url\_include 为 On 时，include 会把 POST body 当作 PHP 代码解析，从而获得 PHP 代码执行。执行 id 可确认 Web 进程权限，列根目录可定位 flag 文件，读取文件内容即可取得 flag。


## 笔记

这道题主要学习了：

<br>1. php://input 是 PHP 内置流包装器，读取 POST 请求的原始 body；include 只负责读取内容并解析，因此流包装器可以把请求体变成可执行 PHP 代码。该利用需要 allow\_url\_include 开启。
<br>2. 文件包含到命令执行再到文件读取是常见链路：先用 system('id') 验证代码执行，再用 system('ls /') 定位 flag 文件，最后用 file\_get\_contents 读取目标文件内容。
<br>3. 后续可继续学习 php://filter、data://、file:// 等 PHP 流包装器的用途与限制，并理解 allow\_url\_include 对远程包含和 php://input 的影响。

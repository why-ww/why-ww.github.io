---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - Stash"
date: 2026-10-25

skill: "web-git/Stash"
completed: true
---

# CTFHub Writeup - Stash

## 题目类型

Web

## 题目描述

题目名称：Stash；平台：CTFHub；方向：Web

## 解题过程


<br>1. 进入题目环境后，页面只显示 Where is flag?，未记录到其他可见内容。
<br>2. 先设置目标变量 U=http://challenge-f09d5ce4a54b8c77.sandbox.ctfhub.com:10800，后续用该变量访问目标。
<br>3. 用 curl -si $U/ 请求首页，返回 HTTP/1.1 200 OK、Server: openresty/1.21.4.2，正文包含 \<h1\>Where is flag?\</h1\>。
<br>4. 请求 $U/.git/HEAD 返回 HTTP/1.1 200 OK，内容为 ref: refs/heads/master，说明该 Git 元数据文件可被直接读取。
<br>5. 请求 $U/.git/ 返回 HTTP/1.1 403 Forbidden，响应页显示 nginx/1.16.1。
<br>6. 继续读取 Git 引用：$U/.git/refs/stash 返回 6b2cf592e2de398eec7732de59c925745a0f136b，$U/.git/refs/heads/master 返回 d49cf8549d2c8bbccf54dd243056e8c27bd446e8。
<br>7. $U/.git/logs/HEAD 记录了 init、add flag、reset: moving to HEAD、remove flag 等历史，记录中备注有 stash 说明 flag 只是被移出工作区而没有被真正删除。
<br>8. 执行 pip install git-dumper，并用 git-dumper $U/.git/ ./repo 将 .git 拉取到本地，得到可操作的 Git 仓库。
<br>9. 进入 repo 后运行 git log --all --oneline --decorate，看到 d49cf85 remove flag、6b2cf59 refs/stash WIP on master: bc17ade add flag、bc17ade add flag、5cca10c index on master、e622329 init；git stash list 显示 stash@\{0\}: WIP on master: bc17ade add flag。
<br>10. 运行 git stash show -p，diff 显示 13653208504346.txt 的内容由 where is flag 变为 ctfhub\{22d6126c9bc9d70090fe16d5\}，从而得到 flag。

## 疑问与解答

### 1.

<br>问题：git stash 保存的改动为什么还能恢复？
<br>解答：git stash 不会把改动直接丢弃，而是把工作区和索引状态记录成 Git 对象；在仓库中可通过 .git/refs/stash、git stash list 和 git stash show -p 定位并查看被暂存的差异。



### <br>2.

<br>问题：为什么访问 /.git/ 返回 403，而 /.git/HEAD 能返回内容？
<br>解答：这通常表示服务器禁止目录列表，但未禁止访问目录下的具体文件；因此目录列举会失败，而约定路径的 Git 文件仍可能被直接读取。



### <br>3.

<br>问题：首页只有 Where is flag? 说明什么？
<br>解答：这可能说明 flag 不在当前工作区展示的页面里，而是残留在历史提交或被 stash 的版本中；本题后续在 stash diff 中找到 flag，符合这一推断。


## 本题的核心逻辑：




<br>本题的核心是 Web 根目录暴露 .git 导致源码与版本历史泄露。HEAD 返回 ref: refs/heads/master，说明 .git/HEAD 可读；目录 /.git/ 被 403 拒绝只影响目录列表，不妨碍直接访问具体 Git 文件。

<br>Git 的 stash 引用保存在 .git/refs/stash，并可通过 git stash list 查看。stash 会把工作区和索引状态记录为 Git 对象，所以即使当前分支已经 remove flag，暂存记录仍可能保留添加 flag 时的内容。

<br>利用 git-dumper 可以把暴露的 .git 目录逐文件拉取并重建为本地仓库，再通过 git log --all 和 git stash show -p 查看所有引用及 stash 差异；本题最终从 diff 中读出 ctfhub\{22d6126c9bc9d70090fe16d5\}。


## 笔记

这道题主要学习了：

<br>1. Git 泄露排查可以先确认 /.git/HEAD 是否可读，再检查 refs、logs 和 objects；目录 403 不代表具体文件不可访问，两者要分开判断。
<br>2. git stash 不是删除操作，暂存内容会进入仓库引用；排查时用 git stash list 和 git stash show -p 往往能直接看到被隐藏的改动。
<br>3. 复原 .git 后可借助 git log --all --oneline --decorate 查看所有引用，避免只盯着当前分支而漏掉 stash、悬空提交等历史对象。

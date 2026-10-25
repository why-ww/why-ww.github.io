---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - Index"
date: 2026-10-25

skill: "web-git/Index"
completed: true
---

# CTFHub Writeup - Index

## 题目类型

Web

## 题目描述

当前大量开发人员使用git进行版本控制，对站点自动部署。如果配置不当,可能会将.git文件夹直接部署到线上环境。这就引起了git泄露漏洞。请尝试使用BugScanTeam的GitHack完成本题

## 解题过程

<br>1. 将目标地址设置为变量：B=http://challenge-fc85a813811978d5.sandbox.ctfhub.com:10800。
<br>2. 探测泄露并读取提交链：访问 $B/.git/HEAD 得到 ref: refs/heads/master；访问 $B/.git/logs/HEAD 得到初始提交 427355e118ab1a078a6235b20d13103f51d94e26（init）和后续提交 d41f9e85bc18d5779a3c6b0d5cdadd4170aaaabb（add flag）。读取 $B/.git/COMMIT\_EDITMSG（记录为 9 字节）得到 add flag，读取 $B/.git/refs/heads/master 得到 d41f9e85bc18d5779a3c6b0d5cdadd4170aaaabb。
<br>3. 创建本地 git 目录并初始化，定义 g 函数按对象哈希前两位创建 .git/objects 子目录并从远端下载对象。下载 d41f9e85bc18d5779a3c6b0d5cdadd4170aaaabb 后，git cat-file -p d41f9e8 显示该提交的 tree 为 77aac04b110a5f31104cfeb299fc6b6689c872eb，parent 为 427355e118ab1a078a6235b20d13103f51d94e26，提交信息为 add flag。随后下载 77aac04b110a5f31104cfeb299fc6b6689c872eb，git cat-file -p 77aac04 显示三个文件：10465135109968.txt（blob 29b61182726ca43efc598176712500beab80e1bb）、50x.html（blob 9071e0a24f654c88aa97a2273ca595e301b7ada5）、index.html（blob 2c59e3024e3bc350976778204928a21d9ff42d01）。
<br>4. 下载 blob 29b61182726ca43efc598176712500beab80e1bb，执行 git cat-file -p 29b6118，输出 ctfhub\{fe227a7df108f40727ae3236\}。

## 疑问与解答

### 1.

<br>问题：为什么读取 .git/HEAD、.git/logs/HEAD 和对象文件就能还原仓库内容？
<br>解答：HEAD 指向当前分支，refs/heads/master 给出分支当前提交，logs/HEAD 记录提交链；Git 对象按内容哈希存放，提交对象指向 tree，tree 列出文件名和 blob 对象 ID，按对象 ID 下载后用 git cat-file 解码即可得到文件内容。

### 2.

<br>问题：Git 对象路径为什么要把哈希前两位作为目录、其余作为文件名？
<br>解答：这是 Git 的松散对象存储布局，例如哈希 29b611... 会存为 .git/objects/29/b611...；前两位作为目录可以分散文件、避免单目录对象过多。知道这个布局后，就能根据对象 ID 构造下载路径。


## 本题的核心逻辑：

本题的核心是 .git 目录被部署到 Web 根目录后形成的源码与历史泄露。Git 使用内容寻址对象存储提交、树和文件内容；暴露 .git/HEAD、.git/logs/HEAD、.git/refs 与 .git/objects 后，可以按哈希逐层获取 commit→tree→blob，进而恢复历史文件中的敏感信息。该题中证据显示提交说明为 add flag，最终从 tree 中的 blob 取得 flag。


## 笔记

这道题主要学习了：

<br>1. Git 泄露利用的关键是理解三类对象：commit 记录 tree、parent 和提交信息，tree 记录路径与 blob/tree 的映射，blob 保存文件内容。只要能访问 .git/objects 下的对象，就能按哈希逐层还原仓库，而不一定需要完整克隆。
<br>2. 手工利用时，可以先从 .git/HEAD、refs 和 logs/HEAD 定位提交，再按“提交对象→树对象→目标 blob”的顺序下载对象，并用 git cat-file -p 查看内容。

---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - SVN泄露"
date: 2026-10-25

skill: "web-leak/SVN泄露"
completed: true
---

# CTFHub Writeup - SVN泄露

## 题目类型

Web

## 题目描述

题目名称：SVN泄露；平台：CTFHub；方向：Web。

## 解题过程

<br>1. 先判断是否存在 .svn 泄露：使用 curl -i 请求 http://TARGET/.svn/entries、http://TARGET/.svn/wc.db 和 http://TARGET/.svn/format。记录显示，对 /.svn/entries 与 /.svn/wc.db 的请求均返回 HTTP 200。
<br>2. 随后下载 wc.db 并解析：执行 curl -O http://TARGET/.svn/wc.db，然后用 sqlite3 查看 .tables，并查询 NODES 表的 local\_relpath、kind、checksum、revision、presence 字段，以及 PRISTINE 表的 checksum、size、refcount 字段。
<br>3. 根据 .svn-base 的路径规则 pristine/\<SHA1 前 2 位\>/\<完整 SHA1\>.svn-base，将校验和 d865351b55e8f8d7e50ece7ef0a19c8f941bfcc8 拼成 http://TARGET/.svn/pristine/d8/d865351b55e8f8d7e50ece7ef0a19c8f941bfcc8.svn-base，下载为 flag.svn-base 后用 cat 查看，得到 ctfhub\{ab21cf6df560d7e78f52c3f8\}。

## 疑问与解答

### 1.

<br>问题：pristine/\<SHA1 前 2 位\>/\<完整 SHA1\>.svn-base 这条路径规则是什么意思？
<br>解答：SVN 1.7+ 的工作副本把原始文件内容按内容 SHA1 寻址存储；pristine/ 是原文对象根目录，前 2 位十六进制用于分桶，完整 SHA1 加 .svn-base 后缀对应具体原文对象。取文件时要先从 wc.db 的 NODES 或 PRISTINE 表拿到 checksum，去掉 $sha1$ 前缀后再拼接路径。

### 2.

<br>问题：如果只知道工作副本里的文件名是 flag.txt，能否直接猜出对应的 .svn-base URL？
<br>解答：通常不能。因为 1.7+ 的 pristine 路径由文件内容的 SHA1 决定，而不是由文件名决定；不知道内容摘要，就无法确定分桶目录和 40 位对象名。必须先读取 wc.db 中的 checksum，才能拼出可请求的 URL。

### 3.

<br>问题：为什么探测 .svn 时要同时关注 entries 和 wc.db？
<br>解答：它们对应不同代的 SVN 工作副本结构。旧版本使用 entries 以及 text-base/原文件名.svn-base，1.7+ 使用 wc.db 与 pristine/哈希.svn-base；判断结构后才能选择正确的原文文件路径规则。


## 本题的核心逻辑：


SVN 泄露的危险点在于 .svn 目录可能暴露工作副本的元数据和原文对象。1.7+ 的 wc.db 保存 NODES、PRISTINE 等元数据，pristine/ 则按内容 SHA1 存放原文；拿到 wc.db 中的 checksum 后，就能按 pristine/\<前2位\>/\<完整SHA1\>.svn-base 取回原始内容。

本题中，/.svn/wc.db 返回 HTTP 200 说明该元数据文件可被访问；在解析 wc.db 后，记录中按校验和 d865351b55e8f8d7e50ece7ef0a19c8f941bfcc8 构造 pristine 对象 URL，最终下载到包含 flag 的原文对象。这说明泄露不只暴露文件名列表，还可能直接暴露可读的文件内容。


## 笔记

这道题主要学习了：

<br>1. 内容寻址存储用内容哈希决定存储路径，因此天然支持去重和完整性校验；SVN 1.7+ 的 pristine 目录正是这一思路，前两位哈希分桶用于避免单目录文件过多。
<br>2. 做 SVN 泄露题时，先探测 .svn/entries 和 .svn/wc.db 判断版本与可利用性，再解析 wc.db 的 NODES、PRISTINE 表获取 checksum，最后按 pristine 路径规则下载原文对象。

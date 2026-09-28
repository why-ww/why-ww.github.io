---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 网站源码"
date: 2026-09-28

skill: "web-backup/网站源码"
completed: true
---

# CTFHub Writeup - 网站源码

## 题目类型

Web

## 题目描述

<br>备份文件下载 - 网站源码

<br>可能有点用的提示

<br>常见的网站源码备份文件后缀
<br>tar
<br>tar.gz
<br>zip
<br>rar
<br>常见的网站源码备份文件名
<br>web
<br>website
<br>backup
<br>back
<br>www
<br>wwwroot
<br>temp

## 解题过程

<br>1. 由于网页上没有可操作的项目，尝试通过抓包查看请求和返回内容。
<br>2. 查看抓包返回的信息后，根据页面提示将备份文件后缀加入 URL，但初次访问的 URL 都不存在。
<br>3. 继续按照提示，将 web.zip、website.zip、backup.zip、back.zip、www.zip、wwwroot.zip 和 temp.zip 等文件名组合加入 URL进行尝试。
<br>4. 之后获得了一个包含 flag 的 txt 文件，并复制该文件名，在浏览器中访问靶场 URL 加上该文件名。
<br>5. 访问对应 URL 后获得 flag。

## 疑问与解答

### 1.
<br>问：为什么抓到 HTTP/1.1200 OK还不能说明找到了备份文件？
<br>答：需要结合 Content-Type、Content-Length 和响应正文判断实际内容。若响应仍是 text/html，长度也与原提示页一致，那么它可能只是统一返回的 HTML 页面，而不是压缩包或源码备份。



### <br>2.

<br>问：这道题的提示应该如何使用？
<br>答：可以把提示中的常见备份文件名与 tar、tar.gz、zip、rar 等后缀组合，作为 URL 路径进行定向验证。网站源码备份文件若被放在 Web 根目录且未限制访问，就可能通过直接请求文件名下载。



### 3.

<br>问：为什么获得 flag 文件名后还要再次访问 URL？
<br>答：题目记录显示 flag 位于一个 txt 文件中；将该文件名拼接到靶场 URL 后直接访问，可以读取该静态文件的内容。


## 本题的核心逻辑：



<br>本题利用的是网站源码备份文件暴露问题：开发或部署过程中产生的压缩备份如果被放在 Web 可访问目录，且服务器没有禁止静态下载，攻击者就可能通过常见文件名和后缀猜测其路径，进而获取源码或其中生成的敏感文件。

<br>实际解题过程从抓包获取页面提示开始，随后根据提示尝试备份文件名组合，最终获得 flag 的 txt 文件并通过其文件名访问靶场 URL 得到 flag。


## 笔记

这道题主要学习了：
<br>1. 面对只有提示信息的 Web题目，可以从页面源码、网络请求和响应内容入手，再结合题目给出的命名规律进行有针对性的路径验证。
<br>2. 判断路径是否命中真实文件时，应综合比较响应类型、大小和正文内容，避免把统一返回的 HTML 页面误认为目标文件。

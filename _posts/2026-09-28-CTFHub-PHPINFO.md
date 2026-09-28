---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - PHPINFO"
date: 2026-09-28

skill: "web-leak/PHPINFO"
completed: true
---

# CTFHub Writeup - PHPINFO

## 题目类型

Web

## 题目描述

PHP Version数据表

## 解题过程

1. 进入 PHPINFO 页面后，页面展示了 PHP Version 及相关数据。
2. 向下浏览至 Environment 区域，在其中的 flag 项找到了 flag。

## 疑问与解答

### 1.

<br>问题：这道题想教我们什么？
<br>解答：本题训练的是从 PHPInfo 调试信息中定位敏感数据，并理解公开 phpinfo() 页面会造成服务器配置和环境变量泄露。



### 2.

<br>问题：为什么 Environment 区域可能出现 flag？
<br>解答：phpinfo() 能展示 PHP 进程可读取的环境变量；如果应用将 flag、密钥或令牌存入环境变量，它们就可能随调试页面直接暴露。

<br>

### <br>3.

<br>问题：真实环境应如何防御？
<br>解答：生产环境应删除或限制访问 PHPInfo 测试页面，避免在可被输出的位置保存敏感数据，并对已经暴露的密钥及时进行轮换。


## 本题的核心逻辑：


<br>phpinfo() 会集中输出 PHP 版本、扩展、配置路径、请求信息和环境变量等运行数据。若该页面可以被未授权访问，攻击者便能够直接收集服务器内部信息。

<br>本题的关键不是利用复杂 Payload，而是检查 PHPInfo 页面中的各个信息区块，并在 Environment 区域识别被直接展示的 flag。漏洞本质是调试页面暴露导致的敏感信息泄露。


## 笔记

这道题主要学习了：

<br>1. PHPInfo 页面不仅显示 PHP 版本，还可能暴露 php.ini 路径、网站目录、临时目录、已加载扩展和关键安全配置。
<br>2. 环境变量可能保存数据库密码、API Key、Token 等敏感内容，因此检查 Environment 区域是审计 PHPInfo 信息泄露时的重要步骤。
<br>3. PHPInfo 信息泄露通常是后续攻击的信息收集入口；学习时应继续关注版本识别、路径泄露、配置审计以及敏感凭据暴露风险。

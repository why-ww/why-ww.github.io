---
layout: writeup
tags: [pikachu, 文件包含]

title: "Pikachu Lab Report - 远程文件包含"
date: 2026-11-22

pikachu_skill: "file-inclusion/remote"
completed: false
module: "文件包含"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 远程文件包含

## 实验模块

模块：文件包含

场景：远程文件包含

## 漏洞场景

题目名称：远程文件包含；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 fi\_remote.php，但没有开启 PHP 远程包含配置，没有请求外部地址，也没有记录远程内容的执行或回显。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前入口为 /pikachu/vul/fileinclude/fi\_remote.php，页面使用 GET 表单提交 filename 和 submit。正常选项使用 include/file1.php 至 include/file5.php。
<br>2. 源码读取 $filename=$\_GET['filename']; 后直接执行 include "$filename"，没有协议限制、主机限制或文件名白名单。与本地包含不同，这里没有固定的 include/ 前缀。
<br>3. 页面会检查 allow\_url\_include 和 allow\_url\_fopen；未开启时显示警告。远程 URL 能否被 include() 获取和解释取决于 PHP 版本、URL 包装器及 php.ini 配置，修改配置后还需要重启 PHP 或 Web 服务。
<br>4. 建议只在隔离网络中启动一个自己控制的 HTTP 服务，并提供内容仅为 RFI\_TEST 的纯文本文件。然后在 Burp Repeater 中把 filename 改为该测试文件的 URL，同时保留 submit 参数；不要使用公网第三方地址，也不要提供可执行 PHP 代码。
<br>5. 若配置和网络均满足条件，纯文本标记应进入页面响应。Docker 部署中还要注意容器内的 127.0.0.1 指向容器本身，测试服务需要使用容器可以访问的地址或同一 Docker 网络中的服务名。本篇没有进行配置修改或请求，所以不声称远程包含成功。

## 其他观察

远程文件包含除了代码本身，还依赖运行环境。现代 PHP 通常默认关闭 allow\_url\_include，因此“源码存在危险 include()”与“当前环境能够通过 HTTP 远程包含”需要分开判断。即使 HTTP URL 被禁用，未限制的 include() 仍可能保留本地路径或其他流包装器风险，不能把默认配置当成代码层修复。


## 分析与解答

### 1.

<br>问题：allow\_url\_include 关闭时，是否可以把漏洞标记为已修复？
<br>解答：不能。关闭配置会阻止常见 URL 包装器参与 include()，属于重要的纵深防御，但源码仍把用户输入直接交给 include()，代码层的信任边界问题没有消失。

### 2.

<br>问题：为什么 Docker 中访问 127.0.0.1 经常失败？
<br>解答：请求由 PHP 所在容器发起，容器内的 127.0.0.1 指向容器自身，而不是宿主机。测试服务必须位于容器可达的地址上。

### 3.

<br>问题：只提供纯文本标记能验证什么？
<br>解答：它可以验证服务器是否按照用户控制的 URL 获取并包含远程内容，同时避免在靶场中执行额外 PHP 代码。确认数据流已经足以说明风险。


## 漏洞原理与修复思路

<br>核心数据流是 GET 参数 filename → include()。当 PHP 允许 URL 包装器参与文件包含时，服务端可能下载远程资源并在本地解释其中的 PHP 代码，从而把外部内容转化为服务器端代码执行。

<br>修复时应彻底取消用户对 include() 参数的直接控制，改用服务端固定文件映射和绝对路径白名单。生产环境保持 allow\_url\_include=Off，按需限制 allow\_url\_fopen，并限制服务器对外网络访问；但这些配置只能作为纵深防御，不能替代代码层的白名单设计。


## 学习总结

本次靶场实验主要学习了：

<br>1. 远程文件包含由危险代码路径与 PHP 配置、网络可达性共同决定。
<br>2. 当前源码确认 filename 被直接交给 include()，但本篇没有开启配置或发起远程请求。
<br>3. 正确防护是固定文件映射，同时保持远程 URL 包含关闭并限制出站访问。

---
layout: writeup
tags: [pikachu, 不安全下载]

title: "Pikachu Lab Report - 任意文件下载"
date: 2026-11-22

pikachu_skill: "unsafe-download/download"
completed: false
module: "不安全下载"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 任意文件下载

## 实验模块

模块：不安全下载

场景：任意文件下载

## 漏洞场景

题目名称：任意文件下载；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 down\_nba.php 和 execdownload.php，但没有修改 filename 下载项目外文件，也没有保存任何测试文件。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前展示页为 /pikachu/vul/unsafedownload/down\_nba.php。点击球员名字会请求 execdownload.php，例如 execdownload.php?filename=kb.png，filename 由 URL 查询参数提供。
<br>2. execdownload.php 直接构造 $file\_path="download/{$\_GET['filename']}"，随后进行 iconv()、file\_exists()、fopen() 和 filesize()。源码只检查组合路径是否存在，没有拒绝 ../，也没有确认规范化后的文件仍位于 download 目录。
<br>3. 建议先下载 kb.png 建立正常基线，再把请求发送到 Burp Repeater。为了避免读取系统敏感文件，可用 Pikachu 项目自带的 README.md 验证路径越界，例如 GET /pikachu/vul/unsafedownload/execdownload.php?filename=../../../README.md。
<br>4. 按当前目录结构推导，组合路径为 vul/unsafedownload/download/../../../README.md，规范化后指向项目根目录的 README.md。如果文件存在且运行账户可读，代码会以 application/octet-stream 返回内容，并使用 basename($file\_path) 生成下载文件名。
<br>5. 验证时应比较下载内容，而不能只看 HTTP 200 或附件名称。若出现“文件不存在”，应检查 ../ 层数、项目部署位置、iconv() 对路径的处理和文件权限。本篇没有实际发起越界下载，因此不记录成功结果。

## 其他观察

Content-Disposition 中使用 basename() 只会把响应里的附件名称变成 README.md，不会改变 fopen() 已经使用的真实路径，所以它不能阻止目录穿越。下载接口与文件包含的差别是：这里通常把目标作为字节流返回，不会主动解释其中的 PHP 代码；但源代码、配置文件和凭据仍可能因此泄露。


## 分析与解答

### 1.

<br>问题：代码调用了 file\_exists()，为什么仍然不安全？
<br>解答：file\_exists() 只判断攻击者构造后的路径是否存在，并不判断该路径是否属于允许下载目录。越界路径存在时，检查反而会继续进入下载流程。

### 2.

<br>问题：basename() 是否已经去除了 ../？
<br>解答：basename() 只用于生成响应头中的附件名称，真正打开文件的 fopen() 使用的是完整 $file\_path。它没有保护文件读取操作。

### 3.

<br>问题：为什么建议验证 README.md，而不是 /etc/passwd？
<br>解答：项目内已知存在的非敏感文件足以证明下载目录限制被绕过，验证结果更可控，也避免接触真实系统敏感数据。


## 漏洞原理与修复思路

<br>核心数据流是 GET 参数 filename → 拼接 download/ → fopen()。当 filename 可以包含 ../ 时，规范化后的路径可能离开预期下载目录，使任意可读文件被作为附件返回。

<br>修复时优先让客户端提交不可预测的文件 ID，由服务端查询固定文件记录，而不是接收路径。若必须处理文件名，应使用允许列表，调用 realpath() 得到规范化路径，并确认它以允许下载目录的真实路径加目录分隔符开头；同时拒绝绝对路径、路径分隔符和流包装器。下载目录应与应用源码和配置分离，运行账户只授予必要读取权限。


## 学习总结

本次靶场实验主要学习了：

<br>1. 文件存在性检查和附件名清理都不能替代下载目录边界校验。
<br>2. 当前源码确认 filename 被拼接后直接用于打开文件，但本篇尚未实际发起越界下载。
<br>3. 后续实操应使用项目内非敏感文件验证，并以下载内容而不是状态码判断结果。

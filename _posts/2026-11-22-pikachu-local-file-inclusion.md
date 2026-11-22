---
layout: writeup
tags: [pikachu, 文件包含]

title: "Pikachu Lab Report - 本地文件包含"
date: 2026-11-22

pikachu_skill: "file-inclusion/local"
completed: false
module: "文件包含"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 本地文件包含

## 实验模块

模块：文件包含

场景：本地文件包含

## 漏洞场景

题目名称：本地文件包含；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 fi\_local.php，但没有向本地靶场提交目录穿越参数，也没有记录被包含文件的输出。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前入口为 /pikachu/vul/fileinclude/fi\_local.php，页面使用 GET 表单提交 filename 和 submit。正常下拉选项是 file1.php 至 file5.php，用于显示不同球员内容。
<br>2. 源码读取 $filename=$\_GET['filename']; 后直接执行 include "include/$filename"。虽然代码固定添加了 include/ 前缀，但没有校验 filename，也没有启用源码中已经注释掉的文件名白名单。
<br>3. 建议先选择 file1.php 建立正常基线，再把请求发送到 Burp Repeater。为了避免读取操作系统敏感文件，可在本地 Pikachu 中使用项目自带的 README.md 作为标记目标，例如 filename=../../../README.md&submit=提交。
<br>4. 按当前目录结构推导，组合路径为 vul/fileinclude/include/../../../README.md。路径规范化后会回到 Pikachu 项目根目录的 README.md，include() 会读取该文件；纯文本内容通常会直接进入响应。
<br>5. 验证时应根据实际部署目录重新确认 ../ 的层数，并比较正常球员页面与测试响应。若只出现 include 警告，可能是路径层数错误、目标不可读或 PHP 错误显示设置不同。本篇没有发送请求，因此不声称 README.md 已被包含。

## 其他观察

固定拼接 include/ 并不能阻止目录穿越，因为 filename 中的 ../ 会在路径解析时返回上级目录。本地文件包含使用的是服务器本地路径，不要求开启 allow\_url\_include。include() 与普通文件读取也有区别：如果目标文件含有 PHP 代码，代码可能在当前脚本上下文中执行，而不只是显示源码。


## 分析与解答

### 1.

<br>问题：源码已经在 filename 前添加 include/，为什么还能越出目录？
<br>解答：include/ 只是字符串前缀。文件系统解析 ../ 时会回到父目录，连续使用多个 ../ 就可能离开预期的 include 目录。

### 2.

<br>问题：为什么建议先包含项目 README，而不是系统密码文件？
<br>解答：项目自带文本足以证明路径限制被绕过，影响更小，也不涉及读取真实系统敏感信息，适合本地靶场验证。

### 3.

<br>问题：页面没有显示文件内容，是否一定不存在漏洞？
<br>解答：不一定。路径层数、文件权限、目标文件类型和错误显示配置都会影响结果。应先确认服务端实际规范化路径，再使用已知存在且可读的测试文件验证。


## 漏洞原理与修复思路

<br>核心数据流是 GET 参数 filename → 拼接 include/ → include()。外部输入控制文件路径且没有白名单时，攻击者可以利用 ../ 改变规范化后的目标；若包含可执行 PHP 文件，还可能进一步造成代码执行。

<br>修复时应使用固定映射或白名单，例如只允许 file1.php 至 file5.php，并由服务端选项映射到绝对路径。不要把客户端文件名直接交给 include()；同时使用 realpath() 解析最终路径并确认它仍位于允许目录内，拒绝流包装器、空字节和路径分隔符。运行账户还应遵循最小文件权限。


## 学习总结

本次靶场实验主要学习了：

<br>1. 固定目录前缀不能代替路径规范化和允许列表校验。
<br>2. 当前源码确认 filename 直接进入 include()，但本篇尚未实际提交穿越路径。
<br>3. 后续实操可用项目内无敏感文本验证，并准确记录规范化后的目标路径。

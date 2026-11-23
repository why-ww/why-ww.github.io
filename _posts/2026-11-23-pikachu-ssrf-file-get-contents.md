---
layout: writeup
tags: [pikachu, SSRF]

title: "Pikachu Lab Report - SSRF（file_get_contents）"
date: 2026-11-23

pikachu_skill: "ssrf/file-get-contents"
completed: true
module: "SSRF"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - SSRF（file_get_contents）

## 实验模块

模块：SSRF

场景：SSRF（file_get_contents）

## 漏洞场景

题目名称：SSRF（file_get_contents）；平台：Pikachu；方向：Web。


## 测试过程

<br>1. 当前入口为 /pikachu/vul/ssrf/ssrf\_fgc.php。页面自带链接把 file 参数设置为当前部署路径下的 http://127.0.0.1/.../vul/ssrf/ssrf\_info/info2.php。
<br>2. 源码直接执行 $filename=$\_GET['file']; $str=file\_get\_contents($filename); echo $str;。file 参数既没有固定目录，也没有限制为普通本地文件，更没有验证 URL 的协议、主机或解析后的地址。
<br>3. 先点击项目自带链接。如果页面出现 info2.php 的内容，就说明当前 PHP 配置允许 file\_get\_contents() 通过 HTTP 包装器访问回环服务。远程 URL 是否可用还受 allow\_url\_fopen 配置影响，因此失败时应先检查配置，而不是直接认定代码没有风险。
<br>4. 进一步验证可把 file 改为同一隔离网络内自己控制的 HTTP 标记页，并同时观察响应与标记服务日志。不要使用真实内网服务或敏感文件；受控页面的唯一标记已经足以证明请求由服务器发出。
<br>5. 源码注释提到 php://filter 等流包装器，说明 file\_get\_contents() 的风险不只限于 HTTP SSRF。不过各包装器是否可用取决于 PHP 配置和参数形式。

## 其他观察

这一题与 cURL 题的漏洞边界相似，但底层能力和配置开关不同。file\_get\_contents() 使用 PHP stream wrapper；远程访问通常依赖 allow\_url\_fopen，超时、重定向和响应头处理也由流上下文决定。代码没有检查返回值，读取失败时可能只显示警告或空白，不能仅凭页面空白判断请求是否发送。


## 分析与解答

### 1.

<br>问题：参数名叫 file，为什么它可以访问 HTTP 地址？
<br>解答：file\_get\_contents() 接受的不只是文件系统路径，还可以通过已启用的 stream wrapper 处理 http://、https:// 等资源。变量名不会限制函数实际支持的资源类型。

### 2.

<br>问题：allow\_url\_fopen 关闭后是否完全安全？
<br>解答：它能阻止常见的远程 URL wrapper，但代码仍可能读取不应公开的本地路径，其他已注册包装器也需要评估。根本问题仍是不可信输入直接决定资源位置。

### 3.

<br>问题：为什么响应空白不能证明目标不可达？
<br>解答：目标可能返回空正文，函数也可能因超时、权限或配置失败而返回 false。应用没有区分这些情况，应结合受控服务日志、错误日志和明确的测试标记判断。


## 漏洞原理与修复思路

<br>核心数据流是 GET 参数 file → file\_get\_contents() → 资源内容 → echo。攻击者可以让服务器读取其网络环境可达的 URL；若本地路径或其他流包装器同时可用，风险还会扩展为文件读取或数据包装器滥用。

<br>修复时不要把完整资源地址交给客户端控制，应由服务端根据固定 ID 选择允许资源。确需获取外部内容时，使用专门的 HTTP 客户端并采用严格目标白名单，校验协议、DNS 解析结果、IPv4/IPv6 地址和每次重定向，设置超时与响应大小上限。若业务完全不需要远程文件，可关闭 allow\_url\_fopen；本地文件读取则应使用固定根目录、realpath() 边界检查和最小文件权限。网络层还应限制应用出站访问范围。


## 学习总结

本次靶场实验主要学习了：

<br>1. file\_get\_contents() 可通过 PHP 流包装器处理 URL，不能因为函数名中有 file 就只按本地文件评估。
<br>2. 当前源码把 file 参数直接传入函数并回显结果。
<br>3. 修复应使用服务端资源映射，并结合 URL/IP 校验、流配置、路径边界和出站网络限制。

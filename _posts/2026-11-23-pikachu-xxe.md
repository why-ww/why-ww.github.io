---
layout: writeup
tags: [pikachu, XXE]

title: "Pikachu Lab Report - XML 外部实体"
date: 2026-11-23

pikachu_skill: "xxe/xxe"
completed: false
module: "XXE"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - XML 外部实体

## 实验模块

模块：XXE

场景：XML 外部实体

## 漏洞场景

题目名称：XML 外部实体；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 xxe\_1.php，但没有向本地靶场提交包含 DTD 的 XML，也没有读取容器文件或发起外部实体请求。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前入口为 /pikachu/vul/xxe/xxe\_1.php。表单通过 POST 参数 xml 接收 XML 文本，提交按钮参数为 submit。源码将原始输入直接交给 simplexml\_load\_string($xml, 'SimpleXMLElement', LIBXML\_NOENT)。
<br>2. 建议先使用内部实体建立解析基线：声明一个值为 PIKACHU\_MARKER 的实体，再在根元素中引用它。若页面回显标记，说明 DTD 被处理且 LIBXML\_NOENT 进行了实体替换，但内部实体本身还不能证明外部资源已被读取。
<br>3. 验证外部实体时，不应读取 /etc/passwd 等真实敏感文件。可先在一次性靶场容器中创建仅含 PIKACHU\_XXE\_MARKER 的测试文件，再让 SYSTEM 标识符指向该文件的 file:// 绝对路径；或者指向自己控制的实验 HTTP 服务。
<br>4. 将 XML 通过表单或 Burp Repeater 发送后，观察响应中的 <pre> 是否出现标记，并检查受控 HTTP 服务是否收到来自 Pikachu 容器的请求。只有外部文件内容或受控回连出现，才能证明外部实体解析成功。本篇没有执行这些操作。
<br>5. 如果只看到“XML声明、DTD文档类型定义、文档元素这些都搞懂了吗?”，应检查 XML 是否只有一个根元素、实体声明和引用是否对应、file:// 路径是否为容器内绝对路径，以及当前 PHP/libxml 版本是否允许相应外部资源访问。

## 其他观察

LIBXML\_NOENT 的名称容易被误解，它实际上要求解析器替换实体。源码没有使用 LIBXML\_NONET，也没有在进入解析器前拒绝 DOCTYPE，因此用户可以影响解析器访问的资源。不同 PHP、libxml 版本和运行配置对外部实体、网络访问的默认行为可能不同，所以验证结论必须以当前容器的响应或受控回连为准。


## 分析与解答

### 1.

<br>问题：内部实体成功回显，是否等于 XXE 已经验证成功？
<br>解答：不完全等于。它只能确认 DTD 与实体替换生效；XXE 中的“外部”还需要 SYSTEM 或 PUBLIC 标识符实际访问文件、URL 等外部资源，并用安全标记证明这一点。

### 2.

<br>问题：为什么 XML 必须有根元素？
<br>解答：格式良好的 XML 文档只能有一个文档根元素。声明、DTD 和实体引用的层次不正确时，simplexml\_load\_string() 会解析失败，页面就进入错误提示分支。

### 3.

<br>问题：为什么同一 Payload 在不同环境中的结果可能不同？
<br>解答：PHP 与 libxml 的版本、外部实体加载策略、网络权限、文件权限和容器路径都会影响结果。源码存在危险配置不代表每种协议和目标在每个环境中都一定可达。


## 漏洞原理与修复思路

<br>核心数据流是 POST 参数 xml → simplexml\_load\_string() → DTD/实体解析 → 实体内容进入 SimpleXMLElement → 页面回显。攻击者控制 XML 文档，并可能让服务端解析器读取本地文件或访问服务端可达的网络资源。

<br>修复时应关闭业务不需要的 DTD 和外部实体功能，移除 LIBXML\_NOENT，使用安全的解析器配置，并在可用版本中禁止网络访问。对只需要固定字段的接口，可拒绝包含 DOCTYPE 或 ENTITY 的文档，再依据 XML Schema 或字段白名单验证结构。进程还应使用最小文件权限和受限出网策略，错误响应不要泄露解析器、路径或内部网络信息。


## 学习总结

本次靶场实验主要学习了：

<br>1. XXE 的关键不是普通 XML 标签，而是可控 DTD、外部实体和解析器配置共同形成的数据访问路径。
<br>2. 当前源码使用 LIBXML\_NOENT 解析并回显结果，但本篇尚未提交 XML 或观察受控回连。
<br>3. 安全验证应使用一次性标记文件或自有 HTTP 服务，修复应从解析器能力、输入约束和运行权限三层完成。

---
layout: writeup
tags: [pikachu, 文件上传]

title: "Pikachu Lab Report - 不安全文件上传"
date: 2026-11-22

pikachu_skill: "unsafe-upload/upload"
completed: true
module: "文件上传"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 不安全文件上传

## 实验模块

模块：文件上传

场景：不安全文件上传

## 漏洞场景

题目名称：不安全文件上传；平台：Pikachu；方向：Web。


## 测试过程

<br>1. 文件上传模块包含三条测试路径。clientcheck.php 只在浏览器端通过 checkFileExt() 限制 jpg、png、gif；后端 upload\_client() 不检查扩展名或内容，直接使用原文件名保存到 uploads 目录，并把保存路径显示在页面中。
<br>2. 先选择一个普通文本标记文件，例如内容为 UPLOAD\_TEST 的 upload-test.txt。浏览器界面会因扩展名不在允许列表中而阻止选择，但在本地靶场中可通过 Burp Repeater 重新构造 multipart/form-data 请求，或在开发者工具中移除 onchange 校验。若后端接受该文件，即可证明客户端校验不能构成安全边界。测试时保存原始 multipart 请求与服务器响应。
<br>3. servercheck.php 调用 upload\_sick()，服务端只检查 $\_FILES['uploadfile']['type'] 是否属于 image/jpg、image/jpeg、image/png。该 MIME 值来自客户端请求，可以在 Burp 中修改。建议仍使用无执行能力的文本标记文件，仅把 multipart 文件段的 Content-Type 改为 image/png，观察服务端是否只凭声明的 MIME 接受文件。
<br>4. getimagesize.php 调用更严格的 upload()：同时检查 HTTP POST 上传方式、扩展名、客户端 MIME、getimagesize() 结果、500 KB 大小限制，并生成随机文件名。使用正常 PNG 建立基线，再使用只追加无害文本标记的测试图片观察 getimagesize() 的边界；这只能说明图片解析检查不能识别所有附加内容，不等于已经获得代码执行。
<br>5. 验证时应记录原始 multipart 请求、服务端返回的保存路径、实际文件名以及上传目录是否能被 Web 直接访问。只有在服务器会把上传内容当成可执行脚本解析时，才能进一步判断为代码执行，并以服务器返回的保存路径和实际访问结果作为判断依据。

## 其他观察

三条路径展示了不同强度的校验：纯前端校验可以被直接绕过，只信任客户端 MIME 也不可靠，而扩展名、MIME、getimagesize()、大小限制和随机重命名组合起来更稳健，但仍需要配合不可执行的存储目录。验证上传缺陷不必上传 WebShell；无害文本标记已经足以证明校验边界或任意类型保存问题。


## 分析与解答

### 1.

<br>问题：为什么前端已经限制扩展名，后端仍然存在风险？
<br>解答：前端代码运行在用户可控制的浏览器中，可以被删除、修改或完全绕过。服务端仍会收到攻击者自行构造的 multipart 请求，因此必须独立完成校验。

### 2.

<br>问题：Content-Type 为 image/png 是否能证明文件是真图片？
<br>解答：不能。multipart 文件段的 Content-Type 由客户端填写，Burp 可以直接修改。服务端不能只依据该字段决定文件类型。

### 3.

<br>问题：getimagesize() 返回成功是否意味着文件绝对安全？
<br>解答：不是。它主要确认文件中存在可识别的图片结构，不能判断所有附加数据是否安全。最终风险还取决于扩展名、保存位置、服务器解析配置和后续文件处理方式。


## 漏洞原理与修复思路

<br>核心数据流是 multipart 文件 → $\_FILES → 校验函数 → move\_uploaded\_file() → Web 可访问目录。只要服务端信任客户端扩展名或 MIME，保留原文件名并把文件放入可执行目录，攻击者就可能让非预期内容被保存和访问。

<br>修复时应同时校验上传来源、文件大小、允许扩展名、真实 MIME 和文件结构；使用服务端生成的随机文件名，将上传文件保存到 Web 根目录之外或明确禁用脚本执行的目录。下载或展示时通过文件 ID 映射，不直接暴露物理路径，并对图片进行重新编码以丢弃附加内容。任何单一检查都不应被当成完整防线。


## 学习总结

本次靶场实验主要学习了：

<br>1. 文件上传安全必须由服务端控制，前端检查只能改善用户体验。
<br>2. 当前源码展示了客户端扩展名、可伪造 MIME 和 getimagesize() 三种不同校验边界。
<br>3. 安全方案需要校验、随机重命名、不可执行存储和最小权限共同配合。

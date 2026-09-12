---
layout: post
title: "BugKu CTF Writeup - POST"
date: 2026-9-11
---
# BugKu CTF Writeup - POST
## 题目类型
WEB
## 题目描述
出现代码
<br>$what=$_POST['what'];
<br>echo $what;
<br>if($what=='flag')
<br>echo 'flag{****}';
## 解题过程
1.尝试改变URL参数使用GET请求，无效
2.查询有关POST的资料，得知POST请求会将数据放在 请求体（body）里面，不在地址栏，网址看不到提交的内容。
3.win＋R打开【运行】输入cmd打开终端，输入curl -X POST -d "what=flag" http://XXXXXX（题目网址）到终端页面并运行
4.执行后页面直接输出 flag。
## 其他方法


## 疑问与解答
### 1.POST是什么，与GET有什么区别？
<br>GET、POST 都是 HTTP 请求方法，是浏览器和服务器之间传递数据的两种最常用方式。

<br>###GET的作用及特点：
<br>GET的作用：获取数据，其数据放在 URL 地址栏里，跟着网址一起发送。
<br>GET的特点：参数直接暴露在网址上，所有人看地址栏就能看见。

<br>###POST的作用及特点：
<br>POST的作用：提交数据，给服务器上传信息
<br>POST的特点：数据放在请求体（body）里面，不在地址栏，网址看不到提交的内容。
### <br>2.请求体是什么？
<br>HTTP 请求分为两大部分：<span style="color:blue">请求头（Header）</span>和 <span style="color:blue">请求体（Body）</span>
<br><span style="color:blue">请求头</span>：描述这次请求的基本信息（访问哪个网址、浏览器是什么、编码、Cookie 等）
<br><span style="color:blue">请求体</span>：就是放在请求头后面，用来存放 POST 提交的数据，GET 请求默认没有请求体。
<br>服务器的$_POST`就是专门读取请求体里的表单数据。
### <br>3.curl是什么？
<br>curl 是一个命令行工具，直接在终端发送 HTTP 请求，不用浏览器。
<br>在curl -X POST -d "what=flag" http://XXXXXX中：
<br>curl：调用这个工具
<br>-X POST：指定请求方法为 POST（默认 curl 是 GET）
<br>-d "what=flag"：-d 的全称是--data，后面引号里的内容就是 POST 的请求体
### <br>4.PHP怎么使用请求？
<br> $_GET 读取 GET URL 上的参数
<br> $_POST读取 POST 请求体里表单参数
<br>$_REQUEST同时读取 GET、POST、Cookie 参数（本题没用到）

## 本题的核心逻辑：
<br>服务器拿到 POST 参数what，判断值是否等于字符串flag，相等就输出 flag。
<br>这是最简单的服务端校验：判断客户端提交的数据，返回不同结果。

## 笔记
这道题主要学习了：
<br>1.GET与POST的差异（其参数放置位置不同），分别适用于什么环境
<br>2.HTTP 数据包结构：请求头 + 请求体
<br>3.提交 POST 请求的方式：curl 命令行
<br>$_POST只能读取 POST 请求体的数据，GET 参数无法被 $_POST 接收，必须构造 POST 请求携带请求体提交参数。

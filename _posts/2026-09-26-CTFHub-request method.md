---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 请求方式"
date: 2026-09-26

skill: "web-http/请求方式"
completed: true
---
# CTFHub CTF Writeup - HTTP 请求方法

## 题目类型
WEB

## 题目描述
网页上显示【HTTP Method is GET ，Use CTF**B Method, I will give you flag】


## 解题过程

<br>thought： 看到 HTTP Method is GET ，Use CTF\*\*B Method, I will give you flag 我认为应该使用CTFHub的请求方法

<br>thought： 与Bugku中的POST题目相似，可以用curl或者burp进行查找

<br>attempt： 使用curl 命令：curl -v -X CTFHUB http://challenge-fa44340e1e84d743.sandbox.ctfhub.com:10800/index.php

<br>attempt： 再使用burp抓包方法进行尝试：打开Burp Suite 开启拦截抓包，在浏览器启动SwitchyOmega (V3)插件更改模式为Proxy。 拦截之后将HTTP请求中的GET文件替换为 CTFHUB ，点击 Forward 发送HTTP请求，在HTTPhistory栏中找到历史请求，并在服务器返回的 Response 中 找到flag



## 本题的核心逻辑

HTTP的GET请求的使用

## 笔记

这道题主要学习了：
<br>1. HTTP GET请求的使用
<br>2. 使用终端curl执行GET请求的方法
<br>3. 使用burp发送GET请求的方法

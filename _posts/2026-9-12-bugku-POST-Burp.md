---
layout: post
title: "BugKu CTF Writeup - POST"
date: 2026-9-12
---
# BugKu CTF Writeup - POST
## 题目类型
WEB
## 题目描述
出现代码
<br>$what=$_POST[‘what’];
<br>echo $what;
<br>if($what==’flag’)
<br>echo ‘flag{**}’;
## 解题过程
<br>1.下载Burp Suite Community Edition （代理拦截 HTTP工具）
<br>2.安装浏览器扩展插件 witchyOmega(代理切换插件)
<br>3.Burp 代理检查，顶部点 Proxy → Settings 查看设置
<br>4.确认监听：127.0.0.1 端口 8080
<br>5.切回 Proxy 主页面，点击Intercept，打开 Intercept is on。
<br>6.开启浏览器代理，浏览器右上角点 SwitchyOmega 图标，选择 proxy
<br>7.在浏览器进入题目网址进行访问，让burp拦截数据包
<br>8.切回 Burp，会看到抓到了一条 GET 请求（抓包成功）
<br>![Burp抓包界面](/images/burp.1.png)
<br>9.修改数据包：进入RAW，将GET改为POST
<br>10.在所有请求头的最后一行下面，新增一行：
<br>Content-Type: application/x-www-form-urlencoded
<br>11.空一行之后写请求体写请求体：what=flag
<br>![RAW修改界面](/images/burp.2.png)
<br>12.点击 Burp 上的 Forward（转发），把修改后的包发给服务器
<br>13.点击上方HTTP history 查看 Burp 代理抓到的浏览器和服务器之间的 HTTP 通信记录。
<br>![HTTP history](/images/burp.3.png)
<br>14.在下面切换到 Response（响应）标签，里面就是服务器返回的内容，找到 flag。
<br>![找到flag](/images/burp.4.png)
<br>15.浏览器右上角 SwitchyOmega，切回 直接连接，关闭代理
## 疑问与解答
### 1.Burp Suite 和 witchyOmega 在其中发挥了什么作用？
<br>1. 接管流量：配合 SwitchyOmega，把浏览器发出的所有 HTTP 请求都先送到 Burp（127.0.0.1:8080），而不是直接发给服务器。
<br>2. 拦截并篡改请求：开启 Intercept 后，请求会被卡在 Burp 手里不发出。在 Raw 标签里改的 GET→POST、加 Content-Type、what=flag，都是在这个环节完成的 —— 这是整个解题的关键，因为题目服务器只认 POST 加参数的请求。
<br>3. 记录与回看：Forward 转发后，HTTP history 会存下这次请求和对应的响应，方便你在 Response 里找到 flag。
<br>4. 简单来说 SwitchyOmega 负责把流量引过来，Burp 负责拦住请求让你改，改完再放行并记录结果。没有 Burp就无法在浏览器外手动构造并篡改这个请求。

### <br>2.RAW是什么？为什么要更改RAW里的数据？
<br>Raw 显示的是 HTTP 请求的 原始报文文本 —— 请求行、请求头、空行、请求体，逐句排列，可以直接进行更改。
<br>这道题改 GET→POST 和加参数，在 Raw 里改是最直接、最不会出错的路径。

### <br>3.为什么 Content-Type，what=flag 之间要空一整行？
<br>HTTP 协议规定，请求头与请求体之间需用一个空行分隔，这样服务器才能正确解析，第 12 行是分隔行，所以要在第 13 行写 what=flag 。

### <br>4.这道题核心原理是什么？
<br>因为服务器只认 "POST + what=flag" 这种请求，普通浏览器发不出来，所以需要 Burp 站在中间把请求拦下来、改完再放行。

### <br>5.Content-Type: application/x-www-form-urlencoded 这段代码的作用是？
<br>Content-Type 是请求头之一，描述**请求体的数据格式**。
<br>application/x-www-form-urlencoded 是表单格式，对应的写法就是 key=value&key=value，比如本题的 what=flag。
<br>加上后服务器就知道 " 按表单格式解析，里面有个参数 what，值是 flag"，然后走对应的逻辑返回 flag。
## 笔记
这道题主要学习了：
<br>1.工具的使用：SwitchyOmega 怎么把浏览器流量引到代理；Burp 的 Intercept（拦截）、Raw（原始报文编辑）、Forward（放行）、HTTP history（看响应）这一整套改包流程。
<br>2.GET 和 POST 的区别：GET 参数放 URL、无请求体；POST 参数放请求体，需要 Content-Type 告诉服务器怎么解析。
<br>3.用代理工具把请求拦下来、看懂 HTTP 报文、按服务器要求改方法 / 改响应头 / 加参数，再放行拿结果

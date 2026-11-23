---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - 时间盲注"
date: 2026-11-21

pikachu_skill: "sql-injection/time-blind"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - 时间盲注

## 实验模块

模块：SQL注入

场景：时间盲注

## 漏洞场景

题目名称：盲注（base on time）；平台：Pikachu；方向：Web。


## 测试过程

<br>1. 当前页面为 GET /pikachu/vul/sqli/sqli\_blind\_t.php，参数是 name。源码直接读取 $name=$\_GET['name'];，拼接 $query="select id,email from member where username='$name'";。
<br>2. 源码无论查询成功还是失败都输出同一句 i don't care who you are!，并使用 mysqli\_query() 隐藏数据库错误。响应正文没有稳定真假差异，因此需要观察数据库执行条件造成的时间差。
<br>3. 先在 Burp Repeater 中多次发送 name=kobe&submit=1，记录本地正常响应时间，再发送 kobe' AND IF(1=1,SLEEP(3),0)# 与 kobe' AND IF(1=2,SLEEP(3),0)#。
<br>4. 按执行逻辑，第一条在条件为真时调用 SLEEP(3)，响应会比基线慢约 3 秒；第二条不调用 SLEEP，应接近基线。Payload 中的 # 通过 URL 发送时应编码为 %23。通过多次对照确认延迟差异。
<br>5. 确认时间通道后，可以把 1=1 换成 ASCII(SUBSTRING(DATABASE(),1,1))=112 等条件逐字符判断。Burp 中应记录每个条件的多次响应时间，使用中位数或明显阈值，避免一次网络抖动造成误判。

## 其他观察

本地靶场延迟通常比远程环境稳定，但 Apache、MySQL 和机器负载仍会产生波动。SLEEP 时间过短不易区分，过长又会拖慢学习并占用连接；3 秒适合作为建议起点。若真假请求都变慢，应检查条件闭合、函数位置和是否重复发送了多个请求。


## 分析与解答

### 1.

<br>问题：为什么页面内容完全相同仍能注入？
<br>解答：SQL 条件可以控制 SLEEP 是否执行。即使正文相同，服务器响应时间仍形成侧信道，用来表示条件为真或假。

### 2.

<br>问题：为什么需要重复测试？
<br>解答：响应时间会受系统负载和网络波动影响。只有真条件持续明显慢于假条件与基线，才是较可靠的证据。

### 3.

<br>问题：Burp 中应该观察什么？
<br>解答：重点比较 Repeater 的响应耗时，同时确认响应正文确实相同、Payload 编码正确，并保存多次测量结果。不能只凭一次慢响应判断成功。


## 漏洞原理与修复思路

<br>核心数据流是 $\_GET['name'] → username='$name'。页面隐藏了真假差异，但未阻止 SQL 函数执行，所以条件可以通过 SLEEP 把真假转换为时间差。

<br>修复仍应使用预处理语句和参数绑定。隐藏错误、统一提示或设置请求超时只能减少回显，无法阻止注入。还可以限制数据库账户权限、监控异常延迟查询，并在服务端设置合理的数据库超时。


## 学习总结

本次靶场实验主要学习了：

<br>1. 时间盲注把条件真假转换为可测量的响应延迟。
<br>2. 当前源码确认 name 被直接拼接。
<br>3. 测试时必须建立基线并重复测量，避免把系统抖动误判为注入结果。

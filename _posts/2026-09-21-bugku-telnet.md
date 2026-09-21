---
layout: writeup
tags: [bugku]
title: "BugKu CTF Writeup - telnet"
date: 2026-9-21
---
# BugKu CTF Writeup - telnet
## 题目类型
MISC
## 题目描述
题目下载了一个附件：networking

## 解题过程
<br>1.点击题目页面的下载按钮，得到压缩包，解压后得到networking.pcap抓包文件
<br>2.启动 Wireshark，通过 文件 → 打开，选中 networking.pcap
<br>3. 在 Wireshark 顶部【应用显示过滤器】输入框，输入过滤语句：telnet
<br>4.在筛选结果里，任选一条 TELNET 数据包，右键 → 追踪 → TCP 流。弹出 TCP 流窗口，窗口内是 Telnet 完整会话交互记录。
<br>5.从会话文本中找到 flag



## 本题的核心逻辑：
<br>Telnet 是明文协议，用户名、密码、控制台输出全部明文，安全性差
<br>Wireshark 显示过滤器：telnet用来筛选协议

## 笔记
这道题主要学习了：
<br>1.Wireshark 显示过滤器：telnet用来筛选协议
<br>2.追踪 TCP 流

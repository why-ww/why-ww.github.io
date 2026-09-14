---
layout: post
title: "BugKu CTF Writeup - knife"
date: 2026-09-14
---
# BugKu CTF Writeup - knife
## 题目类型
PWN
通过网络连接远程靶机 → 在远程 Linux 环境执行基础命令 → 找到并读取 flag 文件
## 解题过程
<br>1.安装linux（ubuntu）
<br>2.登录并设置用户名和密码，进入终端口
<br>3.输入sudo apt update，回车后输入刚才设置的密码。
<br>4.安装 netcat，输入sudo apt install netcat -y
<br>5.复制之前页面给出的一行地址
<br>6.粘贴到 Ubuntu 终端，回车
<br>7.输入ls
<br>8.列出目录，看到 flag 文件
<br>9.输入cat flag
<br>10.即可拿到 flag
## 疑问与解答
### 1.sudo apt install netcat -y是怎么执行的？
<br>sudo：super user do
<br>意思是以管理员（root 超级用户）身份执行后面的命令。
<br>apt：Ubuntu 的软件包管理器
<br>install：安装软件
<br>netcat：网猫，网络连接工具
<br>-y = yes。自动回答yes

### <br>2.net cat的功能是什么？
<br>nc 可以主动向远程服务器发起 TCP 连接，建立交互式通信。

## 笔记
这道题主要学习了：
<br>1.Linux的安装
<br>2.net cat的使用
<br>3.基础 Linux 命令：
<br>-s → list，列出当前目录下所有文件
<br>-cat flag → concatenate，读取文件内容，打印到屏幕
<br>通过网络连接远程靶机 → 在远程 Linux 环境执行基础命令 → 找到并读取 flag 文件

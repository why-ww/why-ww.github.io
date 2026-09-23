---
layout: writeup
tags: [bugku]
title: "BugKu CTF Writeup - base"
date: 2026-09-19
---
# BugKu CTF Writeup - base
## 题目类型
Crypto
## 题目描述
@iH<,{bdR2H;i6*Tm,Wx2izpx2!

## 解题过程
1.把密文丢进 Base91 解码器，解码得到flag



## 笔记
这道题主要学习了：
<br>1.当密文出现`@`、`!`、`*`这类 base64 不存在的字符，优先考虑 base91 /base92。

---
layout: writeup
tags: [bugku]
title: "BugKu CTF Writeup - notreal"
date: 2026-9-21
---
# BugKu CTF Writeup - 眼见非实
## 题目类型
MISC
## 题目描述
出现文档眼见非实

## 解题过程
<br>1.下载附件，文件名称为 眼见非实 ，无文件后缀，系统显示 Word 图标。
<br>2.Windows 打开文件资源管理器，顶部【查看】勾选 文件扩展名。
<br>右键文件重命名，将 眼见非实 修改为 眼见非实.zip ，确认修改扩展名警告。
<br>3.解压 眼见非实.zip ，得到 Office 文档的一堆底层配置文件夹，其中 word 目录存放文档正文内容。
<br>4.进入 word 文件夹，打开 document.xml ，查看 XML 源代码。
<br>5.在源代码中找到flag


## 本题的核心逻辑：
<br>题目文件图标伪装成 Word 文档，但文件后缀为空。
<br>docx 文件本质是 zip 压缩包，将文件修改后缀为 zip 解压后，读取 word/document.xml 源码，找到被 Word 隐藏的文字，提取 flag。


## 笔记
这道题主要学习了：
<br>1.docx 文件本质是 zip 压缩包，可以直接解压查看底层 xml。
<br>2.Word 支持隐藏文字，隐藏文字不会在页面显示，但保存在 document.xml。
<br>3.判断文件类型优先看文件头，不要依赖系统图标、后缀名。

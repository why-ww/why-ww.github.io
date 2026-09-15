---
layout: post
title: "BugKu CTF Writeup - Linux"
date: 2026-XX-XX
---
# BugKu CTF Writeup - Linux
## 题目类型
MISC
## 题目描述
题目给了Linux压缩包
## 解题过程
1.解压压缩包直到出现文件text
2.发现 text 在 Windows 里点不动
3，使用 Ubuntu ，输入 cd /mnt/d/test 进入文件夹
4.进入后依次输入：
<br> - file flag
<br> - mkdir mnt
<br> - sudo mount -o loop flag mnt
<br> - cat mnt/flag.txt
<br>5.终端直接输出flag
<br>![图片描述](images/Linux.png)
## 疑问与解答
### 1.为什么 flag 在 Windows 里点不动？
<br>因为它没有扩展名，而且不是普通文本或程序，而是一个 Linux 文件系统镜像，Windows 资源管理器不能直接打开。

### <br>2.什么是系统镜像？
<br>普通文件像一张照片或一个文档；系统镜像则像一个虚拟磁盘，里面有：
<br>- 文件夹结构
<br>- 文件
<br>- 文件权限
<br>- Linux 的文件系统信息

### <br>3.系统镜像有什么特点？
<br>它是一个完整磁盘/分区的副本
<br>可以保留目录结构：镜像里能有文件夹、子文件、隐藏文件。
<br>保留权限和属性：Linux 文件的读、写、执行权限、属主等也能保存。
<br>通常是一个大文件：例如题目中的 flag，实际装着整个 ext3 文件系统。
<br>可挂载：操作系统可把它临时当作一块硬盘使用。

### <br>4.最后的几行代码分别有什么作用？
<br> - cd /mnt/d/test ：进入 D:\test 文件夹。cd 的意思是“切换目录”。
<br>
<br> - file flag ：识别 flag 的真实文件类型。
<br>
<br> - mkdir mnt ：创建一个名为 mnt 的空文件夹。它会作为打开镜像后、显示镜像内部内容的位置。
<br>
<br> - sudo mount -o loop flag mnt：
<br> 把 flag 当作一块虚拟硬盘挂载到 mnt。
<br> sudo：以管理员权限运行；
<br> mount：挂载磁盘或镜像；
<br> -o loop：让系统把“普通文件”当作磁盘设备处理；
<br> flag：要打开的镜像；
<br> mnt：打开后从哪里查看内容。
<br>
<br>cat mnt/flag.txt：显示镜像内 flag.txt 的文字内容。cat 常用于直接查看文本文件。
<br>
<br>最后可执行sudo umount mnt：解除挂载，相当于安全拔出这块临时的“虚拟硬盘”。



## 笔记
这道题主要学习了：
<br>1.Linux 工具的使用
<br>2.用 file flag 判断未知文件的真实格式
<br>3.认识系统镜像文件

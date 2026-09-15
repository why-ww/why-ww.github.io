---
layout: post
title: "BugKu CTF Writeup - 入门逆向"
date: 2026-09-15
---
# BugKu CTF Writeup - 入门逆向
## 题目类型
Reverse
## 题目描述
获得一个压缩包，压缩包中有名为baby的应用程序
## 解题过程
<br>1.下载并运行附件
<br>一开始双击程序后窗口闪退。原因是它属于控制台程序，执行完会自动关闭。
<br>解决方式：在 PowerShell 中运行：.\baby.exe
<br>产生报错：
<br>![图片说明](/images/逆向.1.png)
<br>原因是baby.exe 不在当前的“下载”目录，而是在右侧显示的压缩包内容中。右上方还有“全部解压缩”，说明现在是在直接浏览压缩包；PowerShell 自然找不到正确路径。

<br>在解压后的文件夹空白处按住 Shift 并右键，选择“在终端中打开”，然后运行：
<br>.\baby.exe
<br>程序正常输出：
<br>![图片说明](/images/逆向.2.png)


<br>2.下载IDA:
<br>打开IDA官方网站https://hex-rays.com/ida-free
<br>![图片说明](/images/逆向.7.png)
<br>注册后点击进入【My Hex-Rays】
<br>![图片说明](/images/逆向.8.png)
<br>在My Hex-Rays中点击Download center，在【Release】中进入【IDA Free】，下载并安装与自己系统适配的IDA软件
<br>![图片说明](/images/逆向.9.png)
<br>在My Hex-Rays中找到【Licenses】，点击右上角Download Hexlic并下载放入D盘
<br>![图片说明](/images/逆向.10.png)
<br>进入IDA出现报错：
<br>![图片说明](/images/逆向.5.png)
<br>原因：已经下载了许可证，但 IDA 不会自动去 D 盘找它；需要把许可证放到它默认查找的位置
<br>解决方法：
<br>-先完全关闭 IDA
<br>-按 Win + R在终端中输入%APPDATA%\Hex-Rays\IDA Pro
<br>-会打开一个文件夹。把 D 盘下载的许可证文件复制进来。它应当是类似：idafree-xxxx.hexlic
<br>-再重新打开 IDA Free。

<br>3.在IDA中选择【New】(Disassemble a new file)拆解一个新文件夹

<br>进入后出现load a new file窗口，先点cancel取消，

<br>在 IDA 中点 File → Open，进入你放题目附件的目录，选择真正的：baby.exe

<br>打开后，应该自动识别为类似：
<br>Portable executable for 80386 (PE)

<br>保持默认设置，点击 OK，等待分析完成。

<br>出现核心代码：
<br>![图片说明](/images/逆向.11.png)
<br>flag 已经被 IDA 在右侧注释里逐字符标出来了。
<br>从 main 函数中 call printf 的下一行开始，依次读取每条 mov 后的十六进制值进行解码最后得出正确的flag。






## 疑问与解答
### 1.
<br>

### <br>2.
<br>

### <br>3.
<br>

### <br>4.
<br>
## 笔记
这道题主要学习了：
<br>1.
<br>2.
<br>3.
<br><span style="color:red"></span>

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
<br>
<br>在解压后的文件夹空白处按住 Shift 并右键，选择“在终端中打开”，然后运行：
<br>.\baby.exe
<br>程序正常输出：
<br>![图片说明](/images/逆向.2.png)
<br>
<br>
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
<br>
<br>
<br>3.在IDA中选择【New】(Disassemble a new file)拆解一个新文件夹
<br>进入后出现load a new file窗口，先点cancel取消，
<br>在 IDA 中点 File → Open，进入你放题目附件的目录，选择真正的：baby.exe
<br>打开后，应该自动识别为类似：
<br>Portable executable for 80386 (PE)
<br>保持默认设置，点击 OK，等待分析完成。
<br>
<br>出现核心代码：
<br>![图片说明](/images/逆向.11.png)
<br>flag 已经被 IDA 在右侧注释里逐字符标出来了。
<br>从 main 函数中 call printf 的下一行开始，依次读取每条 mov 后的十六进制值进行解码最后得出正确的flag。


## 疑问与解答
### 1.什么是逆向？
<br>逆向工程是从“成品程序”倒推它的内部逻辑。
<br>正常开发的方向是：
<br>源码 → 编译 → exe 程序
<br>逆向则相反：
<br>exe 程序 → 汇编/伪代码 → 推测原本的逻辑
<br>例如这道题中，baby.exe 是已经编译完成的程序。你没有它的 C/C++ 源代码，但用 IDA 打开后能看到汇编指令，利用指令找到flag。
<br>
### <br>2.IDA的功能是什么？在这道题里发挥了什么作用？
<br>它的主要功能是把 exe 这类机器码程序转换成更容易阅读的形式，例如汇编代码、函数列表、字符串列表和控制流程图，常用于逆向分析。
<br>在这道题里，它识别 baby.exe 中有哪些函数，例如 main；并找到程序运行时打印的字符串。
<br>展示 main 函数中的汇编指令；把十六进制值旁边标成可读字符。
<br>
### <br>3.终端中输入%APPDATA%\Hex-Rays\IDA Pro的作用是什么？
<br>%APPDATA%\Hex-Rays\IDA Pro 是 IDA 在 Windows 中保存“当前用户配置和许可证”的默认文件夹路径。
<br>IDA 启动时会自动到这个位置查找许可证；找到后就知道你拥有 IDA Free 的使用权限，不会再提示缺少 idafree*.hexlic。
### <br>4.如何将核心代码解码为flag的？
<br>把每条 mov 指令中的十六进制数，当成 ASCII 字符编码来读。

### <br>5.mov是什么？
mov 是汇编语言中最常见的一条指令，意思是“复制/移动数据”

### <br>6.main在这里是什么意思？
<br>main 是程序的“主函数”，可以理解为 C/C++ 程序通常开始执行核心逻辑的地方。
<br>IDA 中看到的 main 里包含了题目的主要代码：call printf
<br>这行负责打印：
<br>Hi~ this is a babyre
<br>然后紧跟着的多条 mov 指令把：flag{Re_1s_S0_C0OL} 逐个字符写进内存。
<br>所以，main 在这里的作用是：
<br>程序启动
<br>- 进入 main
<br>- 打印提示语
<br>- 写入隐藏的 flag 数据
<br>- 程序结束
## 笔记
这道题主要学习了：
<br>1.认识逆向：从已编译的 exe 程序反推它内部做了什么。
<br>2.使用 IDA：能打开 PE 可执行文件、等待自动分析、从函数列表进入 main
<br>3.认识函数与入口：知道 main 是 C/C++ 程序常见的主逻辑入口。
<br>4.在函数列表中优先查看 main，是因为它最有可能包含题目作者自己写的核心逻辑

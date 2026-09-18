---
layout: writeup
tags: [bugku]
title: "BugKu CTF Writeup - source"
date: 2026-09-13
---
# BugKu CTF Writeup - source
## 题目类型
WEB
## 题目描述PowerShell
进入网页后显示
<br>Hello,world!
<br>This is my friend :
## 解题过程
<br>1.查看源代码，查询得知代码中flag是Base64编码，解码为flag{this_is_a_fake_flag}，是假flag。
<br>2.下载 GitHack， python3.x.x 备用
<br>3.打开 PowerShell，执行：cd D:\Tools\GitHack 进入 GitHack 文件夹。
<br>此时遇到问题，Powershell说目录名称无效
<br>原因：PowerShell 默认在 C 盘，你直接 cd D 盘文件夹会报错，且路径带空格，需要加英文双引号
<br>解决方法：要先切换盘符（先敲 D: 回车），再输入cd "D:\My Tools\GitHack"
<br>PowerShell输出“系统找不到指定的路径”
<br>原因：GitHack-master.zip 是压缩包文件，不是文件夹。
<br>不能直接 cd 进到 zip 压缩包里面，必须先把 zip 解压出来。
<br>解决方法：解压后重新输入文件位置，让power shell进入GitHack文件夹。
<br>
<br>4.依次输入
<br>D: (切换到 D 盘)
<br>cd D:\GitHack-master(进入 GitHack 文件夹)
<br>dir(列出里面全部文件，看有没有 GitHack.py)
<br>
<br>5.终端输出：
<br>[+] flag.txt
<br>[+] index.html
<br>[OK] flag.txt
<br>[OK] index.html
<br>代表 GitHack 已经成功下载并且还原源码。
<br>6.之后，GitHack 会在当前目录 D:\GitHack-master 生成一个文件夹，名字一般是 source
<br>
<br>7.在终端输入dir，会看到 source 文件夹
<br>进入 source 文件夹：
<br>在终端输入
<br>cd source
<br>dir
<br>8.现在能看到还原出来的 index.html 和 flag.txt，但是这个 flag.txt 是空的，这道题 flag 在被删除的 commit 里面，需要用 git reflog 找回。
<br>
<br>9.D:\GitHack-master\source
<br>
<br>10.进入 D:\GitHack-master\source 文件夹，在空白处 Shift + 右键 → 打开 Git Bash。
<br>
<br>11.在 Git Bash 里面依次输入：
<br>git reflog
<br>cat flag.txt
<br>12.报错：fatal: not a git repository
<br>意思是当前文件夹里没有 .git 文件夹，Git 识别不了这是一个 git 仓库
<br>
<br>13.原因：Windows 默认隐藏 .git 文件夹
<br>
<br>14. 在当前 GitBash 窗口，输入查看隐藏文件命令：
<br>
<br>ls -a
<br>
<br>15.界面未输出内容
<br>原因：ls -a 只看到 flag.txt 和 index.html，没有 .git 文件夹
<br>GitHack 只下载还原了源码文件，没有把.git 仓库本体下载下来，所以无法执行git reflog。
<br>先关掉当前 GitBash，回到 CMD（D:\GitHack-master），先安装 git-dumper：完成后切回 D 盘 GitHack 目录，
<br>输入pip install git-dumper，执行git-dumper http://160.202.254.160:18154/.git/ git_dump_result。把完整 git 仓库下载到git_dump_result文件夹：
<br>运行完，会生成 git_dump_result 文件夹，里面带有完整的.git。，进入这个文件夹打开 Git Bash：
<br>输入：
<br>cd git_dump_result
<br>git reflog
<br>会看到多条 commit 记录，类似这样：
<br>xxxxxxx (HEAD -> master) HEAD@{0}: commit: delete flag
<br>aaaaaaa HEAD@{1}: commit: add flag
<br>
16.aaaaaaa或者xxxxxxx 就是有 flag 的那条 commit 哈希
<br>回退到这个版本： git checkout aaaaaaa
<br>读取 flag：cat flag.txt
<br>因为有很多假flag，使用git show xxxxxxx 直接看本次提交全部修改
<br>直到找到正确的flag
## 疑问与解答
### 1.GitHack， python3.x.x 在这道题里是干什么用的？
<br>GitHack 是一个用 Python 写的脚本程序；Python3.x.x 用来运行这个脚本。
<br>GitHack.py：是别人写好的 Python 源代码脚本（专门用来利用.git 泄露漏洞）
<br>GitHack的作用：
<br>- 向目标网站自动发送 HTTP 请求，把服务器上.git文件夹里面所有文件（HEAD、index、objects 打包文件）批量下载到你的电脑。
<br>- 自动解析 git 内部的压缩对象、索引文件，在本地还原出完整可用的 git 仓库。
<br>Python3.x.x只用来运行 GitHack 脚本。
<br>
### <br>2.dir 命令的作用是什么？
<br>dir = directory（目录），是Windows CMD 原生命令。
<br>功能：查看当前文件夹里面有哪些文件、子文件夹，列出文件名字、修改时间、大小。
<br>
### <br>3.为什么输入 ls -a ？
<br>ls = list，列出当前文件夹的文件
<br>-a 是参数（a = all，全部）
<br>ls -a = 列出所有文件，包括【隐藏文件 / 隐藏文件夹】
<br>
### <br>4.ls -a 和 dir有什么区别？
<br>Windows CMD：dir /a 等价于 GitBash ls -a，作用同样是显示隐藏文件
<br>
### <br>5.为什么要用 git-dumper，有什么作用？
<br>浏览器、wget、普通下载工具直接下载.git文件夹经常下不全、文件残缺，残缺的.git 仓库，git 命令会报错用不了。
<br>git-dumper 就是专门为 .git 源码泄露漏洞写的 Python 工具，专门把网站上残缺的.git 完整扒下来，修复成本地能正常使用的 git 仓库。
<br>
### <br>5.cd git_dump_result和git reflog分别有什么作用?
<br>cd git_dump_result:
<br>git 的命令必须在 git 仓库文件夹里面运行，不然会报错。
所以先用 cd (change directory)进到我们刚刚用 git-dumper 下载好的仓库目录。
<br>git reflog:
<br>git：调用 Git 程序
<br>reflog：全称 reference log，引用日志
即记录你本地仓库所有 HEAD 的移动历史（所有版本变动记录）
- HEAD 可以简单理解成：Git 当前 “正在指向哪个版本” 的指针。
- 每次 commit 提交、切换版本、回滚 (reset)，HEAD 指针都会移动，每一次移动都会被 reflog 记下来。
- <br>
### <br>6.每一次commit有什么不同，为什么哈希值不同？
<br>上传时间不一样，每次 commit 都对应一个不同的时间点。
<br>
### <br>7.Git 是什么？
<br>版本控制工具，每次commit会保存项目文件快照；所有版本记录存放在隐藏文件夹.git。
<br>
## 笔记
这道题主要学习了：
<br>1.漏洞基础：.git 源码泄露
<br>网站上线时，服务器对外暴露了 .git 文件夹，外网可以访问下载仓库
<br>攻击者可以拿到网站源码，**回溯所有历史提交**；就算文件后续被修改 / 删除，旧版本内容依然保存在.git 中，可以找回。
<br>2.如何使用Python + GitHack /git-dumper
<br>3.终端基础命令（GitBash）：cd/ls/ls -a/cat文件名。
<br>4.使用git reflog：引用日志，记录所有 HEAD 指针移动记录。

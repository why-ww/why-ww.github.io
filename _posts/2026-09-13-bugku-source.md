---
layout: post
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
<br>4.依次输入
<br>D: (切换到 D 盘)
<br>cd D:\GitHack-master(进入 GitHack 文件夹)
<br>dir(列出里面全部文件，看有没有 GitHack.py)
<br>5.终端输出：
<br>[+] flag.txt
<br>[+] index.html
<br>[OK] flag.txt
<br>[OK] index.html
<br>代表 GitHack 已经成功下载并且还原源码。
<br>6.之后，GitHack 会在当前目录 D:\GitHack-master 生成一个文件夹，名字一般是 source
<br>7.在终端输入dir，会看到 source 文件夹
<br>进入 source 文件夹：
<br>在终端输入
<br>cd source
<br>dir
<br>8.现在能看到还原出来的 index.html 和 flag.txt，但是这个 flag.txt 是空的，这道题 flag 在被删除的 commit 里面，需要用 git reflog 找回。
<br>9.D:\GitHack-master\source
<br>10.进入 D:\GitHack-master\source 文件夹，在空白处 Shift + 右键 → 打开 Git Bash。
<br>11.在 Git Bash 里面依次输入：
<br>git reflog
<br>cat flag.txt
<br>12.报错：fatal: not a git repository
<br>意思是当前文件夹里没有 .git 文件夹，Git 识别不了这是一个 git 仓库
<br>13.原因：Windows 默认隐藏 .git 文件夹
<br>14. 在当前 GitBash 窗口，输入查看隐藏文件命令：
<br>ls -a
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
16.aaaaaaa或者xxxxxxx 就是有 flag 的那条 commit 哈希
<br>回退到这个版本： git checkout aaaaaaa
<br>读取 flag：cat flag.txt
<br>因为有很多假flag，使用git show xxxxxxx 直接看本次提交全部修改
<br>直到找到正确的flag
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

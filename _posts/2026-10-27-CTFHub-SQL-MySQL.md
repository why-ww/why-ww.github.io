---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - MySQL结构"
date: 2026-10-27

skill: "web-sql/MySQL结构"
completed: true
---

# CTFHub Writeup - MySQL结构

## 题目类型

Web

## 题目描述

MySQL结构
ID
输个1试试？


## 解题过程

<br>1. 访问目标地址后，页面返回一个 name="id" 的 GET 表单；提交 id=1 时，页面回显后端 SQL \`select \* from news where id=1\`，并显示 \`ID: 1\`、\`Data: ctfhub\`。
<br>2. 记录中根据回显判断：id 值直接拼接到 SQL 且没有引号，属于数字型注入；页面显示 ID 和 Data 两列，说明查询结果有两个回显位。
<br>3. 使用 \`id=1 and 1=1\` 时返回 \`ID: 1\`、\`Data: ctfhub\`；使用 \`id=1 and 1=2\` 时没有返回 ID/Data，只回显 SQL，说明 and 条件能够影响查询结果。
<br>4. 使用 \`id=1 order by 2\` 时页面正常返回 \`ID: 1\`、\`Data: ctfhub\`；使用 \`id=1 order by 3\` 时只有 SQL 回显，没有 ID/Data，从而判断查询结果为 2 列。
<br>5. 使用 \`id=-1 union select 1,2\` 后，页面回显 \`ID: 1\`、\`Data: 2\`；用 -1 让前半句查不到记录，只显示 union 后半句的结果，1 和 2 分别落在 ID、Data 两个回显位。
<br>6. 分别查询 \`database()\`、\`user()\`、\`@@version\`，得到当前库为 \`sqli\`、数据库用户为 \`root@localhost\`、版本为 \`10.3.22-MariaDB-0+deb10u1\`。
<br>7. 查询 \`information\_schema.tables\` 得到当前库中的表名 \`urmpecjowj,news\`；继续查询 \`information\_schema.columns\` 得到表 \`urmpecjowj\` 的列名为 \`mchekrjdsl\`。
<br>8. 最后使用 \`id=-1 union select 1,mchekrjdsl from urmpecjowj\` 读取数据，页面 Data 回显 \`ctfhub\{13d8f6e53d6b9c7a6ac1660a\}\`。

## 疑问与解答

### 1.

<br>问题：为什么联合查询时常用 \`id=-1 union select 1,2\`，而不是 \`id=1 union select 1,2\`？
<br>解答：\`id=-1\` 通常使前半段查询查不到记录，页面只展示 union 后半段的结果，便于清楚观察回显位；如果前半段有记录，原始数据和联合查询结果可能同时出现，增加判断干扰。

### 2.

<br>问题：为什么已经知道当前库名后，还要查询 \`information\_schema\`？
<br>解答：当前库中的表名和列名可能是随机生成的，不能直接猜出；\`information\_schema.tables\` 和 \`information\_schema.columns\` 保存了数据库元数据，可用来枚举表名、列名，再构造读取目标数据的查询。

### 3.

<br>问题：\`order by 3\` 没有返回 ID/Data 说明了什么？
<br>解答：\`order by\` 后面跟列序号，若第 3 列不存在，数据库会报错；本题错误信息被页面隐藏，因此表现为没有正常数据回显。结合 \`order by 2\` 正常，可判断原查询结果只有 2 列。


## 本题的核心逻辑：

<br>
<br>

本题是数字型 union 联合注入。参数直接拼接到 \`select \* from news where id=...\` 中，无需引号闭合；先用 and 条件确认逻辑生效，再用 order by 判断列数，最后用 union select 把任意查询结果放入页面回显位。

读取 flag 的关键是借助 information\_schema 枚举数据库结构：先查当前库中的表，再查目标表的列，最后把随机列名放入 union select 的第二列，从而读取目标表中的数据。


## 笔记

这道题主要学习了：

<br>1. 联合注入可按固定顺序推进：确认参数拼接方式与回显位、验证逻辑条件、判断列数、构造 union select、读取数据库环境，再枚举表和列。每一步都应以页面实际回显为依据。
<br>2. information\_schema 是 MySQL/MariaDB 的元数据入口，适合在库名、表名或列名未知时进行结构枚举；group\_concat 可以把多行结果合并到一个回显位中，便于一次性观察。

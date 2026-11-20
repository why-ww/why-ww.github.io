---
layout: writeup
tags: [pikachu, SQL注入]

title: "Pikachu Lab Report - delete注入"
date: 2026-11-19

pikachu_skill: "sql-injection/delete"
completed: true
module: "SQL注入"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - delete注入

## 实验模块

模块：SQL注入

场景：delete注入

## 漏洞场景

题目名称：delete注入；平台：Pikachu；方向：Web。

## 测试过程

<br>1. 进入 Pikachu 靶场的 SQL-Inject → DELETE 注入页面，页面展示留言列表，每条留言后都有删除按钮。通过 Burp Suite 拦截删除请求，确认请求使用 GET 方法，参数名为 id，正常请求示例为 GET /pikachu/vul/sqli/sqli\_del.php?id=57 HTTP/1.1。
<br>2. 查看 sqli\_del.php 后，发现后端直接将 GET 参数拼接到 SQL 语句中：$query="delete from message where id=\{$\_GET\['id'\]\}"; $result=execute($link, $query);。原本的数字类型检查代码已经被注释，没有对传入的 ID 进行有效校验。SQL 执行后，应用层仅在 affected\_rows == 1 时显示删除成功，其他结果都会进入删除失败分支。
<br>3. 为验证漏洞，在本地 Pikachu 靶场中准备了两条测试留言：ID 62 和 ID 63。随后通过 Burp Repeater 修改 GET 参数，构造 id=62 OR id=63，并发送请求 GET /pikachu/vul/sqli/sqli\_del.php?id=62%20OR%20id=63 HTTP/1.1。
<br>4. 由于 PHP 没有对参数进行过滤，最终拼接出的 SQL 语句为 DELETE FROM message WHERE id=62 OR id=63;。其中 OR 表示逻辑或，满足任意一个条件即可，因此 ID 为 62 和 ID 为 63 的两条留言都会被删除。
<br>5. 请求返回后，页面显示“删除失败，检查下数据库是不是挂了”。这是因为本次实际删除了两行，affected\_rows 的值为 2，不满足应用层 affected\_rows == 1 的成功判断，因此进入失败提示分支；该提示并不表示 SQL 没有执行。最后使用只读查询 SELECT id, content FROM message WHERE id IN (62, 63); 复核，查询未返回 ID 62 和 ID 63，确认两条测试记录均已被删除，DELETE 注入验证成功。

## 其他观察

页面显示“删除失败”不是注入失败，而是应用层结果判断过窄：正常删除一条记录时 affected\_rows == 1，注入导致一次删除两条记录时 affected\_rows == 2，于是程序显示失败提示。实验结果应以只读 SELECT 对数据库状态的复核为准。


## 分析与解答

### 1.

<br>问题：为什么 id=62 OR id=63 会同时删除两条记录？
<br>解答：参数被拼接到 WHERE 子句后形成 DELETE FROM message WHERE id=62 OR id=63;，OR 使左右任一条件成立即可匹配，因此 ID 为 62 或 63 的记录都会进入删除范围。

### 2.

<br>问题：页面提示“删除失败”是否说明注入没有成功？
<br>解答：不是。本次 DELETE 实际影响两行，affected\_rows 为 2；应用层只把 affected\_rows == 1 判断为成功，所以显示失败提示。随后通过只读 SELECT 查询确认 ID 62 和 ID 63 均不存在，说明两条记录已经被删除。

### 3.

<br>问题：这个实验的注入点在哪里？
<br>解答：注入点在 GET 参数 id 被直接拼接到 DELETE 语句 WHERE 条件的位置。由于缺少有效校验，构造 OR 条件可以改变删除范围，使原本针对单条记录的删除操作影响多条记录。


## 漏洞原理与修复思路

<br>DELETE 注入的原理是用户输入进入 SQL 语句的 WHERE 条件后，改变了原本的删除谓词。SQL 注入并不只存在于 SELECT 查询中，DELETE、UPDATE 等写操作同样可能被注入；本例中 OR 条件扩大了匹配范围，造成多条留言被删除，体现了数据破坏风险。

<br>修复时应避免将外部参数直接拼接进 SQL，改用参数化查询或预编译语句绑定 id；同时对 id 做服务端整数校验和允许范围校验，并遵循最小权限原则，降低注入成功后造成的破坏。业务层还应根据实际需求正确处理受影响行数，避免把“删除多行”错误显示为数据库故障，但结果提示的修正不能替代对 SQL 注入漏洞本身的修复。


## 学习总结

本次靶场实验主要学习了：

<br>1. 本次学习的关键点是确认 SQL 注入可以出现在 DELETE 操作中，并通过源码看到 $\_GET\['id'\] 被直接拼接到删除语句，说明服务端输入校验和 SQL 语句构造方式决定了注入面。
<br>2. 验证注入结果时不能只看页面提示；本例中一次删除两行使 affected\_rows 为 2，不满足应用层 affected\_rows == 1 的成功判断，但只读 SELECT 已确认两条测试记录均不存在。
<br>3. 后续应重点掌握参数化查询、服务端整数校验和最小权限配置，避免外部输入改变 DELETE 语句的 WHERE 条件并扩大影响范围。


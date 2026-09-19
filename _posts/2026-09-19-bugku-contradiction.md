---
layout: writeup
tags: [bugku]
title: "BugKu CTF Writeup - "
date: 2026-9-19
---
# BugKu CTF Writeup - 
## 题目类型
web
## 题目描述
出现代码$num=$_GET['num'];
if(!is_numeric($num))
{
echo $num;
if($num==1)
echo 'flag{**********}';
}

## 解题过程
1.在浏览器地址栏的网址末尾，拼接参数：?num=1a
2.访问页面，页面就会输出 flag

## 疑问与解答
### 1.比较分别有几种？什么是弱比较？
<br> - . 弱比较（松散比较）： ==
<br>只对比值是否相等，比较前会自动转换两边的数据类型，类型不一样也能比。
<br> - . 强比较（严格比较）：===
<br>值和数据类型必须同时完全一样才返回 true，不会自动转换类型。

### <br>2.
<br>

### <br>3. 
<br>

## 本题的核心逻辑：
<br>PHP 弱类型比较
<br>$num = $_GET['num'];
<br>if(!is_numeric($num)){  // 条件1：$num不能是纯数字字符串
<br>    if($num == 1){      // 条件2：弱比较 $num == 1 成立
<br>        echo flag;
    }
}
<br>is_numeric()：判断变量是不是数字 / 数字字符串， 1a 不是纯数字，返回 false；
<br>== 弱比较：字符串和数字对比时，会提取字符串开头的数字转为数字再比较。
<br>"1a" 和数字 1 比较时，会截取开头 1 ，所以 "1a" == 1 → true
## 笔记
这道题主要学习了：
<br>1.==：先转类型，再比值
<br>===：类型和值一起比对，不自动转换

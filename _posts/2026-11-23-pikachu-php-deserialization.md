---
layout: writeup
tags: [pikachu, PHP反序列化]

title: "Pikachu Lab Report - PHP 反序列化"
date: 2026-11-23

pikachu_skill: "deserialization/php"
completed: false
module: "PHP 反序列化"
deployment: "docker"
environment_status: "unchecked"
---

# Pikachu Lab - PHP 反序列化

## 实验模块

模块：PHP 反序列化

场景：PHP 反序列化

## 漏洞场景

题目名称：PHP 反序列化；平台：Pikachu；方向：Web。

实验状态：原理分析。已核对 Pikachu 当前源码中的 unser.php，但没有向本地靶场提交序列化对象，也没有记录页面响应。以下内容是隔离靶场中的建议验证步骤。

## 测试过程

<br>1. 当前入口为 /pikachu/vul/unserilization/unser.php，页面通过 POST 参数 o 接收一段 PHP 序列化数据。源码先执行 $s=$\_POST['o']，再把 $s 直接传入 unserialize($s)。
<br>2. 页面提前定义了类 S，其中公开属性 test 的默认值是 pikachu。反序列化成功后，代码直接读取 $unser->test，并把它拼接进 HTML：$html.="<p>{$unser->test}</p>"。输入既没有类型约束，也没有输出编码。
<br>3. 建议先提交一个只含字符串的正常序列化值，例如 s:7:"pikachu";，观察它虽然可以被反序列化，但后续按对象读取 test 属性时并不符合程序预期。随后在 Burp Repeater 中使用无害对象标记 O:1:"S":1:{s:4:"test";s:14:"PIKACHU_MARKER";}。
<br>4. 这段数据表示一个类名长度为 1 的 S 对象，包含一个名称长度为 4 的 test 属性，其值 PIKACHU_MARKER 长度为 14。若页面出现该标记，说明客户端能够构造对象并控制服务端反序列化后的属性。本篇没有实际发送该请求。
<br>5. 源码注释还指出 test 属性若含 HTML 或脚本内容，会被原样放入响应。因此本题当前代码的直接表现是“可控对象属性 + 未编码输出”；在更复杂项目中，若可用类带有 __wakeup()、__destruct() 等魔术方法，还可能形成对象注入利用链。

## 其他观察

unserialize() 恢复的是 PHP 的类型和对象结构，而不只是把文本解析成数组。序列化格式中的长度按字节计算，长度写错会使反序列化失败。当前类 S 只有 __construct()，而反序列化通常不会调用构造函数；源码也没有 __wakeup() 或 __destruct()，所以不能据此声称本题已经存在命令执行链。


## 分析与解答

### 1.

<br>问题：为什么修改序列化文本中的 test 属性就能改变页面输出？
<br>解答：unserialize() 会按输入重建 S 对象及其属性，后续代码又直接读取 $unser->test。客户端提供的数据因此从 POST 参数一路进入对象属性，最终进入 HTML 响应。

### 2.

<br>问题：__construct() 会在 unserialize() 时自动执行吗？
<br>解答：通常不会。PHP 反序列化对象时重点关注 __unserialize()、__wakeup() 以及对象销毁时的 __destruct() 等魔术方法。当前源码没有这些方法，不能把一般反序列化 RCE 的结论直接套到本题。

### 3.

<br>问题：为什么序列化字符串中的数字必须准确？
<br>解答：s:N:"..." 中的 N 表示字符串的字节长度，不是随意编号。长度与实际内容不符时，解析器会在错误位置继续读取，最终导致 unserialize() 返回 false 或产生警告。


## 漏洞原理与修复思路

<br>核心数据流是 POST 参数 o → unserialize() → S 对象的 test 属性 → 未编码的 HTML 输出。风险分为两层：不可信数据可以控制对象结构；可控属性又未经 htmlspecialchars() 编码直接进入页面。若真实项目中存在具有危险魔术方法的可加载类，第一层还可能扩展为对象注入链。

<br>修复时不要对不可信输入使用 unserialize()，跨边界数据优先采用 JSON，并对字段、类型和长度做明确校验。如果必须兼容 PHP 序列化格式，可使用 unserialize($data, ['allowed_classes' => false]) 或只允许必要类，但仍要把反序列化后的数据视为不可信。所有写入 HTML 的内容还应按上下文使用 htmlspecialchars() 编码，并移除不必要的危险魔术方法和自动加载类。


## 学习总结

本次靶场实验主要学习了：

<br>1. PHP 序列化数据包含类型、类名、属性名和精确的字节长度。
<br>2. 当前源码确认 POST 参数被直接反序列化并输出 test 属性，但本篇尚未提交对象数据。
<br>3. 防护重点是避免反序列化不可信数据、限制允许类型，并对最终 HTML 输出进行上下文编码。

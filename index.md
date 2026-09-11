---
layout: home
---

<style>

/* =========================
   整个网页
========================= */

body {
    background-color: #0d1117;
    color: #c9d1d9;
}


/* =========================
   导航栏
========================= */

.site-header {
    background-color: #0d1117;
    border-top: none;
    border-bottom: 1px solid #30363d;
}


/* 左上角博客名字 */

.site-title {
    color: #58a6ff !important;
    font-weight: bold;
}


.site-title:visited {
    color: #58a6ff !important;
}


/* 导航栏 Home */

.site-nav .page-link {
    color: #c9d1d9;
}


/* =========================
   主页面
========================= */

.page-content {
    background-color: #0d1117;
}


/* =========================
   WHY-WW'S BLOG 大区域
========================= */

.hero {

    text-align: center;

    padding: 90px 30px;

    margin-bottom: 70px;

    background-color: #161b22;

    border: 1px solid #30363d;

    border-radius: 16px;

}


/* 主标题 */

.hero h1 {

    color: #58a6ff;

    font-size: 45px;

    letter-spacing: 4px;

    margin-bottom: 25px;

}


/* Cybersecurity */

.hero h2 {

    color: #f0f6fc;

    font-size: 26px;

    font-weight: normal;

}


/* My write-ups */

.hero p {

    color: #8b949e;

    font-size: 18px;

}


/* =========================
   分割线
========================= */

.hero-line {

    width: 70px;

    height: 3px;

    background-color: #58a6ff;

    margin: 30px auto;

}


/* =========================
   Posts 标题
========================= */

.home h2 {

    color: #f0f6fc;

}


/* =========================
   文章列表
========================= */

.post-list {

    list-style: none;

    margin-left: 0;

}


/* 每篇文章 */

.post-list > li {

    background-color: #161b22;

    border: 1px solid #30363d;

    border-radius: 12px;

    padding: 25px;

    margin-bottom: 20px;

    transition: 0.2s;

}


/* 鼠标移动到文章上 */

.post-list > li:hover {

    transform: translateY(-5px);

    border-color: #58a6ff;

}


/* =========================
   文章标题
========================= */

.post-link {

    color: #58a6ff !important;

    font-size: 22px;

    font-weight: bold;

}


.post-link:hover {

    color: #79c0ff !important;

}


/* =========================
   日期
========================= */

.post-meta {

    color: #8b949e;

}


/* =========================
   RSS
========================= */

.rss-subscribe {

    color: #8b949e;

}


/* =========================
   页脚
========================= */

.site-footer {

    background-color: #0d1117;

    border-top: 1px solid #30363d;

}


/* =========================
   手机
========================= */

@media screen and (max-width: 600px) {

    .hero {

        padding: 60px 20px;

    }

    .hero h1 {

        font-size: 28px;

    }

}

</style>


<!-- =========================
     首页欢迎区域
========================= -->

<div class="hero">

    <h1>WHY-WW'S BLOG</h1>

    <div class="hero-line"></div>

    <h2>Cybersecurity</h2>

    <p>My write-ups</p>

</div>

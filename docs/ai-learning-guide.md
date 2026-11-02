# AI 学习记录与进度

## 日常使用
1. 在学习路线中展开一个实验，点击“阅读教材 PDF”。
2. 亲手完成任务后，点击“写学习笔记”，GitHub 会预填文件名和模板。
3. 填写自己的理解、实践过程、结果、疑问与下一步；提交到 main 分支。
4. 完成实验时，将笔记头部的 learning_status 改为 completed，并填写 completed_at。
5. 等待 GitHub Pages 发布。主页、实验状态、笔记链接、进度与下一任务会同步更新。

只有明确标记 completed 才计入完成数量。发布一篇笔记不会自动判定完成。
状态值：not_started（未开始）、in_progress（进行中）、completed（已完成）。
公开网站没有在线写入 GitHub 的登录后台；修改通过 GitHub 提交保存，浏览器刷新不会丢失。

## 关联规则
- 每个实验使用稳定 experiment_id，例如 agent-ch01-e01。
- 记录需带 tags: [ai-learning] 和同一 experiment_id。
- 同一实验有多篇文章时，以日期最新的已发布记录为准；learning_status 若为空，则保留数据文件里的状态。
- 笔记中的明确状态优先于 _data/ai_learning.yml 中的状态；没有笔记时，读取数据文件。
- 没有笔记也可以编辑 _data/ai_learning.yml，填写实验 status、completed_at、note_url。
- 完成日期使用 completed_at；已完成笔记未填写时使用文章日期。
- “下一步”优先指向进行中的任务，其次是第一个未开始的任务；全部完成后进入下一学习单元。
- 目前百分比统计第一章已规划的五个实验，页面标明统计范围。
- 路线中的 agent-unit-1 在这五个实验全部完成时汇总为已完成。其他主题状态由 unit_states 按稳定编号维护。

## 教材阅读
- Agent、Infra 使用作者官方中文 PDF，站内 PDF 快照在 assets/books。
- 阅读页有浏览器内预览、打开 PDF、下载 PDF、官方网页版和作者最新 PDF。
- 不支持内嵌 PDF 的移动浏览器可点击“打开 PDF”或“官方网页版”。
- CS146S 是课程，入口保留课程官网。
- 更新快照：在 Actions 中运行 Sync official AI textbooks。原始许可证与来源记录在 assets/books 中。

## 手工模板
复制 docs/ai-learning-note-template.md 到 _posts/YYYY-MM-DD-主题.md，修改日期、标题和实验编号。
不要把含 YYYY-MM-DD 的模板原样发布，也不要把未完成的练习标记为 completed。

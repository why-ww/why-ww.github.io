"""Exercise rendered Jekyll pages using temporary learning records, never real posts."""
import copy, json, pathlib, shutil, subprocess, sys, tempfile, urllib.parse
import yaml
from bs4 import BeautifulSoup

root = pathlib.Path(__file__).resolve().parents[1]
work = pathlib.Path(tempfile.mkdtemp(prefix="ai-learning-fixtures-"))
source = work / "source"
shutil.copytree(root, source, ignore=shutil.ignore_patterns(".git", "_site", "node_modules"))
config_path = source / "_config.yml"
config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
config["plugins"] = ["jekyll-seo-tag", "jekyll-feed"]
config["whitelist"] = ["jekyll-seo-tag", "jekyll-feed"]
config_path.write_text(yaml.safe_dump(config, allow_unicode=True), encoding="utf-8")
data_path = source / "_data/ai_learning.yml"
data = yaml.safe_load(data_path.read_text(encoding="utf-8"))
experiments = data["dashboard"]["experiments"]
ids = [e["id"] for e in experiments]
assert len(ids) == len(set(ids)) and len(ids) > 1
for e in experiments:
    e.update(status="not_started", completed_at="", note_url="")
# Isolate fixture records from actual published learning history.
for path in (source / "_posts").glob("*"):
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        front = yaml.safe_load(text.split("---", 2)[1]) or {}
        if "ai-learning" in front.get("tags", []):
            path.unlink()
def save():
    data_path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
def note(name, experiment, status=None, day="02"):
    values = dict(layout="ai-note", title="Fixture learning record", date=f"2020-01-{day} 12:00:00 +0800", tags=["ai-learning"], ai_section="roadmap", experiment_id=experiment)
    if status:
        values.update(learning_status=status)
    if status == "completed":
        values["completed_at"] = f"2020-01-{day}"
    (source / "_posts" / f"2020-01-{day}-{name}.md").write_text("---\n"+yaml.safe_dump(values, allow_unicode=True)+"---\n\n## 我的理解\n\nTemporary verification record.\n", encoding="utf-8")
def build(label):
    save()
    command = ["docker", "run", "--rm", "-v", str(work)+":/work", "--entrypoint", "jekyll",
               "ghcr.io/actions/jekyll-build-pages:v1.0.13", "build", "--safe",
               "--source", "/work/source", "--destination", "/work/rendered/"+label]
    subprocess.run(command, check=True)
    dest = work / "rendered" / label
    home = BeautifulSoup((dest / "lab/index.html").read_text(), "html.parser")
    route = BeautifulSoup((dest / "lab/roadmap/index.html").read_text(), "html.parser")
    return dest, home, route
def progress(home, route, count, active, next_id):
    total = len(experiments)
    percent = count*100//total
    assert home.select_one(".ov-progress-row strong").get_text(strip=True) == f"{percent}%"
    assert home.select_one(".ov-project-count").get_text(strip=True) == f"{count} / {total}"
    assert f"{count} / {total} 完成" in route.select_one(".ref-experiment-heading").get_text(" ", strip=True)
    assert len(route.select(".ref-experiment.completed")) == count
    assert len(route.select(".ref-experiment.in_progress")) == active
    if next_id:
        item = next(e for e in experiments if e["id"] == next_id)
        assert home.select_one(".ov-next")["href"].endswith("#"+item["anchor"])
        assert route.select_one(".ref-primary")["href"] == "#"+item["anchor"]
    else:
        assert "本章实验已完成" in home.get_text()

dest, home, route = build("initial")
progress(home, route, 0, 0, ids[0])
template_url = route.select_one(".ai-write-note")["href"]
query = urllib.parse.parse_qs(urllib.parse.urlparse(template_url).query)
assert query["filename"][0].endswith(ids[0]+".md")
assert "experiment_id:" in query["value"][0] and ids[0] in query["value"][0]
assert "learning_status: in_progress" in query["value"][0]
assert "## 疑问与下一步" in query["value"][0]
for slug in ("agent", "infra"):
    reader = BeautifulSoup((dest / "lab/read" / slug / "index.html").read_text(), "html.parser")
    assert reader.select_one("object")["data"].startswith("/assets/books/"+slug+".pdf")
note("plain-note", ids[0])  # A note alone must not imply completion.
dest, home, route = build("plain-note")
progress(home, route, 0, 0, ids[0])
assert route.select_one(".ai-experiment-note")
assert "编辑学习笔记" in route.get_text()
note("completed-note", ids[0], "completed", "03")
note("active-note", ids[1], "in_progress", "04")
dest, home, route = build("mixed")
progress(home, route, 1, 1, ids[1])
assert route.select_one(".ref-experiment.completed time").get_text(strip=True) == "2020-01-03"
note_href = route.select_one(".ref-experiment.completed .ai-experiment-note")["href"]
assert (dest / note_href.lstrip("/")).is_file()
assert "Fixture learning record" in (dest / note_href.lstrip("/")).read_text()
# Complete through the persisted YAML fallback, with no linked records.
for path in (source / "_posts").glob("*plain-note.md"): path.unlink()
for path in (source / "_posts").glob("*completed-note.md"): path.unlink()
for path in (source / "_posts").glob("*active-note.md"): path.unlink()
for e in experiments: e.update(status="completed", completed_at="2020-01-05")
dest, home, route = build("completed")
progress(home, route, len(ids), 0, None)
assert "1 / 8 单元" in route.select_one("#agent .ref-progress").get_text(" ", strip=True)
print("PASS: default state, draft note, latest note status, next task, note links, dates, 100% completion and PDF readers")

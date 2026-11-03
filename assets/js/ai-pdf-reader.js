// Pinned PDF.js 6.5.438 integration. Local PDF bytes never leave the browser.
const root = document.querySelector(".ai-local-reader");
if (root) {
  const frame = root.querySelector(".ai-pdf-frame");
  const workspace = root.querySelector(".ai-pdf-workspace");
  const status = root.querySelector(".ai-pdf-status");
  const input = root.querySelector(".ai-pdf-file-input");
  const buttons = Object.fromEntries([...root.querySelectorAll("[data-action]")].map(el => [el.dataset.action, el]));
  const book = root.dataset.book;
  const autoControl = root.querySelector(".ai-pdf-autosave input");
  const patchedManagers = new WeakSet();
  let uiManager = null, canUndo = false, canRedo = false;
  let autoEnabled = true, autoTimer = null, autoBlocked = false;
  let composing = false, pointerDown = false, editRevision = 0, savedCount = 0;
  try { autoEnabled = localStorage.getItem("ai-pdf-auto-save") !== "off"; } catch {}
  autoControl.checked = autoEnabled;
  root.dataset.autosave = String(autoEnabled);
  root.dataset.saveCount = "0";
  let app, handle = null, remembered = null, fileName = "", version = null;
  let dirty = false, saving = false, loading = false, sequence = 0, hasDocument = false;
  const defaultName = book === "agent" ? "AI-Agents-in-Depth-zh-CN.pdf" : "AI-Infra-Book.pdf";
  const setStatus = (text, kind = "") => { status.textContent = text; status.dataset.kind = kind; };
  function setDirty(value) {
    dirty = value;
    root.dataset.dirty = String(value);
    if (!value) { clearTimeout(autoTimer); autoTimer = null; }
    if (value && !autoBlocked) setStatus(fileName + (handle && autoEnabled
      ? " · 有批注修改，暂停编辑后将自动保存…"
      : " · 有未保存的批注，请按 Ctrl+S 或点击保存。"));
  }
  function scheduleAutoSave() {
    clearTimeout(autoTimer); autoTimer = null;
    if (!autoEnabled || !handle || !dirty || loading || saving || autoBlocked || composing || pointerDown) return;
    autoTimer = setTimeout(() => { autoTimer = null; void save(false, true); }, 2000);
  }
  function markChanged() {
    if (loading || !hasDocument) return;
    editRevision++;
    setDirty(true);
    scheduleAutoSave();
  }
  function installHistory(manager) {
    uiManager = manager;
    if (patchedManagers.has(manager)) return;
    patchedManagers.add(manager);
    for (const action of ["addCommands", "undo", "redo"]) {
      const original = manager[action];
      manager[action] = function (...args) {
        const changed = action === "addCommands" || (action === "undo" ? canUndo : canRedo);
        const result = original.apply(this, args);
        if (changed) markChanged();
        return result;
      };
    }
  }
  function history(action) {
    if (!hasDocument || loading || saving || !uiManager) return;
    uiManager.endCurrentEditing();
    frame.contentWindow.document.activeElement?.blur?.();
    if (action === "undo" ? canUndo : canRedo) uiManager[action]();
    updateButtons();
  }
  function commitForSave(automatic) {
    const doc = frame.contentWindow.document, active = doc.activeElement;
    const element = active?.closest?.(".freeTextEditor");
    if (automatic && element && active.isContentEditable) {
      // Commit a snapshot while preserving the user's text editor and caret.
      const editor = uiManager?.getEditor(element.id);
      if (editor) {
        const selection = frame.contentWindow.getSelection();
        const ranges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange());
        editor.commit();
        if (active.isConnected && active.textContent.trim()) {
          editor.enableEditMode();
          active.focus({ preventScroll: true });
          try {
            selection.removeAllRanges();
            for (const range of ranges) selection.addRange(range);
          } catch { selection.selectAllChildren(active); selection.collapseToEnd(); }
        }
        return;
      }
    }
    uiManager?.endCurrentEditing();
    active?.blur?.();
  }
  function updateButtons() {
    buttons.save.disabled = !hasDocument || saving || loading;
    buttons.export.disabled = !hasDocument || saving || loading;
    buttons.official.disabled = !hasDocument || loading;
    buttons.open.disabled = loading || saving;
    buttons.resume.disabled = !remembered || loading || saving;
    buttons.undo.disabled = !hasDocument || !canUndo || loading || saving;
    buttons.redo.disabled = !hasDocument || !canRedo || loading || saving;
    autoControl.disabled = !handle || loading;
    buttons.save.firstChild.textContent = handle ? "保存到原文件 " : "保存批注到本地 ";
  }
  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ai-learning-local-pdfs", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("files");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function recall() {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction("files").objectStore("files").get(book);
        request.onsuccess = () => resolve(request.result?.handle || null);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }
  async function remember(nextHandle) {
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put({ handle: nextHandle }, book);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("无法记住文件"));
      });
    } finally { db.close(); }
  }
  async function permission(fileHandle, ask = true) {
    const options = { mode: "readwrite" };
    if (await fileHandle.queryPermission(options) === "granted") return true;
    return ask && await fileHandle.requestPermission(options) === "granted";
  }
  function allowSwitch() {
    return !dirty || window.confirm("这份 PDF 有尚未保存的批注。确定放弃这些未保存的修改并切换文件吗？");
  }
  function report(error, fallback) {
    if (error?.name === "AbortError") {
      setStatus("操作已取消，当前文件和批注保持不变。");
    } else {
      setStatus(fallback + "：" + (error?.message || String(error)), "error");
      console.error(fallback, error);
    }
  }
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("阅读器启动超时，请刷新页面。")), 45000);
    document.addEventListener("webviewerloaded", function initialized(event) {
      const win = event.detail?.source;
      if (win !== frame.contentWindow) return;
      document.removeEventListener("webviewerloaded", initialized);
      win.PDFViewerApplicationOptions.set("disablePreferences", true);
      win.PDFViewerApplicationOptions.set("enableScripting", false);
      win.PDFViewerApplicationOptions.set("viewerCssTheme", 2);
      win.PDFViewerApplication.initializedPromise.then(() => {
        clearTimeout(timer);
        app = win.PDFViewerApplication;
        app.eventBus.on("annotationeditoruimanager", ({ uiManager: manager }) => installHistory(manager));
        app.eventBus.on("editingstateschanged", ({ source, details }) => {
          if (source !== uiManager) return;
          canUndo = details.hasSomethingToUndo;
          canRedo = details.hasSomethingToRedo;
          updateButtons();
        });
        // The built-in download/Save buttons and Ctrl+S share our local saving.
        app.save = () => save(false);
        app.download = () => save(false);
        app.downloadOrSave = () => save(false);
        const nativeInput = win.document.querySelector("#fileInput");
        // Keep all local opening on the parent picker so its writable handle is retained.
        if (nativeInput) nativeInput.addEventListener("change", e => {
          e.stopImmediatePropagation();
          e.target.value = "";
          setStatus("请使用上方“选择本地 PDF”，这样才能把批注保存回原文件。");
        }, true);
        const openButtons = win.document.querySelectorAll("#openFile, #secondaryOpenFile");
        openButtons.forEach(button => button.addEventListener("click", e => {
          e.preventDefault(); e.stopImmediatePropagation(); openLocal();
        }, true));
        // Avoid opening a dropped file without a writable handle.
        win.document.addEventListener("drop", e => {
          if (e.dataTransfer?.files?.length) {
            e.preventDefault(); e.stopImmediatePropagation();
            setStatus("请点击“选择本地 PDF”打开文件，以保留写回权限。");
          }
        }, true);
        win.addEventListener("keydown", keySave, true);
        win.document.addEventListener("input", event => {
          if (event.target.closest?.(".freeTextEditor, .commentManager")) markChanged();
        }, true);
        win.document.addEventListener("compositionstart", () => { composing = true; clearTimeout(autoTimer); }, true);
        win.document.addEventListener("compositionend", () => { composing = false; markChanged(); }, true);
        win.document.addEventListener("pointerdown", () => { pointerDown = true; clearTimeout(autoTimer); }, true);
        const pointerEnded = () => { pointerDown = false; scheduleAutoSave(); };
        win.document.addEventListener("pointerup", pointerEnded, true);
        win.document.addEventListener("pointercancel", pointerEnded, true);
        win.addEventListener("blur", pointerEnded);
        document.addEventListener("pointerup", pointerEnded, true);
        document.addEventListener("pointercancel", pointerEnded, true);
        win.document.addEventListener("focusout", scheduleAutoSave, true);
        resolve(app);
      }, error => { clearTimeout(timer); reject(error); });
    });
  });
  async function openDocument(source, nextHandle = null, localFile = null) {
    const ticket = ++sequence;
    loading = true;
    clearTimeout(autoTimer); autoTimer = null;
    canUndo = canRedo = false; autoBlocked = false; editRevision = 0; savedCount = 0;
    root.dataset.saveCount = "0";
    updateButtons();
    setStatus("正在打开 PDF…");
    try {
      await ready;
      let args;
      if (localFile) {
        const data = new frame.contentWindow.Uint8Array(await localFile.arrayBuffer());
        if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-") throw new Error("所选文件不是有效 PDF");
        args = { data, filename: localFile.name };
      } else {
        args = { url: new URL(source, location.origin).href };
      }
      await app.open(args);
      await app.pdfViewer.firstPagePromise;
      if (ticket !== sequence) return;
      handle = nextHandle;
      fileName = localFile?.name || defaultName;
      version = localFile ? { size: localFile.size, modified: localFile.lastModified } : null;
      hasDocument = true;
      root.dataset.source = localFile ? "local" : "official";
      root.dataset.fileName = fileName;
      root.dataset.ready = "true";
      setDirty(false);
      const storage = app.pdfDocument.annotationStorage;
      const previousModified = storage.onSetModified;
      storage.onSetModified = () => { previousModified?.(); markChanged(); };
      setStatus(localFile
        ? fileName + (handle ? " · 本地文件；自动保存可用，也可按 Ctrl+S 保存。" : " · 本地预览；请另存批注副本保留修改。")
        : "当前为在线教材；要长期保留批注，请先选择桌面上的本地 PDF。");
      // Let even previously-bound native Save commands route through our implementation.
      app.save = () => save(false);
      app.download = () => save(false);
      app.downloadOrSave = () => save(false);
    } catch (error) {
      hasDocument = Boolean(app?.pdfDocument);
      root.dataset.ready = hasDocument ? "true" : "false";
      throw error;
    } finally { loading = false; updateButtons(); }
  }
  async function openHandle(nextHandle, ask = true) {
    if (!await permission(nextHandle, ask)) throw new Error("需要允许读取和保存这份文件，或使用“另存批注副本”。");
    const file = await nextHandle.getFile();
    await openDocument(null, nextHandle, file);
    remembered = nextHandle;
    try { await remember(nextHandle); }
    catch { setStatus(file.name + " · 已打开本地文件；本次可保存，下次可能需要重新选择。"); }
    updateButtons();
  }
  async function openLocal() {
    if (loading || saving || !allowSwitch()) return;
    try {
      if ("showOpenFilePicker" in window) {
        const [nextHandle] = await window.showOpenFilePicker({
          id: "ai-textbook-" + book, startIn: "desktop", multiple: false,
          types: [{ description: "PDF 教材", accept: { "application/pdf": [".pdf"] } }]
        });
        if (nextHandle) await openHandle(nextHandle);
      } else { input.value = ""; input.click(); }
    } catch (error) { report(error, "打开本地 PDF 失败"); }
  }
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try { await openDocument(null, null, file); }
    catch (error) { report(error, "打开 PDF 失败"); }
  });
  async function save(copy = false, automatic = false) {
    if (!hasDocument || saving || loading) return;
    if (automatic && (!autoEnabled || !handle || !dirty || autoBlocked || composing || pointerDown)) return;
    clearTimeout(autoTimer); autoTimer = null;
    saving = true;
    root.dataset.saving = "true";
    updateButtons();
    let target = copy ? null : handle;
    let writable = null;
    try {
      // Request permission while the Save click/Ctrl+S still has user activation.
      if (target && !await permission(target, !automatic)) throw new Error("未获得写入权限，批注尚未保存。");
      if (!target && "showSaveFilePicker" in window) {
        target = await window.showSaveFilePicker({
          id: "ai-textbook-save-" + book,
          suggestedName: fileName.replace(/\.pdf$/i, "-批注.pdf"),
          types: [{ description: "带批注的 PDF", accept: { "application/pdf": [".pdf"] } }]
        });
      }
      commitForSave(automatic);
      await new Promise(resolve => automatic ? setTimeout(resolve, 0) : requestAnimationFrame(resolve));
      const doc = app.pdfDocument;
      const savingRevision = editRevision;
      setStatus(automatic ? "正在自动保存批注…" : "正在保存批注…");
      const data = doc.annotationStorage.size ? await doc.saveDocument() : await doc.getData();
      if (target) {
        // Never overwrite changes made in another PDF application since we opened/saved it.
        if (handle && version && await target.isSameEntry(handle)) {
          const current = await target.getFile();
          if (current.size !== version.size || current.lastModified !== version.modified) {
            throw new Error("原文件已在其他程序中修改。请先“另存批注副本”，或重新打开原文件。");
          }
        }
        writable = await target.createWritable();
        await writable.write(data);
        await writable.close();
        writable = null;
        const saved = await target.getFile();
        handle = target;
        remembered = target;
        version = { size: saved.size, modified: saved.lastModified };
        fileName = saved.name;
        root.dataset.source = "local";
        root.dataset.fileName = saved.name;
        autoBlocked = false;
        savedCount++;
        root.dataset.saveCount = String(savedCount);
        if (savingRevision === editRevision) { doc.annotationStorage.resetModified(); setDirty(false); }
        else setDirty(true);
        try { await remember(target); } catch { /* File itself is already saved successfully. */ }
        if (!dirty) setStatus((automatic ? "已自动保存 " : "已保存 ") +
          new Date().toLocaleTimeString("zh-CN", { hour12: false }) + " · " + saved.name, "success");
      } else {
        // Browsers without the File System Access API can export a portable annotated PDF.
        const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName.replace(/\.pdf$/i, "-批注.pdf");
        a.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        setStatus("已发起批注副本下载。请确认下载完成，下次打开保存后的副本；原文件未改动。");
        // A download cannot confirm that the user actually saved a file.
      }
    } catch (error) {
      if (writable) { try { await writable.abort(); } catch {} }
      if (automatic) autoBlocked = true;
      report(error, automatic ? "自动保存暂停，批注尚未保存，请手动保存重试" : "批注尚未保存");
    } finally {
      saving = false; root.dataset.saving = "false"; updateButtons();
      if (dirty) scheduleAutoSave();
    }
  }
  function keySave(event) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = event.key.toLowerCase();
      const target = event.target;
      const typing = target?.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target?.tagName || "");
      if (!typing && (key === "z" || key === "y")) {
        event.preventDefault(); event.stopImmediatePropagation();
        history(key === "y" || event.shiftKey ? "redo" : "undo"); return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
      event.preventDefault(); event.stopImmediatePropagation(); openLocal(); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault(); event.stopImmediatePropagation(); save(false);
    }
  }
  buttons.undo.addEventListener("pointerdown", event => event.preventDefault());
  buttons.redo.addEventListener("pointerdown", event => event.preventDefault());
  buttons.undo.addEventListener("click", () => history("undo"));
  buttons.redo.addEventListener("click", () => history("redo"));
  autoControl.addEventListener("change", () => {
    autoEnabled = autoControl.checked; autoBlocked = false;
    root.dataset.autosave = String(autoEnabled);
    try { localStorage.setItem("ai-pdf-auto-save", autoEnabled ? "on" : "off"); } catch {}
    if (dirty) { setDirty(true); scheduleAutoSave(); }
    else setStatus(autoEnabled ? "自动保存已开启，停止编辑约 2 秒后保存到已授权的本地 PDF。" : "自动保存已关闭，请按 Ctrl+S 手动保存。");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty && autoEnabled && handle && !autoBlocked) {
      clearTimeout(autoTimer); void save(false, true);
    }
  });
  buttons.open.addEventListener("click", openLocal);
  buttons.resume.addEventListener("click", async () => {
    if (!remembered || !allowSwitch()) return;
    try { await openHandle(remembered); } catch (error) { report(error, "继续本地阅读失败"); }
  });
  buttons.save.addEventListener("click", () => save(false));
  buttons.export.addEventListener("click", () => save(true));
  buttons.official.addEventListener("click", async () => {
    if (!allowSwitch()) return;
    try { await openDocument(root.dataset.pdf); } catch (error) { report(error, "打开在线教材失败"); }
  });
  buttons.fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await workspace.requestFullscreen();
    } catch (error) { report(error, "无法进入全屏，请使用浏览器全屏功能"); }
  });
  document.addEventListener("fullscreenchange", () => {
    const full = document.fullscreenElement === workspace;
    buttons.fullscreen.textContent = full ? "退出全屏 ⛶" : "全屏阅读 ⛶";
    buttons.fullscreen.setAttribute("aria-pressed", String(full));
  });
  window.addEventListener("keydown", keySave, true);
  window.addEventListener("beforeunload", event => {
    if (dirty) { event.preventDefault(); event.returnValue = ""; }
  });
  frame.src = root.dataset.viewer + "?file=";
  (async () => {
    try {
      await ready;
      try { remembered = await recall(); } catch { /* Private modes may disable persistence. */ }
      updateButtons();
      if (remembered && await permission(remembered, false)) await openHandle(remembered, false);
      else {
        await openDocument(root.dataset.pdf);
        if (remembered) setStatus("已记住上次的本地 PDF。点击“继续上次本地文件”并允许访问，即可继续阅读。");
      }
    } catch (error) { report(error, "阅读器加载失败"); }
  })();
}

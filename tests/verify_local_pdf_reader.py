"""Browser check using a disposable OPFS PDF copy, never the user's desktop file."""
import asyncio, json, os, re
from playwright.async_api import async_playwright

BASE = "https://why-ww.github.io"
MARKER = "LOCAL_PDF_NOTE_TEST_20261103"
async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={"width":1440,"height":1000}, accept_downloads=True)
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(BASE+"/lab/read/agent/?reader=local-v1", wait_until="domcontentloaded")
        await page.wait_for_selector('.ai-local-reader[data-ready="true"]',timeout=120000)
        await page.wait_for_function("document.querySelector('iframe').contentWindow.PDFViewerApplication.pdfDocument?.numPages > 0")
        await page.evaluate("""async () => {
            const bytes=await (await fetch('/assets/books/agent.pdf')).arrayBuffer();
            const dir=await navigator.storage.getDirectory();
            const h=await dir.getFileHandle('test-ai-local-reader.pdf',{create:true});
            const w=await h.createWritable(); await w.write(bytes); await w.close();
            window.__testHandle=h;
            window.showOpenFilePicker=async()=>[h];
        }""")
        await page.locator('[data-action="open"]').click()
        await page.wait_for_selector('.ai-local-reader[data-source="local"][data-ready="true"]')
        await page.wait_for_function("document.querySelector('.ai-local-reader').dataset.fileName === 'test-ai-local-reader.pdf'")
        await page.locator(".ai-pdf-autosave input").uncheck()
        pdf_frame = page.frame_locator(".ai-pdf-frame")
        await pdf_frame.locator('#editorFreeTextButton').click()
        layer = pdf_frame.locator('.page[data-page-number="1"] .annotationEditorLayer')
        await layer.wait_for(state="visible")
        await layer.click(position={"x":150,"y":180})
        editor = pdf_frame.locator('.freeTextEditor [contenteditable="true"]').last
        await editor.fill(MARKER)
        # Save via the real integration into the real disposable FileSystemFileHandle.
        await page.locator('[data-action="save"]').click()
        await page.wait_for_function("document.querySelector('.ai-pdf-status').dataset.kind === 'success'",timeout=60000)
        assert "已保存" in await page.locator(".ai-pdf-status").inner_text()
        assert await page.locator('.ai-local-reader').get_attribute("data-dirty") == "false"
        assert await page.evaluate("(async()=>{const h=window.__testHandle; return (await h.getFile()).size;})()") > 0
        # Reload the page and verify persisted handle plus annotation in the saved PDF.
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_selector('.ai-local-reader[data-source="local"][data-ready="true"]',timeout=120000)
        annotations = await page.evaluate("""async () => {
          const doc=document.querySelector('iframe').contentWindow.PDFViewerApplication.pdfDocument;
          return (await (await doc.getPage(1)).getAnnotations()).map(a=>a.contentsObj?.str||a.contents||"");
        }""")
        assert MARKER in annotations, annotations
        print("PASS: annotated PDF saved locally and reopened with annotation intact")
        await page.locator('[data-action="fullscreen"]').click()
        await page.wait_for_function("document.fullscreenElement?.id === 'pdf-workspace'")
        await page.screenshot(path="local-reader-fullscreen.png")
        await page.locator('[data-action="fullscreen"]').click()
        await page.wait_for_function("document.fullscreenElement === null")
        print("PASS: entering and leaving full-screen")
        # Make a second annotation, simulate a write failure and confirm dirty state remains.
        await pdf_frame.locator('#editorFreeTextButton').click()
        await pdf_frame.locator('.page[data-page-number="1"] .annotationEditorLayer').click(position={"x":180,"y":250})
        await pdf_frame.locator('.freeTextEditor [contenteditable="true"]').last.fill("WRITE_FAILURE_TEST")
        await page.evaluate("""() => {
          window.__realWrite=FileSystemFileHandle.prototype.createWritable;
          FileSystemFileHandle.prototype.createWritable=async function(){throw new DOMException('模拟写入失败','NotAllowedError');};
        }""")
        await page.locator('[data-action="save"]').click()
        await page.wait_for_function("document.querySelector('.ai-pdf-status').dataset.kind === 'error'")
        assert await page.locator('.ai-local-reader').get_attribute("data-dirty") == "true"
        assert "尚未保存" in await page.locator(".ai-pdf-status").inner_text()
        await page.evaluate("() => { FileSystemFileHandle.prototype.createWritable=window.__realWrite; }")
        # A change made by another application must not be overwritten silently.
        await page.evaluate("""async () => {
          const record=await new Promise((resolve,reject)=>{
            const r=indexedDB.open('ai-learning-local-pdfs',1);
            r.onsuccess=()=>{const db=r.result; const q=db.transaction('files').objectStore('files').get('agent');q.onsuccess=()=>{resolve(q.result);db.close();};};
            r.onerror=()=>reject(r.error);
          });
          const f=await record.handle.getFile(); const w=await record.handle.createWritable();
          await w.write(await f.arrayBuffer()); await w.write(new TextEncoder().encode('\\n% external modification\\n')); await w.close();
        }""")
        await page.locator('[data-action="save"]').click()
        await page.wait_for_function("document.querySelector('.ai-pdf-status').textContent.includes('其他程序')")
        assert await page.locator('.ai-local-reader').get_attribute("data-dirty") == "true"
        # This context contains only disposable files, so dismiss the unsaved-changes dialog.
        page.on("dialog", lambda dialog: dialog.accept())
        await page.close(run_before_unload=False)
        auto = await context.new_page()
        auto.on("pageerror", lambda e: errors.append(str(e)))
        await auto.goto(BASE+"/lab/read/agent/?reader=autosave-v2",wait_until="domcontentloaded")
        await auto.wait_for_selector('.ai-local-reader[data-source="local"][data-ready="true"]',timeout=120000)
        await auto.evaluate("""async () => {
          const dir=await navigator.storage.getDirectory();
          const h=await dir.getFileHandle('test-ai-autosave.pdf',{create:true});
          const w=await h.createWritable();await w.write(await (await fetch('/assets/books/agent.pdf')).arrayBuffer());await w.close();
          window.__autoHandle=h;
          window.showOpenFilePicker=async()=>[h];
        }""")
        await auto.locator('[data-action="open"]').click()
        await auto.wait_for_function("document.querySelector('.ai-local-reader').dataset.fileName==='test-ai-autosave.pdf'")
        await auto.locator(".ai-pdf-autosave input").check()
        af=auto.frame_locator(".ai-pdf-frame")
        await af.locator("#editorFreeTextButton").click()
        await af.locator('.page[data-page-number="1"] .annotationEditorLayer').click(position={"x":160,"y":190})
        text=af.locator('.freeTextEditor [contenteditable="true"]').last
        await text.fill("AUTO_SAVE_TEST")
        await auto.wait_for_function("Number(document.querySelector('.ai-local-reader').dataset.saveCount)>0 && document.querySelector('.ai-local-reader').dataset.dirty==='false'",timeout=30000)
        assert "已自动保存" in await auto.locator(".ai-pdf-status").inner_text()
        assert await auto.evaluate("document.querySelector('iframe').contentDocument.activeElement.isContentEditable")
        await text.press("End")
        await text.press_sequentially("_MORE")
        await auto.wait_for_function("Number(document.querySelector('.ai-local-reader').dataset.saveCount)>1 && document.querySelector('.ai-local-reader').dataset.dirty==='false'",timeout=30000)
        async def contents():
            return await auto.evaluate("""async () => {
              const lib=await import('/assets/pdfjs/build/pdf.mjs');
              lib.GlobalWorkerOptions.workerSrc='/assets/pdfjs/build/pdf.worker.mjs';
              const f=await window.__autoHandle.getFile();
              const task=lib.getDocument({data:new Uint8Array(await f.arrayBuffer())});
              const d=await task.promise;
              const a=await (await d.getPage(1)).getAnnotations();
              const values=a.map(x=>x.contentsObj?.str||x.contents||'');
              await task.destroy();return values;
            }""")
        assert "AUTO_SAVE_TEST_MORE" in await contents()
        before=int(await auto.locator(".ai-local-reader").get_attribute("data-save-count"))
        await auto.locator('[data-action="undo"]').click()
        await auto.wait_for_function("(n)=>Number(document.querySelector('.ai-local-reader').dataset.saveCount)>n && document.querySelector('.ai-local-reader').dataset.dirty==='false'",arg=before,timeout=30000)
        values=await contents()
        assert "AUTO_SAVE_TEST_MORE" not in values and "AUTO_SAVE_TEST" in values,values
        before=int(await auto.locator(".ai-local-reader").get_attribute("data-save-count"))
        await auto.locator('[data-action="redo"]').click()
        await auto.wait_for_function("(n)=>Number(document.querySelector('.ai-local-reader').dataset.saveCount)>n && document.querySelector('.ai-local-reader').dataset.dirty==='false'",arg=before,timeout=30000)
        assert "AUTO_SAVE_TEST_MORE" in await contents()
        await auto.locator('[data-action="fullscreen"]').focus()
        before=int(await auto.locator(".ai-local-reader").get_attribute("data-save-count"))
        await auto.keyboard.press("Control+z")
        await auto.wait_for_function("(n)=>Number(document.querySelector('.ai-local-reader').dataset.saveCount)>n && document.querySelector('.ai-local-reader').dataset.dirty==='false'",arg=before,timeout=30000)
        assert "AUTO_SAVE_TEST_MORE" not in await contents()
        before=int(await auto.locator(".ai-local-reader").get_attribute("data-save-count"))
        await auto.keyboard.press("Control+Shift+z")
        await auto.wait_for_function("(n)=>Number(document.querySelector('.ai-local-reader').dataset.saveCount)>n && document.querySelector('.ai-local-reader').dataset.dirty==='false'",arg=before,timeout=30000)
        assert "AUTO_SAVE_TEST_MORE" in await contents()
        await auto.locator(".ai-pdf-autosave input").uncheck()
        before=int(await auto.locator(".ai-local-reader").get_attribute("data-save-count"))
        await auto.locator('[data-action="undo"]').click()
        await auto.wait_for_timeout(3000)
        assert int(await auto.locator(".ai-local-reader").get_attribute("data-save-count"))==before
        assert await auto.locator(".ai-local-reader").get_attribute("data-dirty")=="true"
        await auto.locator('[data-action="save"]').click()
        await auto.wait_for_function("document.querySelector('.ai-local-reader').dataset.dirty==='false'")
        await auto.screenshot(path="local-reader-autosave-undo.png")
        await auto.close()
        print("PASS: autosave, uninterrupted text editing, persisted undo/redo, keyboard shortcuts, disable switch and manual save")
        assert not errors, errors
        await browser.close()
        print("PASS: local open, PDF text annotation saved into original handle, retained after reload, full-screen, failed-write protection and external-change protection")
asyncio.run(main())

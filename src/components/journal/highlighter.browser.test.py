import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

S = Path("/tmp/browser/highlighter/screenshots")
S.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width":393,"height":763}, device_scale_factor=2)
        page = await ctx.new_page()
        errs=[]
        page.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)

        if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS")=="injected":
            key=os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"]
            sess=os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]
            await page.goto("http://localhost:8080")
            await page.evaluate("([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('hasSeenTutorial','true')}",[key,sess])
            uid = json.loads(sess)["user"]["id"]
            await page.evaluate("(k)=>localStorage.setItem(k,'1')", f"orientation-onboarded:{uid}")
        await page.goto("http://localhost:8080/dashboard")
        await page.wait_for_timeout(3500)

        # open Journal (rendered on the Board; the card starts a note)
        card = page.get_by_text("Click to start writing").first
        if await card.count():
            await card.scroll_into_view_if_needed()
            await card.click()
            print("clicked journal card")
        else:
            print("journal card not found")
        await page.wait_for_timeout(1800)
        

        # enter All Notes, then start a new note
        an = page.get_by_text("All Notes").first
        if await an.count():
            await an.click(); print("opened All Notes")
        await page.wait_for_timeout(1200)
        nn = page.get_by_text("New Note").first
        if await nn.count():
            await nn.click(); print("clicked New Note")
        else:
            print("New Note not found")
        await page.wait_for_timeout(1500)
        

        editor = page.locator('[contenteditable="true"]').first
        await editor.fill("Alpha")
        await page.get_by_role("button", name="Highlight", exact=True).click()
        await page.get_by_label("Highlight Blue", exact=True).click()
        assert await page.get_by_role("toolbar", name="Highlight colors").is_visible()
        word = await editor.evaluate("""el => { const r=document.createRange(); r.setStart(el.firstChild,0); r.setEnd(el.firstChild,5); const b=r.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}; }""")
        await page.mouse.click(word['x'],word['y'])
        assert await editor.locator('mark').inner_text() == 'Alpha'
        await page.get_by_label("Stop highlighting", exact=True).click()
        assert not await page.get_by_role("toolbar", name="Highlight colors").count()
        await editor.evaluate("""el => {const m=el.querySelector('mark'); const r=document.createRange(); r.selectNodeContents(m); r.collapse(false); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus();}""")
        await page.keyboard.type(" new words")
        print('FINAL HTML', await editor.inner_html())
        assert await editor.locator('mark').inner_text() == 'Alpha'
        assert 'Alpha new words' == (await editor.inner_text()).replace('\xa0', ' ')
        print('PASS persistent compact palette, word highlight, X close, plain typing')
        # Clear this temporary note so the untouched draft can be discarded.
        await editor.fill('')
        await page.wait_for_timeout(1500)
        await b.close()

asyncio.run(main())

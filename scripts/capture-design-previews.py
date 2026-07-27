#!/usr/bin/env python3
"""
Screenshot every component preview in the Claude Design "Aurora Design System"
project.

The project's render_preview token is PROJECT-SCOPED (not path-bound), so one
token serves every file: the manifest + each component's dsCard.html + the JS
bundle. We fetch _ds_manifest.json, then screenshot each card at its declared
viewport.

Usage:
  1. Get a fresh token from the design tool's render_preview (any file). The
     serve_url looks like:
       https://<PID>.claudeusercontent.com/v1/design/projects/<PID>/serve/<path>?t=<TOKEN>&direct=1
     Copy everything after `t=` and before `&` into CD_TOKEN.
  2. CD_TOKEN='<token>' python3 scripts/capture-design-previews.py [outdir]

Token TTL is ~1h; re-fetch if you get 403s.
"""
import asyncio
import json
import os
import re
import sys
import urllib.request
from urllib.parse import quote

from playwright.async_api import async_playwright

PID = "a9af47aa-77b0-43ed-b4cd-5d52391528e5"
BASE = f"https://{PID}.claudeusercontent.com/v1/design/projects/{PID}/serve"
TOKEN = os.environ.get("CD_TOKEN", "").strip()
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else "cd_shots"
CONCURRENCY = int(os.environ.get("CD_CONCURRENCY", "2"))

def serve_url(path: str) -> str:
    normalized = path.strip().lstrip("/")
    segments = normalized.split("/")
    if (
        not normalized
        or any(segment in {"", ".", ".."} for segment in segments)
        or "//" in normalized
        or "?" in normalized
        or "#" in normalized
    ):
        raise ValueError(f"unsafe design preview path: {path!r}")
    return f"{BASE}/{quote(normalized, safe='/-_.')}?t={TOKEN}&direct=1"

def sanitize(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("_")

def parse_vp(vp):
    if not vp:
        return (820, 520)
    m = re.match(r"(\d+)x(\d+)", str(vp))
    return (int(m.group(1)), int(m.group(2))) if m else (820, 520)

def fetch_manifest():
    url = serve_url("_ds_manifest.json")
    req = urllib.request.Request(url, headers={"User-Agent": "cd-shots"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

async def shoot_card(browser, card, idx, total):
    name = card.get("name") or card["path"].split("/")[-1]
    out = os.path.join(OUTDIR, f"{sanitize(name)}.png")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"[{idx}/{total}] skip {name} (exists)")
        return
    w, h = parse_vp(card.get("viewport"))
    # cap absurdly tall brand pages so files stay reasonable
    h = min(h, 2000)
    ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2)
    page = await ctx.new_page()
    try:
        await page.goto(serve_url(card["path"]), wait_until="networkidle", timeout=45000)
        # dsCards pull React+Babel+bundle from unpkg then compile in-browser
        await page.wait_for_timeout(2600)
        await page.screenshot(path=out)
        print(f"[{idx}/{total}] OK  {name}  ({w}x{h})")
    except Exception as e:
        print(f"[{idx}/{total}] ERR {name}: {e}")
    finally:
        await ctx.close()

async def main():
    if not TOKEN:
        sys.exit("CD_TOKEN env var required (see header).")
    os.makedirs(OUTDIR, exist_ok=True)
    manifest = fetch_manifest()
    cards = manifest.get("cards", [])
    total = len(cards)
    print(f"manifest: {total} cards -> {OUTDIR}/")
    async with async_playwright() as p:
        b = await p.firefox.launch(headless=True)
        sem = asyncio.Semaphore(CONCURRENCY)
        async def guarded(card, i):
            async with sem:
                await shoot_card(b, card, i, total)
        await asyncio.gather(*(guarded(c, i + 1) for i, c in enumerate(cards)))
        await b.close()
    print("DONE")

if __name__ == "__main__":
    asyncio.run(main())

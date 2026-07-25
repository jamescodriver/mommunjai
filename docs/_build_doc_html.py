#!/usr/bin/env python3
"""Generate a glass-styled, collapsible HTML review doc from a Markdown file.
Usage: python3 _build_doc_html.py <input.md> <output.html> "<Title>" "<emoji>"
Reusable for PRD / ARCHITECTURE / DATA-MODEL. Mermaid ```mermaid blocks render as diagrams.
Self-contained page (markdown embedded inline; rendered client-side via CDN marked+mermaid)."""
import sys, json, pathlib

md_path, out_path, title, emoji = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
md = pathlib.Path(md_path).read_text(encoding="utf-8")
md_json = json.dumps(md)

HTML = r"""<!doctype html>
<html lang="th"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__ — Mommunjai</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  :root{ --rose:#E8A0BF; --teal:#5FB3B3; --cream:#FFF7F3; --ink:#3d3d4d; --gold:#E7B84B;
         --glass:rgba(255,255,255,.62); --line:rgba(255,255,255,.7); --shadow:0 8px 30px rgba(90,60,80,.12);}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Prompt','Noto Sans Thai',system-ui,-apple-system,sans-serif;color:var(--ink);
       background:linear-gradient(135deg,#FFF7F3 0%,#FDEBF1 40%,#E7F5F4 100%);min-height:100vh;line-height:1.6}
  .wrap{max-width:1200px;margin:0 auto;padding:24px;display:grid;grid-template-columns:250px 1fr;gap:24px}
  header.top{grid-column:1/-1;display:flex;align-items:center;gap:14px;background:var(--glass);
       backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:20px;padding:18px 24px;box-shadow:var(--shadow)}
  header.top .em{font-size:34px}
  header.top h1{margin:0;font-size:22px;font-weight:600}
  header.top .sub{margin:0;font-size:13px;opacity:.7}
  nav.toc{position:sticky;top:24px;align-self:start;background:var(--glass);backdrop-filter:blur(14px);
       border:1px solid var(--line);border-radius:20px;padding:16px;box-shadow:var(--shadow);max-height:85vh;overflow:auto}
  nav.toc a{display:block;padding:6px 10px;border-radius:10px;color:var(--ink);text-decoration:none;font-size:13px;opacity:.85}
  nav.toc a:hover{background:rgba(232,160,191,.18)}
  main{min-width:0}
  details.sec{background:var(--glass);backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:20px;
       padding:6px 24px;margin-bottom:16px;box-shadow:var(--shadow)}
  details.sec>summary{cursor:pointer;font-size:19px;font-weight:600;padding:14px 0;list-style:none;display:flex;align-items:center;gap:10px}
  details.sec>summary::-webkit-details-marker{display:none}
  details.sec>summary::before{content:'▸';color:var(--rose);transition:transform .2s}
  details.sec[open]>summary::before{transform:rotate(90deg)}
  .body{padding-bottom:16px}
  h1,h2,h3{line-height:1.3} h3{font-size:16px;margin-top:20px}
  table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px;overflow:auto;display:block}
  th,td{border:1px solid rgba(120,90,110,.18);padding:8px 10px;text-align:left;vertical-align:top}
  th{background:rgba(95,179,179,.14)}
  code{background:rgba(120,90,110,.1);padding:2px 6px;border-radius:6px;font-size:.9em}
  pre{background:rgba(40,40,60,.9);color:#eee;padding:14px;border-radius:12px;overflow:auto}
  pre code{background:none;color:inherit}
  a{color:#c85a8a} blockquote{border-left:4px solid var(--teal);margin:12px 0;padding:6px 16px;background:rgba(95,179,179,.08);border-radius:8px}
  input[type=checkbox]{margin-right:6px}
  .mermaid{background:rgba(255,255,255,.5);border-radius:12px;padding:12px;margin:12px 0;text-align:center}
  .toolbar{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}
  .btn{background:var(--glass);border:1px solid var(--line);border-radius:12px;padding:8px 14px;cursor:pointer;font:inherit;font-size:13px;color:var(--ink)}
  .btn:hover{background:rgba(232,160,191,.2)}
  @media(max-width:820px){.wrap{grid-template-columns:1fr;padding:14px}nav.toc{position:static;max-height:none}}
  @media print{nav.toc,.toolbar{display:none}details.sec{break-inside:avoid}}
</style></head><body>
<div class="wrap">
  <header class="top"><span class="em">__EMOJI__</span><div><h1>__TITLE__</h1><p class="sub">Mommunjai · เอกสารรีวิว (พับ/กางแต่ละ section ได้ · แก้ที่ไฟล์ .md แล้ว regenerate)</p></div></header>
  <div class="toolbar">
    <button class="btn" onclick="document.querySelectorAll('details.sec').forEach(d=>d.open=true)">กางทั้งหมด</button>
    <button class="btn" onclick="document.querySelectorAll('details.sec').forEach(d=>d.open=false)">พับทั้งหมด</button>
    <button class="btn" onclick="window.print()">พิมพ์ / PDF</button>
  </div>
  <nav class="toc" id="toc"></nav>
  <main id="main"></main>
</div>
<script>
  const MD = __MD_JSON__;
  mermaid.initialize({startOnLoad:false, theme:'base', themeVariables:{primaryColor:'#FDEBF1',primaryBorderColor:'#E8A0BF',lineColor:'#5FB3B3',fontFamily:'Prompt,sans-serif'}});
  marked.setOptions({breaks:false, gfm:true});
  // split markdown by top-level H2 into sections
  const lines = MD.split('\n');
  const sections = []; let cur=null;
  for(const ln of lines){
    if(/^##\s+/.test(ln)){ cur={title:ln.replace(/^##\s+/,'').trim(), buf:[]}; sections.push(cur); }
    else if(cur){ cur.buf.push(ln); }
    else { (sections._pre=sections._pre||[]).push(ln); }
  }
  const main=document.getElementById('main'), toc=document.getElementById('toc');
  if(sections._pre){ const d=document.createElement('div'); d.innerHTML=marked.parse(sections._pre.join('\n')); main.appendChild(d); }
  sections.forEach((s,i)=>{
    const id='s'+i;
    const det=document.createElement('details'); det.className='sec'; det.open = i<3; det.id=id;
    const sum=document.createElement('summary'); sum.textContent=s.title; det.appendChild(sum);
    const body=document.createElement('div'); body.className='body';
    body.innerHTML=marked.parse(s.buf.join('\n'));
    det.appendChild(body); main.appendChild(det);
    const a=document.createElement('a'); a.href='#'+id; a.textContent=s.title;
    a.onclick=e=>{det.open=true;}; toc.appendChild(a);
  });
  // render mermaid code blocks
  document.querySelectorAll('pre code.language-mermaid').forEach((c,i)=>{
    const div=document.createElement('div'); div.className='mermaid'; div.textContent=c.textContent;
    c.closest('pre').replaceWith(div);
  });
  mermaid.run({querySelector:'.mermaid'});
</script>
</body></html>"""

HTML = (HTML.replace("__TITLE__", title).replace("__EMOJI__", emoji).replace("__MD_JSON__", md_json))
pathlib.Path(out_path).write_text(HTML, encoding="utf-8")
print("wrote", out_path, "(", len(HTML), "bytes )")

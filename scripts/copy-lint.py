#!/usr/bin/env python3
"""Checks the copy files against the rules in .claude/agents/idealicp-copy.md.
Run from the repo root: python3 scripts/copy-lint.py"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / 'content' / 'copy' / 'pages'
KINDS = {'hero','opener','split','cards','steps','ladder','receipts','quote','faq','plans','prose','form','band','notes'}
BANNED = ['unlock','unleash','elevate','supercharge','seamless','game changer','game-changer','cutting edge','cutting-edge','next level',"today's digital landscape",'leverage','empower','robust','tailored','holistic','journey']
CHECK = ['platform','software',' app ','solution']  # fine for Google, Meta or WhatsApp; never for Ideal ICP itself
LIVE = {'/questionnaire','/auth','/privacy','/terms','/guides/why-facebook-leads-dont-buy','/guides/cost-per-lead-kenya','/guides/qualify-leads-on-whatsapp'}
files = sorted(p for p in PAGES.glob('*.md') if not p.name.startswith('zz-'))
paths = {}
for f in files:
    m = re.search(r'^path:\s*(\S+)', f.read_text(), re.M)
    if m: paths[m.group(1)] = f.name
problems = 0
def bad(f, msg):
    global problems; problems += 1; print(f'{f.name}: {msg}')
for f in files:
    raw = f.read_text()
    fm = re.match(r'^---\n(.*?)\n---\n', raw, re.S)
    if not fm: bad(f, 'no front matter'); continue
    meta = dict((l.split(':',1)[0].strip(), l.split(':',1)[1].strip()) for l in fm.group(1).split('\n') if ':' in l)
    for k in ('path','title','description','question','status'):
        if not meta.get(k): bad(f, f'missing {k}')
    if len(meta.get('title','')) > 62: bad(f, f"title is {len(meta['title'])} characters")
    if len(meta.get('description','')) > 158: bad(f, f"description is {len(meta['description'])} characters")
    body = raw[fm.end():]
    shown = body.split('\n## notes')[0]
    for ch, name in (('—','em dash'),('–','en dash'),('!','exclamation mark')):
        n = (meta.get('title','') + meta.get('description','') + shown).count(ch)
        if n: bad(f, f'{n} x {name}')
    low = shown.lower()
    if re.search(r'\btools?\b', low): bad(f, 'says "tool"')
    for w in BANNED:
        if w in low: bad(f, f'banned word: {w.strip()}')
    for w in CHECK:
        for line in shown.split('\n'):
            if w in line.lower() and re.search(r'ideal icp|\bthis\b|\bour\b|\bmy\b', line.lower()): print(f'  check {f.name}: "{w.strip()}" in: {line.strip()[:90]}')
    for kind in re.findall(r'^## +(\S+)', body, re.M):
        if kind not in KINDS: bad(f, f'unknown section kind: {kind}')
    if len(re.findall(r'^# ', shown, re.M)) != 1: bad(f, 'needs exactly one # headline')
    for href in re.findall(r'->\s*([^\]\s]+)\]', shown):
        p = href.split('#')[0]
        if p.startswith('/') and p not in paths and p not in LIVE: bad(f, f'link to a page that does not exist: {href}')
    if meta.get('status') == 'sample' and 'Sample' not in shown: bad(f, 'sample page without a visible Sample label')
    if re.search(r'<[a-z]+[ >]', shown): bad(f, 'contains HTML')
print(f'{len(files)} files, {problems} problems')
sys.exit(1 if problems else 0)

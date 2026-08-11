#!/usr/bin/env python3
"""Compare the current visual-regression run against the baseline."""
import json, sys, os
from PIL import Image, ImageChops
ROOT = os.environ.get('VRT_ROOT') or (os.environ.get('TMPDIR') or '/tmp') + '/mood-vrt'

def load(mode):
    p = f'{ROOT}/{mode}/report.json'
    return json.load(open(p)) if os.path.exists(p) else {}

base, cur = load('base'), load('cur')
if not base or not cur:
    sys.exit('need both a base and a cur run')

rows = []
for key in sorted(set(base) | set(cur)):
    vp, route = key.split(' ', 1)
    slug = 'home' if route == '/' else route.lstrip('/').replace('/', '-')
    b, c = base.get(key, {}), cur.get(key, {})
    pct = None
    bp, cp = f'{ROOT}/base/{vp}/{slug}.png', f'{ROOT}/cur/{vp}/{slug}.png'
    if os.path.exists(bp) and os.path.exists(cp):
        ib, ic = Image.open(bp).convert('RGB'), Image.open(cp).convert('RGB')
        if ib.size != ic.size:
            pct = -1.0                                   # size changed: always report
        else:
            diff = ImageChops.difference(ib, ic).convert('L')
            changed = sum(n for v, n in enumerate(diff.histogram()) if v > 12)
            pct = 100.0 * changed / (ib.size[0] * ib.size[1])
    dh = (c.get('docH', 0) or 0) - (b.get('docH', 0) or 0)
    flags = []
    if c.get('error'): flags.append('ERROR ' + c['error'][:50])
    if c.get('js'): flags.append(f"js×{c['js']}")
    if c.get('broken'): flags.append(f"broken×{c['broken']}")
    if c.get('overflow'): flags.append('overflow')
    if (c.get('tapSmall', 0) or 0) > (b.get('tapSmall', 0) or 0): flags.append(
        f"tap {b.get('tapSmall')}→{c.get('tapSmall')}")
    rows.append((key, pct, dh, flags))

moved = [r for r in rows if (r[1] is None or r[1] < 0 or r[1] > 0.05 or r[2] or r[3])]
print(f'{len(rows)} captures compared, {len(moved)} changed\n')
for key, pct, dh, flags in moved:
    p = 'size changed' if pct == -1 else ('missing' if pct is None else f'{pct:6.2f}% px')
    print(f'  {key:34} {p:>14}  height {dh:+6}  {" ".join(flags)}')
if not moved:
    print('  nothing moved')

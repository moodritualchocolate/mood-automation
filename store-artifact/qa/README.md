# Visual regression net

74 captures: every one of the 37 routes at 390px and 1440px, full page.
Each capture also records document height, broken images, horizontal
overflow, JS errors, and how many tap targets fall under 44px.

```bash
VRT_ROOT=/tmp/mood-vrt MODE=base node vrt.js     # snapshot the current build
# ... make a change, rebuild, copy into deploy/ ...
VRT_ROOT=/tmp/mood-vrt MODE=cur  node vrt.js     # snapshot the new build
VRT_ROOT=/tmp/mood-vrt python3 vrtdiff.py        # what moved, and by how much
```

`VRT_FILE` overrides the page under test. `ONLY=/energy,/club` limits a run to
named routes; runs merge into the existing report rather than replacing it.

A full run takes roughly ten minutes. Do not rebuild the file under test while
a run is in progress — the capture reads it live and the result will be half
one build and half the other.

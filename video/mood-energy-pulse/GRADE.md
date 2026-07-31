# Color grade (applied post-render to deepen the 3D chocolate to dark 70%)
ffmpeg -i renders/mood-energy-pulse-raw.mp4 -vf \
 "eq=contrast=1.1:saturation=1.06, curves=r='0/0.01 0.5/0.35 0.82/0.78 1/0.95':g='0/0.01 0.5/0.29 0.82/0.7 1/0.89':b='0/0 0.5/0.23 0.82/0.6 1/0.8'" \
 -c:a copy renders/mood-energy-pulse.mp4

cd /tmp/claude-0/-home-user-mood-automation/c8b146d5-7269-5f24-a785-402f620707cd/scratchpad/mood-lp
node render_frames.mjs "$1" 360 > frames_"$1".log 2>&1
DUR_FRAMES=$(ls frames_"$1"/*.jpg | wc -l)
ffmpeg -y -framerate 30 -i frames_"$1"/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -movflags +faststart vid_"$1"_silent.mp4 2>/dev/null
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 vid_"$1"_silent.mp4); FO=$(python3 -c "print(max(0,float('$DUR')-1.8))")
ffmpeg -y -i vid_"$1"_silent.mp4 -stream_loop -1 -i sku/calm_"$1".wav -shortest -c:v copy -c:a aac -b:a 160k -af "afade=t=in:st=0:d=1.4,afade=t=out:st=${FO}:d=1.8,volume=0.9" sku_"$1"_film.mp4 2>/dev/null
echo "FILM_DONE $1 frames=$DUR_FRAMES dur=$DUR"

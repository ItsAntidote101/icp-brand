import subprocess, os, sys
from playwright.sync_api import sync_playwright
FPS=30
SCENES=[(0,5.5),(5.5,10.5),(10.5,16.1),(16.1,21.3),(21.3,27.0)]
only=[int(x) for x in sys.argv[1:]]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900})
    pg.goto('file:///home/claude/video/explainer.html'); pg.wait_for_function('window.ready===true')
    for n,(a,z) in enumerate(SCENES):
        if only and n not in only: continue
        tmp=f'scene{n}.part.mp4'; out=f'scene{n}.mp4'
        ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-',
            '-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-r',str(FPS),tmp],stdin=subprocess.PIPE)
        f0=round(a*FPS); f1=round(z*FPS)
        for f in range(f0,f1):
            pg.evaluate(f'window.seek({f/FPS})')
            ff.stdin.write(pg.screenshot(type='jpeg',quality=92))
        ff.stdin.close(); rc=ff.wait()
        if rc==0: os.replace(tmp,out); print(out,f1-f0,'frames')
        else: print('FAILED',n); sys.exit(1)
    b.close()

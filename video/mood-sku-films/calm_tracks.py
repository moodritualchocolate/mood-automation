# Synthesise calm warm ambient soundtracks per mood (16s, loopable).
# Usage: python3 calm_tracks.py  -> calm_energy.wav / calm_relax.wav / calm_sleep.wav
import numpy as np, wave
sr=44100
def synth(dur, root=174.61, bright=1.0, slow=1.0):
    n=int(sr*dur); t=np.linspace(0,dur,n,endpoint=False); out=np.zeros(n)
    prog=[[1,5/4,3/2,15/8],[5/6,1,5/4,3/2],[2/3,5/6,1,5/4],[3/4,1,9/8,3/2]]
    barsec=4.0*slow
    for i,ch in enumerate(prog*3):
        st=i*barsec
        if st>=dur: break
        seg=(t>=st)&(t<st+barsec); tt=t[seg]-st
        env=np.sin(np.pi*np.clip(tt/barsec,0,1))**1.3
        for j,r in enumerate(ch):
            f=root*r; v=(0.5**j)
            out[seg]+=(np.sin(2*np.pi*f*tt)+0.25*np.sin(2*np.pi*2*f*tt)*bright)*env*0.08*v
    out+=0.10*np.sin(2*np.pi*(root/2)*t)*np.clip(np.sin(np.pi*t/dur*2)*0.5+0.6,0,1)
    sh=sum(np.sin(2*np.pi*f*t+np.sin(2*np.pi*0.07*t)) for f in [root*3,root*4,root*5])
    out+=0.012*bright*sh*(0.5+0.5*np.sin(2*np.pi*0.05*t))
    out*=(0.9+0.1*np.sin(2*np.pi*0.15*t)); out/=np.max(np.abs(out))+1e-6; out*=0.72
    return np.stack([out,np.roll(out,int(sr*0.012))],1)
def write(p,st):
    a=(np.clip(st,-1,1)*32767).astype(np.int16)
    w=wave.open(p,'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes()); w.close()
if __name__=="__main__":
    write("calm_energy.wav",synth(16,196.00,1.15,1.0))
    write("calm_relax.wav", synth(16,174.61,0.9,1.15))
    write("calm_sleep.wav", synth(16,130.81,0.7,1.35))

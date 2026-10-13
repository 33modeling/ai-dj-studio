"""Compose six original electronic practice tracks; no external recordings/samples."""
from pathlib import Path
import json
import subprocess
import wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1];RATE=44100;BARS=64
TRACKS=[('midnight-transit','Midnight Transit',120,'House','Cm',.65,11),
        ('neon-steps','Neon Steps',128,'Tech House','Cm',.82,29),
        ('amber-lofi','Amber Lo-fi',96,'Lo-fi','Am',.32,47),
        ('ocean-drive','Ocean Drive',110,'Downtempo','Am',.48,71),
        ('pulse-circuit','Pulse Circuit',134,'Techno','Gm',.94,89),
        ('afterglow-breaks','Afterglow Breaks',142,'Breakbeat','Gm',.88,107)]


def compose(bpm,genre,key,seed):
    rng=np.random.default_rng(seed);beat=60/bpm;length=int(BARS*4*beat*RATE);audio=np.zeros((length,2),dtype=np.float32)
    def add(at,sound,gain=1,pan=.5):
        start=round(at*RATE)
        if start>=length:return
        end=min(length,start+len(sound));sound=sound[:end-start]*gain
        audio[start:end,0]+=sound*np.cos(pan*np.pi/2);audio[start:end,1]+=sound*np.sin(pan*np.pi/2)
    def tone(midi,duration,gain=.2,kind='bass'):
        t=np.arange(round(duration*RATE))/RATE;frequency=440*2**((midi-69)/12)
        if kind=='pad':
            signal=np.sin(2*np.pi*frequency*t)+.3*np.sin(2*np.pi*frequency*1.004*t)+.2*np.sin(4*np.pi*frequency*t)
            envelope=np.minimum(1,t/.08)*np.minimum(1,(duration-t)/.18)
        else:
            signal=np.sin(2*np.pi*frequency*t)+.22*np.sin(4*np.pi*frequency*t)+.1*np.sin(6*np.pi*frequency*t)
            envelope=(1-np.exp(-t*500))*np.exp(-t/(duration*.45))*np.minimum(1,(duration-t)/.015)
        return signal*envelope*gain
    t=np.arange(int(RATE*.26))/RATE;kick=np.sin(2*np.pi*(48*t+90*.035*(1-np.exp(-t/.035))))*np.exp(-t*20)
    t=np.arange(int(RATE*.16))/RATE;noise=rng.normal(0,1,len(t));snare=(noise*.28+np.sin(2*np.pi*185*t)*.3)*np.exp(-t*30)*(1-np.exp(-t*1200))
    t=np.arange(int(RATE*.07))/RATE;noise=rng.normal(0,1,len(t));hat=(noise-np.roll(noise,1))*.12*np.exp(-t*80)
    root={'Cm':48,'Am':45,'Gm':43}[key];progression=[0,-2,-4,-5];scale=[0,3,5,7,10,12,15,17]
    melody=[scale[i] for i in rng.integers(0,len(scale),16)]
    for bar in range(BARS):
        start=bar*4*beat;full=8<=bar<56;section_root=root+progression[(bar//4)%4]
        for n in range(4):
            kick_gain=.85 if genre not in ('Lo-fi','Downtempo') else .65
            if genre=='Breakbeat' and n in (1,3):add(start+(n+.5)*beat,kick,kick_gain)
            else:add(start+n*beat,kick,kick_gain)
            if n in (1,3):add(start+n*beat,snare,.8 if full else .35)
            for off in (.5,) if not full else (.25,.5,.75):add(start+(n+off)*beat,hat,.5 if off!=.5 else .9,.35+(n%2)*.3)
        if bar>=4 and bar<60:
            for n in range(8):
                note=section_root-12+(7 if n in (3,7) else 0);add(start+(n*.5+.03)*beat,tone(note,beat*.45,.25),1,.5)
        if full:
            for note in (section_root,section_root+3,section_root+7):add(start,tone(note,beat*3.9,.045,'pad'),1,.25+((note%3)/3)*.5)
            for n in range(8):
                if (bar+n)%3!=0:
                    note=root+24+melody[(bar*3+n)%16];add(start+(n*.5+.02)*beat,tone(note,beat*.32,.06),1,.3+(n%4)*.13)
        if bar%8==7 and full:
            for n in range(4):add(start+(3+n/4)*beat,snare,.15+n*.055,.5)
    audio=np.tanh(audio*1.25)*.82
    fade=np.linspace(0,1,min(round(RATE*.018),length));audio[:len(fade)]*=fade[:,None];audio[-len(fade):]*=fade[::-1,None]
    return audio


def main():
    out=ROOT/'audio';out.mkdir(exist_ok=True);work=ROOT/'.audio-work';work.mkdir(exist_ok=True);tracks=[]
    for slug,title,bpm,genre,key,energy,seed in TRACKS:
        samples=compose(bpm,genre,key,seed);file=work/(slug+'.wav')
        with wave.open(str(file),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((samples*32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(file),'-c:a','libmp3lame','-b:a','128k','-metadata','title='+title,'-metadata','artist=33modeling Original','-metadata','copyright=CC0 1.0',str(out/(slug+'.mp3'))],check=True)
        mono=samples.mean(axis=1);bins=np.array_split(np.abs(mono),160);waveform=[round(float(np.max(b)),4) for b in bins]
        tracks.append(dict(id=slug,title=title,artist='33modeling Original',bpm=bpm,genre=genre,key=key,energy=energy,
                           duration=round(len(samples)/RATE,3),url='./audio/'+slug+'.mp3',builtin=True,
                           license='CC0 1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',wave=waveform))
        file.unlink();print(title,bpm,genre,flush=True)
    (out/'catalog.json').write_text(json.dumps(tracks,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':main()

export const clamp=(n,low,high)=>Math.max(low,Math.min(high,Number.isFinite(Number(n))?Number(n):low));
export function crossfade(value){const x=clamp(value,0,1);return [Math.cos(x*Math.PI/2),Math.sin(x*Math.PI/2)];}
export function tempoRate(target,source){return clamp(target/source,.75,1.25);}
export function waveform(samples,bins=200){const step=Math.max(1,Math.ceil(samples.length/bins)),result=[];for(let i=0;i<bins;i++){let max=0;for(let j=i*step;j<Math.min((i+1)*step,samples.length);j++)max=Math.max(max,Math.abs(samples[j]));result.push(max);}return result;}
export function analyze(samples,sampleRate){
 const hop=Math.round(sampleRate*.01),energy=[];let sum=0,peak=0;
 for(let i=0;i<samples.length;i++){const s=samples[i];sum+=s*s;peak=Math.max(peak,Math.abs(s));}
 for(let i=0;i<Math.min(samples.length,sampleRate*90);i+=hop){let e=0;for(let j=i;j<Math.min(i+hop,samples.length);j++)e+=samples[j]*samples[j];energy.push(Math.sqrt(e/hop));}
 const onsets=energy.map((e,i)=>Math.max(0,e-(energy[i-1]||0))),scores=[];
 for(let bpm=75;bpm<=160;bpm++){const lag=Math.round(60/bpm/.01);let score=0;for(let i=lag;i<onsets.length;i++)score+=onsets[i]*onsets[i-lag];scores.push({bpm,score});}
 scores.sort((a,b)=>b.score-a.score);const best=scores[0],average=scores.reduce((s,c)=>s+c.score,0)/scores.length;
 return {bpm:best.score>0?best.bpm:120,confidence:best.score>0?clamp((best.score/Math.max(average,1e-8)-1)/3,0,1):0,
         energy:clamp(Math.sqrt(sum/Math.max(1,samples.length))*4,0,1),peak,wave:waveform(samples)};
}
export function recommend(tracks,mood='build'){
 const available=tracks.filter(t=>Number.isFinite(t.bpm)&&t.bpm>0),rows=[];if(!available.length)return [];
 let remaining=[...available],current=remaining.splice(remaining.findIndex(t=>t.energy===Math.min(...remaining.map(x=>x.energy))),1)[0];rows.push(current);
 while(remaining.length){const score=t=>Math.abs(t.bpm-current.bpm)/45+Math.abs(t.energy-current.energy)*.6+(mood==='build'&&t.energy<current.energy?.3:0)+(t.key&&current.key&&t.key===current.key?-.12:0);
  remaining.sort((a,b)=>score(a)-score(b));current=remaining.shift();rows.push(current);}
 return mood==='chill'?rows.reverse():rows;
}
export function validatePlan(plan,tracks){
 const ids=new Set(tracks.map(t=>t.id));if(!plan||!Array.isArray(plan.order)||!plan.order.length||plan.order.some(id=>!ids.has(id))||new Set(plan.order).size!==plan.order.length)throw Error('AI가 현재 라이브러리에 없는 곡 또는 중복된 곡을 제안했습니다.');
 return {order:plan.order,transitionBars:Math.round(clamp(plan.transitionBars||8,2,32)),notes:Array.isArray(plan.notes)?plan.notes.map(String).slice(0,20):[]};
}
export function wav(buffer){
 const channels=buffer.numberOfChannels,length=buffer.length,bytes=length*channels*2,view=new DataView(new ArrayBuffer(44+bytes));
 const text=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};text(0,'RIFF');view.setUint32(4,36+bytes,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,bytes,true);
 const samples=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));for(let i=0,at=44;i<length;i++)for(let c=0;c<channels;c++,at+=2){const n=clamp(samples[c][i],-1,1);view.setInt16(at,n<0?n*32768:n*32767,true);}return new Blob([view],{type:'audio/wav'});
}
export function mixSchedule(tracks,{seconds=32,bars=8,targetBpm=120}={}){
 let cursor=0;return tracks.map((t,i)=>{const rate=tempoRate(targetBpm,t.bpm),duration=Math.min(seconds,t.duration/rate),next=tracks[i+1],fade=next?Math.min(bars*4*60/targetBpm,duration/2,next.duration/tempoRate(targetBpm,next.bpm)/2,seconds/2):0,
 result={id:t.id,start:cursor,duration,rate,fadeIn:i?Math.min(bars*4*60/targetBpm,duration/2,tracks[i-1].duration/tempoRate(targetBpm,tracks[i-1].bpm)/2,seconds/2):0,fadeOut:fade};cursor+=duration-fade;return result;});
}

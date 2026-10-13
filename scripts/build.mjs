import {mkdir,copyFile,cp,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('dist/',root);
await mkdir(out,{recursive:true});
for(const file of ['index.html','styles.css','LICENSE-AUDIO.md'])await copyFile(new URL(file,root),new URL(file,out));
for(const dir of ['src','assets','audio'])await cp(new URL(dir,root),new URL(dir,out),{recursive:true});
await writeFile(new URL('build.json',out),JSON.stringify({profile:process.env.GAME_PROFILE||'pages',application:'ai-dj',version:1}));
console.log('AI DJ: complete static build, original free music and mixer assets ready.');

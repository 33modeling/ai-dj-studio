let dbPromise;
function db(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('33-ai-dj-library',1);r.onupgradeneeded=()=>r.result.createObjectStore('tracks',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('브라우저 음원 보관함을 열 수 없습니다.'));});}
async function request(mode,work){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('tracks',mode),r=work(tx.objectStore('tracks'));let value;r.onsuccess=()=>value=r.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(Error('브라우저 저장 공간을 확인하세요. 파일은 현재 세션에서 계속 사용할 수 있습니다.'));tx.onabort=()=>reject(Error('음원 저장을 완료하지 못했습니다.'));});}
export const storedTracks=()=>request('readonly',s=>s.getAll());
export const storeTrack=t=>request('readwrite',s=>s.put(t));
export const deleteTrack=id=>request('readwrite',s=>s.delete(id));

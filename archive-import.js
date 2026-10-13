'use strict';
/* Public, self-contained ZIP_STORED private archive importer. This file has no private data. */
(function(){
 const $=id=>document.getElementById(id);
 const encoder=new TextDecoder();
 const msg=(text)=>{const out=$('unifiedImportResult');if(out)out.textContent=text;};
 const yieldUI=()=>new Promise(resolve=>setTimeout(resolve,0));
 const MAX_ZIP=120*1024*1024;
 const MAX_MANIFEST=2*1024*1024;
 const MAX_FILES=550;
 const MAX_FILE=22*1024*1024;
 const hex=buffer=>Array.from(new Uint8Array(buffer),v=>v.toString(16).padStart(2,'0')).join('');
 function unpackZip(fileBytes){
  const a=new Uint8Array(fileBytes),v=new DataView(fileBytes),length=a.byteLength;
  // Find End of Central Directory; ZIP64 and encrypted entries are intentionally unsupported.
  let eocd=-1;
  for(let i=length-22;i>=Math.max(0,length-65557);i--){if(v.getUint32(i,true)===0x06054b50){eocd=i;break}}
  if(eocd<0)throw Error('ملف ZIP غير مكتمل');
  if(v.getUint16(eocd+4,true)||v.getUint16(eocd+6,true))throw Error('الملف مقسّم إلى أجزاء');
  const n=v.getUint16(eocd+10,true),directorySize=v.getUint32(eocd+12,true),directoryOffset=v.getUint32(eocd+16,true);
  if(n<2||n>MAX_FILES||directoryOffset+directorySize>eocd)throw Error('فهرس ZIP غير صحيح');
  const files=new Map();let p=directoryOffset;
  for(let j=0;j<n;j++){
   if(p+46>length||v.getUint32(p,true)!==0x02014b50)throw Error('فهرس ZIP تالف');
   const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),packed=v.getUint32(p+20,true),unpacked=v.getUint32(p+24,true);
   const nameLen=v.getUint16(p+28,true),extraLen=v.getUint16(p+30,true),commentLen=v.getUint16(p+32,true),offset=v.getUint32(p+42,true);
   if(flags&1||method!==0||packed!==unpacked||unpacked>MAX_FILE&&j!==0)throw Error('يجب استخدام ملف ZIP الخاص غير المضغوط بصيغته الأصلية');
   if(p+46+nameLen+extraLen+commentLen>length)throw Error('اسم ملف ZIP خارج الحدود');
   const name=encoder.decode(a.subarray(p+46,p+46+nameLen));
   if(!name||name.includes('..')||name.startsWith('/')||name.includes('\\')||files.has(name))throw Error('اسم ملف غير آمن أو مكرر');
   if(offset+30>length||v.getUint32(offset,true)!==0x04034b50)throw Error('ملف في الأرشيف تالف');
   const dataStart=offset+30+v.getUint16(offset+26,true)+v.getUint16(offset+28,true);
   if(dataStart+unpacked>length)throw Error('حجم الملف غير صحيح');
   files.set(name,{bytes:a.subarray(dataStart,dataStart+unpacked),size:unpacked});
   p+=46+nameLen+extraLen+commentLen;
  }
  if(!files.has('manifest.json')||files.get('manifest.json').size>MAX_MANIFEST)throw Error('ملف الفهرس غير موجود');
  return files;
 }
 function checkManifest(m,entries){
  if(m.kind!=='europe26-complete-private-import'||m.version!==4)throw Error('إصدار الأرشيف غير متوافق');
  if(!Array.isArray(m.entries)||m.entries.length<2||m.entries.length>MAX_FILES)throw Error('قائمة المستندات غير صحيحة');
  validatePack(m.plan);
  const ids=new Set(),paths=new Set();let total=0;
  const categories=new Set(['verified-file','receipt-only','hotel-reply','historical-pdf','unverified-screenshot','rail-evidence','hotel-evidence','offline-reference']);
  for(const item of m.entries){
   if(typeof item.id!=='string'||!/^[-a-zA-Z0-9_]{3,100}$/.test(item.id)||ids.has(item.id)||!/^payload\/[a-zA-Z0-9_.-]+$/.test(item.path)||paths.has(item.path)||!categories.has(item.category)||!Number.isSafeInteger(item.size)||item.size<1||item.size>MAX_FILE||!(/^[a-f0-9]{64}$/i).test(item.sha256))throw Error('بيانات مستند غير صحيحة');
   const f=entries.get(item.path);
   if(!f||f.size!==item.size)throw Error('ملف مستند ناقص أو غير مطابق: '+item.id);
   ids.add(item.id);paths.add(item.path);total+=item.size;
  }
  if(total>MAX_ZIP)throw Error('الأرشيف أكبر من الحد المسموح');
  if(entries.size!==m.entries.length+2||!entries.has('PRIVATE_README.txt'))throw Error('عدد الملفات في ZIP لا يتطابق مع الفهرس');
  return {total,ids};
 }
 async function importArchive(file){
  const btn=$('unifiedImportBtn');if(btn?.disabled)return;
  if(!vaultKey){switchTab('documents');notify('أنشئ الخزنة أو افتحها بكلمة مرور أولاً');msg('افتح الخزنة أولاً ثم أعد اختيار الأرشيف.');return}
  if(!file||file.size>MAX_ZIP)throw Error('حجم الملف كبير أو الملف غير موجود');
  btn.disabled=true;
  const input=$('unifiedPackImport'),progress=$('unifiedProgress');
  if(progress){progress.value=0;progress.max=100;progress.classList.remove('hide')}
  try{
   msg('قراءة الحزمة الخاصة ...');await yieldUI();
   const content=await file.arrayBuffer(),entries=unpackZip(content);
   const manifest=JSON.parse(encoder.decode(entries.get('manifest.json').bytes));
   checkManifest(manifest,entries);
   // Changes to existing plan/vault require a user-controlled downloaded backup first.
   const oldEntries=await allEntries(),oldIds=new Set(oldEntries.filter(x=>x.id!=='__meta').map(x=>x.id));
   const hasOld=Boolean(plan?.steps?.length)||oldIds.size>0||Boolean(localStorage.getItem(OLD_KEY));
   if(hasOld&&!backupThisSession){msg('لديك بيانات سابقة. نزّل نسخة احتياطية من الإعدادات قبل الاستيراد، ثم أعد اختيار الحزمة.');switchTab('settings');return}
   const overwrite=manifest.entries.filter(x=>oldIds.has(x.id)).length;
   if(!confirm(`حزمة خاصة: ${manifest.plan.steps.length} خطوة و${manifest.entries.length} ملفًا/صورة. ستبقى الملفات السابقة دون استبدال (${overwrite} مطابقًا بالمعرّف). هل تأكدت من حفظ نسخة احتياطية إن كانت لديك بيانات قديمة، وتريد البدء؟`))return;
   // Complete cryptographic integrity preflight before writing any document.
   let j=0;
   for(const item of manifest.entries){
    const digest=hex(await crypto.subtle.digest('SHA-256',entries.get(item.path).bytes));
    if(digest.toLowerCase()!==item.sha256.toLowerCase())throw Error('فشل فحص سلامة: '+item.id);
    j++;
    if(j%10===0){msg(`فحص السلامة: ${j} / ${manifest.entries.length}`);progress.value=Math.round(35*j/manifest.entries.length);await yieldUI()}
   }
   // Sequential encryption to keep memory bounded. Existing entries remain untouched.
   let added=0,skipped=0;
   j=0;
   for(const item of manifest.entries){
    if(oldIds.has(item.id)){skipped++}else{
     const source=entries.get(item.path).bytes;
     const sealed=await seal(source,vaultKey);
     await putEntry({id:item.id,name:item.name,label:item.label||item.id,type:item.mime||'application/octet-stream',category:item.category,source:item.source||'',hash:item.sha256,savedAt:new Date().toISOString(),...sealed});
     added++;
    }
    j++;
    if(j%5===0){msg(`تشفير المستندات: ${j} / ${manifest.entries.length}`);progress.value=35+Math.round(63*j/manifest.entries.length);await yieldUI()}
   }
   // Set private itinerary after documents commit; retain completed steps/status.
   localStorage.setItem(PLAN_KEY,JSON.stringify(manifest.plan));
   plan=manifest.plan;selectedDay='';progress.value=100;
   state.lastArchiveImport={at:new Date().toISOString(),count:added,archiveVersion:manifest.version,expected:manifest.entries.length};
   save();
   msg(`✓ استيراد ${added} ملفًا مشفرًا وتجاوز ${skipped} ملفًا موجودًا. تمت إضافة ${plan.steps.length} خطوة. احتفظ بنسخة احتياطية مشفرة الآن.`);
   notify('اكتمل استيراد الأرشيف الخاص. صدّر نسخة احتياطية ثم احذف الأرشيف غير المشفر من التنزيلات.');
   drawVaultList();
   if($('archiveSummary'))$('archiveSummary').textContent=`آخر استيراد: ${added} ملف جديد، ${skipped} موجود — ${plan.steps.length} خطوة.`;
  }finally{btn.disabled=false;input.value=''}
 }
 function initArchiveUI(){
  const input=$('unifiedPackImport');if(!input)return;
  $('unifiedImportBtn').onclick=()=>input.click();
  input.onchange=async ()=>{const f=input.files?.[0];if(!f)return;try{await importArchive(f)}catch(err){console.error('Import error',err);msg('تعذر الاستيراد: '+err.message);notify('لم يكتمل استيراد الأرشيف. المستندات التي حُفظت بأمان لن تُمسح.') }};
  if(state.lastArchiveImport&&$('archiveSummary'))$('archiveSummary').textContent=`آخر استيراد: ${state.lastArchiveImport.count} ملف جديد — ${state.lastArchiveImport.expected} في الأرشيف.`;
 }
 initArchiveUI();
})();

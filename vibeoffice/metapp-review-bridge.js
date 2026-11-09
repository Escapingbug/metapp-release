/* VibeOffice review adapter: independent workbooks, no save/export/recovery channel. */
(function(){
 'use strict';
 const L=window.L,A=L.app,G=L.grid,protocol='metapp.office.review.v1';
 const module=import('./metapp-review.js');
 const send=(type,fields={})=>parent.postMessage({protocol,type,...fields},location.origin);
 let initialized=false,epoch=0,before,after,review,version='before',identity,applying=false;
 A.sampleWorkbook=()=>A.blankWorkbook();
 A.save=A.saveAs=A.openDialog=A.openFile=A.closeWorkbook=A.followLink=async()=>false;
 A.saveOpts=()=>{};L.store.set=()=>{};
 G.guardProtect=()=>true;
 L.editor.begin=()=>false;L.editor.commit=()=>false;
 const tx=L.ops.tx;L.ops.tx=(...args)=>applying?tx(...args):undefined;
 const exec=L.ui.exec;L.ui.exec=(id,...args)=>id==='copy'?exec(id,...args):undefined;
 for(const type of ['beforeinput','paste','cut','drop','dblclick','contextmenu'])document.addEventListener(type,event=>{event.preventDefault();event.stopImmediatePropagation();},true);
 document.addEventListener('keydown',event=>{
  const nav=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Tab','Escape'];
  if(!nav.includes(event.key)&&!((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c')){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 document.addEventListener('click',event=>{if(event.target.closest('a')){event.preventDefault();event.stopImmediatePropagation();}},true);
 const prepare=w=>{for(const s of w.sheets){s.protection={attrs:{}};for(const row of s.rows)if(row)for(const c of row.cells)if(c?.f!=null)c.dirty=false;}L.calc.rebuild(w);};
 function show(which,location){
  const w=which==='after'?after:before;if(!w)throw new Error('修改未能预计算，无法展示修改后版本');
  // Retain the current position when switching versions; never recalculate on display.
  const previous=G.wb&&G.sheet(),selection=previous&&G.sel(),viewport=previous?{scrollR:G.vs().scrollR,scrollC:G.vs().scrollC}:undefined;
  const target=location??(previous&&selection?{sheet:previous.name,cell:L.formula.cellName(selection.r,selection.c)}:undefined);
  A.books=[];A.cur=-1;A.addBook(w,identity.name,{type:'xlsx'});A.toggleTask(false);version=which;
  if(target&&w.sheetByName(target.sheet))A.goToRef(L.formula.quoteSheet(target.sheet)+'!'+target.cell);
  if(!location&&viewport&&target&&G.sheet().name===target.sheet)Object.assign(G.vs(),viewport);
  G.paint(true);send('viewed',{...identity,version});
 }
 L.bus.on('selection',()=>{if(!identity||!before)return;const s=G.sheet(),p=G.sel();send('selection',{...identity,version,sheet:s.name,cell:L.formula.cellName(p.r,p.c)});});
 // Review marks are painted over the normal grid without changing workbook styles.
 L.bus.on('grid-paint',frame=>{
  if(!frame||!review||!identity||!G.wb)return;
  const canvas=document.querySelector('canvas.gcv'),ctx=canvas?.getContext('2d');if(!ctx)return;
  const sheet=G.sheet();ctx.save();ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);
  for(const change of review.changes){
   if(change.sheet!==sheet.name||change.unchanged)continue;
   const p=L.formula.parseCell(change.cell),rect=G.cellRect(p.r,p.c),pane=rect.pane;
   if(!pane||p.r<pane.r0||p.r>pane.rEnd||p.c<pane.c0||p.c>pane.cEnd)continue;
   ctx.save();ctx.beginPath();ctx.rect(pane.x,pane.y,pane.w,pane.h);ctx.clip();
   ctx.fillStyle=change.requested===false?'rgba(201,144,31,.12)':'rgba(35,139,98,.12)';
   ctx.strokeStyle=change.requested===false?'#bb861f':'#288c66';ctx.lineWidth=1.5;ctx.setLineDash(change.requested===false?[4,2]:[]);
   ctx.fillRect(rect.x+1,rect.y+1,rect.w-2,rect.h-2);ctx.strokeRect(rect.x+1,rect.y+1,rect.w-2,rect.h-2);
   // A corner badge makes the mark recognizable independently of its colour.
   ctx.setLineDash([]);ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();
   const x=rect.x+rect.w-5,y=rect.y+5;
   if(change.after.value===null&&!change.after.formula){ctx.moveTo(x-2,y-2);ctx.lineTo(x+2,y+2);ctx.moveTo(x+2,y-2);ctx.lineTo(x-2,y+2);ctx.stroke();}
   else if(change.requested===false){ctx.moveTo(x,y-3);ctx.lineTo(x+3,y);ctx.lineTo(x,y+3);ctx.lineTo(x-3,y);ctx.closePath();ctx.fill();}
   else{ctx.moveTo(x-3,y-3);ctx.lineTo(x+3,y-3);ctx.lineTo(x+3,y+3);ctx.closePath();ctx.fill();}
   ctx.restore();
  }
  ctx.restore();
 });
 window.addEventListener('message',async event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.protocol!==protocol)return;
  const m=event.data;
  try{
   if(m.type==='ready-request'){if(initialized)send('ready');return;}
   if(m.type==='review'){
    const opening=++epoch;before=after=review=identity=undefined;
    if(!m.documentId||!Number.isInteger(m.revision)||m.revision<1)throw new Error('预览缺少文件版本');
    const bytes=Uint8Array.from(atob(m.data),c=>c.charCodeAt(0));
    const original=await L.xlsxRead.read(bytes),proposed=await L.xlsxRead.read(bytes),{reviewWorkbook}=await module;if(opening!==epoch)return;
    applying=true;let result;try{result=reviewWorkbook(L,proposed,m.operations);}finally{applying=false;}
    prepare(original);if(!result.errors.length)prepare(proposed);
    before=original;after=result.errors.length?undefined:proposed;review=result;identity={requestId:m.requestId,documentId:m.documentId,revision:m.revision,name:m.name};
    show(after?'after':'before',result.changes.find(change=>!change.unchanged));
    send('reviewed',{...identity,version,review:result});
   }else if(m.type==='view'&&identity?.requestId===m.requestId)show(m.version,m.location);
   else if(m.type==='navigate'&&identity?.requestId===m.requestId){if(!G.wb.sheetByName(m.sheet))return;A.goToRef(L.formula.quoteSheet(m.sheet)+'!'+m.cell);G.paint(true);}
  }catch(error){send('error',{requestId:m.requestId,message:error.message});}
 });
 const start=()=>{initialized=true;for(const id of ['fbinput','namebox']){const input=document.getElementById(id);if(input)input.readOnly=true;}send('ready');};
 if(A.books.length)start();else L.bus.on('app-ready',start);
})();

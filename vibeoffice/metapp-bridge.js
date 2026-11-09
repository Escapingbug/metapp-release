/* Metapp host adapter. The vendored VibeOffice sources remain unchanged. */
(function(){
  'use strict';
  const L=window.L,A=L.app;let suppress=false,generation=0,epoch=0,saving,loadedBook,initialized=false;
  // The embedded editor starts empty; only the host supplies business content.
  if(A.blankWorkbook)A.sampleWorkbook=()=>A.blankWorkbook();
  const pending=new Map();
  const send=(type,fields={})=>parent.postMessage({protocol:'metapp.office.editor.v1',type,...fields},location.origin);
  const current=()=>A.books[A.cur];
  const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);};
  const decode=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
  // A committed workbook already contains the authoritative calculated values.
  // Upstream prepare() recalculates volatile formulas on open, so build only the graph.
  const prepareCommitted=w=>{for(const s of w.sheets)for(const row of s.rows)if(row)for(const cell of row.cells)if(cell?.f!=null)cell.dirty=false;L.calc.rebuild(w);};
  async function reconcile(p,m){
    const canonical=await L.xlsxRead.read(decode(m.data));
    if(current()!==p.book||epoch!==p.epoch)return;
    if(generation===p.generation){
      // Patch values in place: keep selection, active editing, sheet objects and undo history.
      const w=p.book.wb;
      if(w.sheets.length!==canonical.sheets.length||w.sheets.some((s,i)=>s.name!==canonical.sheets[i].name))throw new Error('表格结构已变化，请重新加载以完成同步');
      suppress=true;
      try{canonical.sheets.forEach((source,i)=>source.rows.forEach((row,r)=>row?.cells.forEach((cell,c)=>{if(!cell)return;const target=w.sheets[i].cell(r,c);target.v=cell.v;if(cell.f==null)delete target.f;else target.f=cell.f;target.kept=cell.kept;target.dirty=false;delete target.ast;delete target._fsrc;})));L.calc.rebuild(w);L.grid.paint(true);L.ui.refresh();if(!L.editor.active)L.editor.show();}finally{suppress=false;}
    }
    p.book.metappRevision=m.revision;p.book.dirty=generation!==p.generation;L.ui.refresh();
    send('synced',{id:m.id,dirty:p.book.dirty,revision:m.revision});
  }
  const submit=()=>{
    if(saving)return saving;
    saving=(async()=>{
      if(L.editor.active&&!L.editor.commit())return false;
      const b=current();if(!b||b!==loadedBook||!b.metappDocumentId)throw new Error('工作区文件尚未载入，不能保存占位内容');
      const savedGeneration=generation,savedEpoch=epoch,id=crypto.randomUUID(),data=base64(await L.xlsxWrite.bytes(b.wb));
      const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{reject(new Error('同步尚未确认，请检查原保存请求'));},90000);pending.set(id,{resolve,reject,timer,generation:savedGeneration,epoch:savedEpoch,book:b});});
      send('save',{id,data,name:b.name,documentId:b.metappDocumentId,revision:b.metappRevision});await result;return true;
    })().finally(()=>{saving=undefined;});return saving;
  };
  A.save=submit;A.saveAs=submit;
  A.openDialog=async()=>send('import-request');
  L.bus.on('changed',()=>{if(!suppress&&loadedBook&&current()===loadedBook){generation++;send('dirty',{dirty:true,documentId:loadedBook.metappDocumentId});}});
  window.addEventListener('message',async event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.protocol!=='metapp.office.editor.v1')return;
    const m=event.data;
    try{
      if(m.type==='open'){
        suppress=true;const opening=++epoch;loadedBook=undefined;for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('已打开其他版本'));}pending.clear();
        if(typeof m.documentId!=='string'||!m.documentId||!Number.isInteger(m.revision)||m.revision<1)throw new Error('缺少工作区文件身份');
        const w=await L.xlsxRead.read(decode(m.data));if(opening!==epoch)return;prepareCommitted(w);A.books=[];A.cur=-1;const b=A.addBook(w,m.name,{type:'xlsx'});b.metappRevision=m.revision;b.metappDocumentId=m.documentId;loadedBook=b;A.toggleTask(false);send('opened',{requestId:m.requestId,documentId:m.documentId,revision:m.revision});
      }else if(m.type==='ready-request'){
        if(initialized)send('ready');
      }else if(m.type==='navigate'){
        if(typeof m.sheet!=='string'||!/^[$]?[A-Z]{1,3}[$]?[1-9]\d{0,6}$/i.test(m.cell))throw new Error('单元格位置无效');
        if(!A.goToRef(L.formula.quoteSheet(m.sheet)+'!'+m.cell))throw new Error('无法定位到该单元格');
      }else if(m.type==='export-request'){
        if(L.editor.active&&!L.editor.commit())throw new Error('请先完成当前单元格编辑');
        const b=current(),exportEpoch=epoch;
        if(!b||b!==loadedBook||!b.metappDocumentId)throw new Error('工作区文件尚未载入');
        const data=base64(await L.xlsxWrite.bytes(b.wb));
        if(current()===b&&epoch===exportEpoch)send('draft-export',{documentId:b.metappDocumentId,revision:b.metappRevision,name:b.name,data});
      }else if(m.type==='save-request'){await submit();}
      else if(m.type==='save-result'){
        const p=pending.get(m.id);if(p){clearTimeout(p.timer);if(m.ok){await reconcile(p,m);pending.delete(m.id);p.resolve();}else{if(m.terminal)pending.delete(m.id);p.reject(new Error(m.error||'同步失败'));}}
      }else if(m.type==='inspect'){
        if(!loadedBook||current()!==loadedBook)throw new Error('工作区文件尚未载入');
        const w=loadedBook.wb,s=w.sheets[w.active];send('selection',{documentId:loadedBook.metappDocumentId,sheet:s.name,range:document.querySelector('#namebox')?.value??'A1'});
      }
    }catch(error){send('error',{message:error.message,requestId:m.requestId,documentId:m.documentId,operation:m.type});}
    finally{suppress=false;}
  });
  const start=()=>{initialized=true;send('ready');};
  if(A.books.length)start();else L.bus.on('app-ready',start);
})();

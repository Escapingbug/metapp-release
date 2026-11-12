/** Shared by the Gateway and the read-only browser preview. Never writes a file. */
export function applyOperations(L,workbook,operations) {
    if (!Array.isArray(operations) || operations.length < 1 || operations.length > 1000) throw new Error('一次修改需要 1–1000 个操作');
    // Prevalidate the whole batch before changing its private candidate workbook.
    const targets = operations.map(operation => {
      const sheet = workbook.sheetByName(operation.sheet);
      if (!sheet) throw new Error(`工作表不存在：${operation.sheet}`);
      if (!/^[A-Z]{1,3}[1-9]\d{0,6}$/i.test(operation.cell)) throw new Error('单元格地址无效');
      const position = L.formula.parseCell(operation.cell);
      if (!position || position.r >= 1048576 || position.c >= 16384) throw new Error('单元格地址超出范围');
      if (operation.type === 'cell.setFormula') {
        if (typeof operation.formula !== 'string' || !operation.formula.trim() || operation.formula.length > 8192) throw new Error('公式无效');
        const checked = L.ops.checkFormula(operation.formula.replace(/^=/, ''));
        if (checked.error) throw new Error(`公式无效：${checked.error}`);
      } else if (operation.type !== 'cell.setValue' || !(operation.value === null || ['string', 'number', 'boolean'].includes(typeof operation.value)) || (typeof operation.value === 'number' && !Number.isFinite(operation.value))) throw new Error('单元格操作无效');
      return { operation, sheet, position };
    });
    L.ops.tx(workbook, 'Metapp Office transaction', () => {
      for (const { operation, sheet, position } of targets) {
        if (operation.type === 'cell.setFormula') L.ops.setFormula(sheet, position.r, position.c, operation.formula.replace(/^=/, ''));
        else L.ops.setValue(sheet, position.r, position.c, operation.value);
      }
    });
    L.calc.rebuild(workbook);
    L.calc.recalcAll(workbook);
}

/** The caller supplies a private workbook parsed from the exact saved revision. */
export function reviewWorkbook(L,workbook,operations) {
  operations=operations.map(op=>({...op,sheet:workbook.sheetByName(op.sheet)?.name??op.sheet,cell:op.cell.toUpperCase()}));
  const scan=()=>{
    const cells=new Map();
    for(const sheet of workbook.sheets)sheet.rows.forEach((row,r)=>row?.cells.forEach((cell,c)=>{
      if(!cell)return;
      const value=cell.v==null?null:typeof cell.v==='object'?String(cell.v):cell.v;
      let display=value===null?'空白':String(value);
      try{if(value!==null)display=L.numfmt.text(L.layout.styleOf(sheet,r,c,cell).nf||'General',cell.v,{date1904:workbook.date1904});}catch{/* retain literal value */}
      const state={value,display,...(cell.f!=null?{formula:cell.f}:{})};
      cells.set(JSON.stringify([sheet.name,L.formula.cellName(r,c)]),{sheet:sheet.name,cell:L.formula.cellName(r,c),state,kept:!!cell.kept});
    }));
    return cells;
  };
  const before=scan(),targets=new Map(operations.map(op=>[JSON.stringify([op.sheet,op.cell.toUpperCase()]),op]));
  const errors=[],warnings=[];
  try{applyOperations(L,workbook,operations);}catch(error){errors.push(error.message);}
  const after=errors.length?before:scan(),blank={value:null,display:'空白'};
  const context=(sheet,cell)=>{
    const p=L.formula.parseCell(cell),column=L.formula.cellName(0,p.c),first=after.get(JSON.stringify([sheet,column]))?.state;
    const label=p.r>0&&typeof first?.value==='string'&&!first.formula?`首行：${first.value}`:'';
    const peers=[];
    // Explicitly labelled row context, rather than guessing who or what a row represents.
    for(let c=0;c<Math.min(p.c+3,6)&&peers.length<2;c++){
      if(c===p.c)continue;
      const address=L.formula.cellName(p.r,c),state=after.get(JSON.stringify([sheet,address]))?.state;
      if(typeof state?.value==='string'&&state.value&&!state.formula)peers.push(`${address} ${state.display}`);
    }
    return[label,peers.length?`同行：${peers.join(' · ')}`:''].filter(Boolean).join('；');
  };
  const equal=(a,b)=>a.value===b.value&&(a.formula??'')===(b.formula??'');
  const changes=[...targets].map(([key,op])=>{
    const a=before.get(key)?.state??{...blank,...(!workbook.sheetByName(op.sheet)?{unavailable:true}:{})};
    const b=errors.length?(op.type==='cell.setFormula'?{value:null,formula:op.formula.replace(/^=/,''),unavailable:true}:{value:op.value}):after.get(key)?.state??blank;
    return{sheet:op.sheet,cell:op.cell.toUpperCase(),before:a,after:b,requested:true,unchanged:!errors.length&&equal(a,b),context:context(op.sheet,op.cell)};
  });
  let impactCount=0,omittedImpacts=0;
  if(!errors.length)for(const key of new Set([...before.keys(),...after.keys()])){
    const cell=after.get(key)??{...before.get(key),state:blank};
    if(targets.has(key)||equal(before.get(key)?.state??blank,cell.state))continue;
    impactCount++;
    if(impactCount<=100)changes.push({sheet:cell.sheet,cell:cell.cell,before:before.get(key)?.state??blank,after:cell.state,requested:false,unchanged:false,context:context(cell.sheet,cell.cell)});
    else omittedImpacts++;
  }
  if([...after.values()].some(cell=>cell.kept))warnings.push('部分公式沿用工作簿中的缓存结果，预览不能确认这些公式的重新计算结果。');
  if([...after.values()].some(cell=>cell.state.formula&&/\b(?:RAND|RANDBETWEEN|NOW|TODAY|OFFSET|INDIRECT)\s*\(/i.test(cell.state.formula)))warnings.push('含有动态公式，生成候选时的计算值可能变化，请再次检查候选结果。');
  if([...after.values()].some(cell=>cell.state.formula&&typeof cell.state.value==='string'&&/^#(?:REF!|VALUE!|DIV\/0!|NAME\?|NUM!|N\/A|SPILL!|CALC!)/.test(cell.state.value)))warnings.push('工作簿中存在公式错误，请检查对比中的计算结果。');
  changes.sort((a,b)=>a.sheet.localeCompare(b.sheet)||L.formula.parseCell(a.cell).r-L.formula.parseCell(b.cell).r||L.formula.parseCell(a.cell).c-L.formula.parseCell(b.cell).c);
  return{changes,requestedCount:targets.size,unchangedCount:changes.filter(c=>c.requested&&c.unchanged).length,impactCount,omittedImpacts,formulaCount:[...targets.values()].filter(op=>op.type==='cell.setFormula').length,errors,warnings};
}

/** Compare two actual saved workbooks; never recreate a candidate from operations. */
export function compareWorkbooks(L,before,after){
 const scan=workbook=>{const result=new Map();for(const sheet of workbook.sheets)sheet.rows.forEach((row,r)=>row?.cells.forEach((cell,c)=>{if(cell)result.set(JSON.stringify([sheet.name,L.formula.cellName(r,c)]),{sheet:sheet.name,cell:L.formula.cellName(r,c),state:{value:cell.v??null,...(cell.f!=null?{formula:cell.f}:{})}});}));return result;};
 const a=scan(before),b=scan(after),blank={value:null},changes=[];
 for(const key of new Set([...a.keys(),...b.keys()])){const left=a.get(key),right=b.get(key),previous=left?.state??blank,next=right?.state??blank;if(JSON.stringify(previous)!==JSON.stringify(next))changes.push({sheet:(right??left).sheet,cell:(right??left).cell,before:previous,after:next,requested:true});}
 return{changes,errors:[],warnings:[]};
}

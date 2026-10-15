(function(){
  var MK='relax1000.mastered',WK='relax1000.wrong',NAVKEY='relax1000.navHidden';
  function load(k){try{var v=JSON.parse(localStorage.getItem(k)||'{}');return v&&typeof v==='object'?v:{};}catch(e){return {};}}
  var M=load(MK),W=load(WK);
  function save(){try{localStorage.setItem(MK,JSON.stringify(M));localStorage.setItem(WK,JSON.stringify(W));}catch(e){}}
  var root=document.documentElement,body=document.body;
  // ---- 目录显示/隐藏 ----
  var mq=window.matchMedia('(max-width:920px)'),navBtn=document.getElementById('navtoggle-btn');
  function syncAria(){if(!navBtn)return;var open=mq.matches?body.classList.contains('nav-open'):!root.classList.contains('nav-hidden');navBtn.setAttribute('aria-expanded',open?'true':'false');}
  if(navBtn)navBtn.addEventListener('click',function(){
    if(mq.matches)body.classList.toggle('nav-open');
    else{var h=root.classList.toggle('nav-hidden');try{localStorage.setItem(NAVKEY,h?'1':'0');}catch(e){}}
    syncAria();
  });
  var bd=document.querySelector('.backdrop');if(bd)bd.addEventListener('click',function(){body.classList.remove('nav-open');syncAria();});
  document.querySelectorAll('.sidebar a').forEach(function(a){a.addEventListener('click',function(){body.classList.remove('nav-open');});});
  window.addEventListener('resize',syncAria);syncAria();
  var cur=document.querySelector('.toc-ch.current');if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:'center'});

  // ---- 进度统计 ----
  function cnt(map,ch){var p=ch+'q',n=0;for(var k in map)if(map[k]&&k.indexOf(p)===0&&/^\d+$/.test(k.slice(p.length)))n++;return n;}
  function all(map){var n=0;for(var k in map)if(map[k])n++;return n;}
  function refresh(){
    document.querySelectorAll('[data-ch]').forEach(function(el){
      var ch=el.getAttribute('data-ch'),t=+el.getAttribute('data-total')||0,d=cnt(M,ch),w=cnt(W,ch);
      var p=el.querySelector('[data-prog]');if(p)p.textContent=d+'/'+t+(w?' · 错 '+w:'');
      var b=el.querySelector('[data-bar]');if(b)b.style.width=(t?Math.round(d*100/t):0)+'%';
      el.classList.toggle('ch-done',t>0&&d>=t);
    });
    var at=document.querySelector('[data-all-total]');
    if(at){var t=+at.getAttribute('data-all-total')||0,d=all(M);
      var p=document.querySelector('[data-all-prog]');if(p)p.textContent=d+'/'+t+' · 错题 '+all(W);
      var b=document.querySelector('[data-all-bar]');if(b)b.style.width=(t?(d*100/t).toFixed(1):0)+'%';}
    var st=document.getElementById('rx-stat');
    if(st){var qs=document.querySelectorAll('article.q'),m=0,w=0;qs.forEach(function(a){var id=a._qid;if(M[id])m++;if(W[id])w++;});st.textContent='本页 已掌握 '+m+'/'+qs.length+' · 错题 '+w;}
  }

  // ---- 本页工具栏 ----
  var qs=document.querySelectorAll('article.q');
  if(qs.length){
    var head=document.querySelector('.ch-head');
    var tb=document.createElement('div');tb.className='rx-toolbar';
    tb.innerHTML='<span class="rx-seg"><label><input type="radio" name="rx-flt" value="all" checked><span>全部</span></label><label><input type="radio" name="rx-flt" value="todo"><span>未掌握</span></label><label><input type="radio" name="rx-flt" value="wrong"><span>错题</span></label></span><button type="button" id="rx-expand">展开全部答案</button><button type="button" id="rx-redo">重做本页</button><span class="rx-stat" id="rx-stat"></span>';
    if(head&&head.parentNode)head.parentNode.insertBefore(tb,head.nextSibling);
    var empty=document.createElement('p');empty.className='rx-empty';empty.textContent='这一页没有符合条件的题目。';empty.style.display='none';
    tb.parentNode.insertBefore(empty,tb.nextSibling);
    var meta=document.querySelector('.ch-meta');if(meta&&meta.textContent.indexOf('点选项')<0)meta.textContent+=' · 点选项即判对错';
  }

  // ---- 每道题 ----
  qs.forEach(function(a){
    var mcb=a.querySelector('input.master-cb');var id=mcb?mcb.getAttribute('data-qid'):a.id;a._qid=id;
    var headEl=a.querySelector('.q-head');
    // 已掌握
    if(mcb){mcb.checked=!!M[id];a.classList.toggle('mastered',mcb.checked);
      mcb.addEventListener('change',function(){if(mcb.checked)M[id]=1;else delete M[id];a.classList.toggle('mastered',mcb.checked);save();refresh();applyFilter();});}
    // 错题
    var wl=document.createElement('label');wl.className='rx-wrong';wl.innerHTML='<input type="checkbox" class="wrong-cb">错题';
    var wcb=wl.querySelector('input');
    if(headEl){var ml=headEl.querySelector('.master');headEl.insertBefore(wl,ml||null);}
    wcb.checked=!!W[id];a.classList.toggle('is-wrong',wcb.checked);
    wcb.addEventListener('change',function(){if(wcb.checked)W[id]=1;else delete W[id];a.classList.toggle('is-wrong',wcb.checked);save();refresh();applyFilter();});
    // 点选项判题
    var b=a.querySelector('.ans-line b'),ans=b?b.textContent.replace(/\s/g,''):'';
    var opts=a.querySelectorAll('ol.opts > li');
    if(!opts.length||!/^[A-H]+$/.test(ans))return;
    var multi=ans.length>1,det=a.querySelector('details.ans');
    var bar=document.createElement('div');bar.className='rx-judge';
    bar.innerHTML=(multi?'<button type="button" class="rx-go" disabled>提交</button>':'')+'<span class="rx-verdict"></span><button type="button" class="rx-again" hidden>重做</button>';
    a.querySelector('ol.opts').insertAdjacentElement('afterend',bar);
    var go=bar.querySelector('.rx-go'),vd=bar.querySelector('.rx-verdict'),again=bar.querySelector('.rx-again');
    opts.forEach(function(o){o.classList.add('rx-opt');o.setAttribute('role','button');o.tabIndex=0;});
    function letter(o){return (o.getAttribute('value')||'').trim();}
    function judge(){
      var sel='';opts.forEach(function(o){if(o.classList.contains('sel'))sel+=letter(o);});
      a.classList.add('rx-done');
      opts.forEach(function(o){var l=letter(o),isA=ans.indexOf(l)>=0,isS=o.classList.contains('sel');
        o.classList.toggle('right',isA&&isS);o.classList.toggle('wrong',!isA&&isS);o.classList.toggle('miss',isA&&!isS);});
      var ok=sel===ans;
      vd.className='rx-verdict '+(ok?'ok':'bad');
      vd.textContent=ok?'回答正确':'回答错误：你选 '+(sel||'—')+'，正确答案 '+ans+(wcb.checked?'':'（已加入错题）');
      if(!ok&&!wcb.checked){wcb.checked=true;W[id]=1;a.classList.add('is-wrong');save();refresh();}
      if(det)det.open=true;
      if(go)go.hidden=true;again.hidden=false;
    }
    function reset(){a.classList.remove('rx-done');opts.forEach(function(o){o.classList.remove('sel','right','wrong','miss');});vd.textContent='';vd.className='rx-verdict';again.hidden=true;if(go){go.hidden=false;go.disabled=true;}if(det)det.open=false;}
    a._reset=reset;
    function pick(o){
      if(a.classList.contains('rx-done'))return;
      if(multi){o.classList.toggle('sel');go.disabled=!a.querySelector('.rx-opt.sel');}
      else{opts.forEach(function(x){x.classList.remove('sel');});o.classList.add('sel');judge();}
    }
    opts.forEach(function(o){
      o.addEventListener('click',function(e){if(e.target.closest('a'))return;pick(o);});
      o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(o);}});
    });
    if(go)go.addEventListener('click',judge);
    again.addEventListener('click',reset);
  });

  // ---- 筛选 / 展开 / 重做 ----
  function applyFilter(){
    var r=document.querySelector('input[name=rx-flt]:checked');if(!r)return;
    var f=r.value,shown=0;
    qs.forEach(function(a){var id=a._qid,h=f==='todo'?!!M[id]:f==='wrong'?!W[id]:false;a.classList.toggle('rx-hide',h);if(!h)shown++;});
    var e=document.querySelector('.rx-empty');if(e)e.style.display=shown?'none':'block';
  }
  document.querySelectorAll('input[name=rx-flt]').forEach(function(r){r.addEventListener('change',applyFilter);});
  var ex=document.getElementById('rx-expand');
  if(ex)ex.addEventListener('click',function(){var open=ex.dataset.open!=='1';document.querySelectorAll('details.ans').forEach(function(d){d.open=open;});ex.dataset.open=open?'1':'0';ex.textContent=open?'收起全部答案':'展开全部答案';});
  var redo=document.getElementById('rx-redo');
  if(redo)redo.addEventListener('click',function(){qs.forEach(function(a){if(a._reset)a._reset();});window.scrollTo(0,0);});
  var rs=document.getElementById('reset-progress');
  if(rs)rs.addEventListener('click',function(){
    if(confirm('确定清空全部“已掌握”和“错题”记录？')){M={};W={};save();location.reload();}
  });
  refresh();applyFilter();
})();

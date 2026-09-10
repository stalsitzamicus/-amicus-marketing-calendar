/* ---------- Calendar events: Jake-editable, Firebase-synced (mirrors day-tab taskAdds/taskOverrides) ---------- */
function effectiveEvents(){
  var list=CAL_EVENTS.map(function(e){ return Object.assign({},e); });
  Object.keys(calAdds||{}).forEach(function(k){ var a=calAdds[k]; list.push(Object.assign({},a,{id:a.id||k})); });
  list=list.filter(function(e){ var o=calOverrides[e.id]; return !(o&&o.deleted); });
  list.forEach(function(e){ var o=calOverrides[e.id]; if(o){ if(o.date!=null)e.date=o.date; if(o.title!=null)e.title=o.title; if(o.detail!=null)e.detail=o.detail; } });
  return list;
}
function addEvent(){ if(!jakeMode) return; var id='cadd_'+Date.now(); calAdds[id]={id:id,date:DEMO_TODAY,title:'New event',detail:''}; saveTasks(); render(); }
function deleteEvent(id){ if(!jakeMode) return; if(!confirm('Remove this event from the calendar?')) return; if(String(id).indexOf('cadd_')===0){ delete calAdds[id]; } else { calOverrides[id]=Object.assign({},calOverrides[id],{deleted:true}); } saveTasks(); render(); }
function editEventField(id,field,val){ if(!jakeMode) return; val=(val==null?'':val); if(String(id).indexOf('cadd_')===0){ if(calAdds[id]) calAdds[id][field]=val; } else { var o=Object.assign({},calOverrides[id]); o[field]=val; calOverrides[id]=o; } saveTasks(); render(); }
function renderCalendar(){
  let html='<div class="sync-banner">🔴 Live — event uploads sync to Jake &amp; Courtney</div>';
  html+='<p class="auto-note">Market events this month. After each event, drop the photos in OneDrive and paste the link so Courtney can pull recap content.</p>';
  var editing=(jakeMode&&taskEditMode);
  if(jakeMode){
    html+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;background:#faf6e9;border:1px solid #e6d9a8;border-radius:10px;">'
      +'<span style="font-size:13px;color:#8a6d0b;font-weight:700;">🔧 Admin (Jake) — '+(editing?'edit mode ON — add, rename, re-date, or remove events.':'you can edit this market&#39;s events.')+'</span>'
      +'<button onclick="toggleTaskEdit()" style="background:'+(editing?'#8a6d0b':'#fff')+';color:'+(editing?'#fff':'#8a6d0b')+';border:1px solid #8a6d0b;border-radius:8px;padding:7px 12px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap;">'+(editing?'Done editing':'✏️ Edit events')+'</button></div>';
  }
  var evs=effectiveEvents().slice().sort(function(a,b){return a.date<b.date?-1:1;});
  if(!evs.length && !editing){ return html+'<div style="color:#999;padding:20px;">No events yet.</div>'; }
  html+='<div class="tasks">';
  evs.forEach(function(ev){
    var c='#8E24AA'; var key='cal_'+ev.id; var lv=(taskLinks[key]||'').replace(/"/g,'&quot;'); var past=ev.date<DEMO_TODAY;
    if(editing){
      html+='<div class="task-card" style="border-left:4px solid '+c+';cursor:default;"><div class="task-icon">📅</div><div class="task-body">'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;"><input type="date" value="'+esc(ev.date)+'" onchange="editEventField(&#39;'+ev.id+'&#39;,&#39;date&#39;,this.value)" style="padding:5px 8px;border:1px solid #ccc;border-radius:8px;font-size:13px;font-weight:700;font-family:inherit;"/><button onclick="deleteEvent(&#39;'+ev.id+'&#39;)" style="margin-left:auto;background:#fff;color:#c62828;border:1px solid #e0b4b4;border-radius:8px;padding:5px 10px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">Remove</button></div>'
        +'<input type="text" value="'+esc(ev.title)+'" placeholder="Event title" onchange="editEventField(&#39;'+ev.id+'&#39;,&#39;title&#39;,this.value)" style="width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid #ccc;border-radius:8px;font-size:14px;font-weight:800;font-family:inherit;margin-bottom:6px;"/>'
        +'<input type="text" value="'+esc(ev.detail||'')+'" placeholder="Detail (optional)" onchange="editEventField(&#39;'+ev.id+'&#39;,&#39;detail&#39;,this.value)" style="width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid #ccc;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;"/>'
        +'</div></div>';
    } else {
      html+='<div class="task-card" style="border-left:4px solid '+c+';cursor:default;"><div class="task-icon">📅</div><div class="task-body"><div class="plat-label" style="color:'+c+'">'+fmtIso(ev.date)+(past?' · past':'')+'</div><div class="task-title">'+esc(ev.title)+'</div>'+(ev.detail?'<div class="task-detail">'+esc(ev.detail)+'</div>':'')+'<div class="qty-row" onclick="event.stopPropagation()" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;"><b style="font-weight:800">📸 POST-EVENT PHOTOS:</b> <input type="url" placeholder="Paste OneDrive link to event photos…" value="'+lv+'" onchange="setLink(&#39;'+key+'&#39;,this.value)" style="flex:1;min-width:0;padding:6px 10px;border:1px solid #ccc;border-radius:8px;font-size:13px;font-weight:700;"/>'+(taskLinks[key]?'<a href="'+taskLinks[key]+'" target="_blank" rel="noopener" style="font-size:13px;color:'+ACCENT+';font-weight:700;text-decoration:none;white-space:nowrap;">Open ↗</a>':'')+'</div></div></div>';
    }
  });
  html+='</div>';
  if(editing){ html+='<div style="margin-top:12px;"><button onclick="addEvent()" style="background:#8E24AA;color:#fff;border:none;border-radius:9px;padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">+ Add event</button></div>'; }
  return html;
}

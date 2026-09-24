(function(){
"use strict";
var KEY="reklaflow_v2";
var state=null;
var selectedId=null;

function isoDate(d){return d.toISOString().slice(0,10)}
function datePlus(days){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return isoDate(d)}
function today(){return datePlus(0)}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]})}
function fmt(d){if(!d)return "–";var x=new Date(d+"T12:00:00");return x.toLocaleDateString("de-DE")}
function money(n){return Number(n||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function uid(prefix){return prefix+"_"+Math.random().toString(36).slice(2,10)}
function statusClass(s){if(s==="Abgeschlossen")return"green";if(s==="Neu"||s==="Versendet")return"blue";if(s==="8D offen"||s==="Wirksamkeitsprüfung")return"orange";return"red"}
function badge(s){return '<span class="badge '+statusClass(s)+'">'+esc(s)+'</span>'}
function isOpen(c){return c.status!=="Abgeschlossen"}
function isOverdue(c){return isOpen(c)&&c.due&&new Date(c.due+"T23:59:59")<new Date()}
function daysTo(d){if(!d)return null;var a=new Date();a.setHours(0,0,0,0);var b=new Date(d+"T00:00:00");return Math.round((b-a)/86400000)}
function dueText(c){if(!c.due)return"Keine Frist";var n=daysTo(c.due);if(c.status==="Abgeschlossen")return fmt(c.due);if(n<0)return Math.abs(n)+" T. überfällig";if(n===0)return"Heute";if(n===1)return"Morgen";return"in "+n+" Tagen"}

function seed(){
 var s1={id:"sup_mueller",name:"Müller Kunststofftechnik GmbH",supplierNo:"L-10042",contact:"Julia Weber",email:"j.weber@beispiel.de",phone:"+49 711 555 120",city:"Stuttgart"};
 var s2={id:"sup_haas",name:"Haas Drehteile GmbH",supplierNo:"L-10118",contact:"Thomas Haas",email:"q@beispiel.de",phone:"+49 7321 555 87",city:"Heidenheim"};
 var s3={id:"sup_kroner",name:"Kroner Verpackung KG",supplierNo:"L-10205",contact:"Nina Keller",email:"qs@beispiel.de",phone:"+49 621 555 41",city:"Mannheim"};
 return {
  settings:{company:"Musterwerk GmbH",contact:"Qualitätsmanagement",email:"qm@musterwerk.de",prefix:"REK",reminderDays:2,defaultDueDays:5},
  suppliers:[s1,s2,s3],
  complaints:[
   {id:"REK-"+new Date().getFullYear()+"-0003",seq:3,supplierId:s1.id,article:"4711-002",articleName:"Gehäuse links",po:"45008152",delivery:"LS-873942",batch:"2409-A",deliveryDate:datePlus(-3),qty:500,bad:32,category:"Oberfläche",issue:"Kratzer auf der Sichtfläche, teilweise bis auf das Grundmaterial.",priority:"Hoch",requested:"Stellungnahme",status:"Wartet auf Stellungnahme",created:datePlus(-2),due:datePlus(1),cost:0,attachments:[{name:"fehlerbild_01.jpg",size:"842 KB"},{name:"lieferschein.pdf",size:"188 KB"}],history:[{date:datePlus(-2),text:"Reklamation angelegt"},{date:datePlus(-2),text:"Lieferant informiert"},{date:datePlus(-1),text:"Eingang durch Lieferant bestätigt"}],d8:{d1:"Julia Weber (Lieferant), Qualitätsmanagement Musterwerk",d2:"Kratzer im Sichtbereich von 32 Bauteilen.",d3:"Bestand beim Lieferanten gesperrt; Sichtprüfung 100 % angekündigt.",d4:"",d5:"",d6:"",d7:"",d8:""}},
   {id:"REK-"+new Date().getFullYear()+"-0002",seq:2,supplierId:s2.id,article:"A-9182",articleName:"Distanzhülse",po:"45007991",delivery:"LS-77210",batch:"B240817",deliveryDate:datePlus(-8),qty:1200,bad:18,category:"Maßabweichung",issue:"Außendurchmesser außerhalb Zeichnungstoleranz.",priority:"Hoch",requested:"8D-Bericht",status:"8D offen",created:datePlus(-6),due:datePlus(3),cost:820,attachments:[{name:"messprotokoll.pdf",size:"244 KB"}],history:[{date:datePlus(-6),text:"Reklamation angelegt"},{date:datePlus(-5),text:"Sofortmaßnahme erhalten"},{date:datePlus(-2),text:"8D-Bearbeitung gestartet"}],d8:{d1:"Team Lieferantenqualität / Haas Drehteile",d2:"18 Teile außerhalb Toleranz.",d3:"Sortierung beim Lieferanten und Sperrung Restbestand.",d4:"Werkzeugkorrektur nicht nach Sollmaß rückgemeldet.",d5:"Prüffrequenz erhöhen und Werkzeugwechsel dokumentieren.",d6:"",d7:"",d8:""}},
   {id:"REK-"+new Date().getFullYear()+"-0001",seq:1,supplierId:s3.id,article:"VP-220",articleName:"Transporttray",po:"45007612",delivery:"456782",batch:"",deliveryDate:datePlus(-12),qty:800,bad:74,category:"Verpackung",issue:"Trays verformt, Bauteile liegen nicht positionssicher.",priority:"Mittel",requested:"Sofortmaßnahme",status:"Abgeschlossen",created:datePlus(-10),due:datePlus(-5),cost:310,attachments:[],history:[{date:datePlus(-10),text:"Reklamation angelegt"},{date:datePlus(-8),text:"Ersatzlieferung zugesagt"},{date:datePlus(-3),text:"Ersatzlieferung geprüft"},{date:datePlus(-2),text:"Reklamation abgeschlossen"}],d8:{d1:"Kroner Verpackung",d2:"74 verformte Trays.",d3:"Restbestand geprüft.",d4:"Zu hohe Stapeltemperatur nach Fertigung.",d5:"Abkühlzeit verlängert.",d6:"Erstmuster nach Änderung i.O.",d7:"Arbeitsanweisung angepasst.",d8:"Fall nach Ersatzlieferung abgeschlossen."}}
  ]
 };
}
function migrate(){
 state.settings=state.settings||{};
 state.suppliers=state.suppliers||[];
 state.complaints=(state.complaints||[]).map(function(c){
  c.internal=c.internal||{};
  if(c.internal.detectedAt==null)c.internal.detectedAt="Wareneingang";
  if(c.internal.owner==null)c.internal.owner=state.settings.contact||"Qualitätsmanagement";
  if(c.internal.blockedQty==null)c.internal.blockedQty=Number(c.bad)||0;
  if(c.internal.disposition==null)c.internal.disposition="Noch offen";
  if(c.internal.containment==null)c.internal.containment="";
  if(c.internal.stockImpact==null)c.internal.stockImpact="Unklar";
  if(c.internal.lineStop==null)c.internal.lineStop=false;
  c.supplierResponse=c.supplierResponse||{};
  if(c.supplierResponse.acknowledged==null)c.supplierResponse.acknowledged=false;
  if(c.supplierResponse.comment==null)c.supplierResponse.comment="";
  if(c.supplierResponse.replacementDate==null)c.supplierResponse.replacementDate="";
  c.costTracking=c.costTracking||{};
  if(c.costTracking.claimed==null)c.costTracking.claimed=Number(c.cost)||0;
  if(c.costTracking.status==null)c.costTracking.status=(Number(c.cost)||0)>0?"Offen":"Nicht relevant";
  if(c.effectiveness==null)c.effectiveness={checked:false,note:""};
  return c;
 });
}
function load(){try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!state||!state.complaints)state=seed();migrate();save()}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function supplier(id){return state.suppliers.find(function(s){return s.id===id})||{name:"Unbekannter Lieferant",supplierNo:"–"}}
function nextId(){var max=state.complaints.reduce(function(m,c){return Math.max(m,Number(c.seq)||0)},0)+1;return {seq:max,id:(state.settings.prefix||"REK")+"-"+new Date().getFullYear()+"-"+String(max).padStart(4,"0")}}
function addHistory(c,text){c.history=c.history||[];c.history.push({date:today(),text:text})}
function closureCheck(c){
 var needs8D=c.requested==="8D-Bericht"||c.status==="8D offen";
 var d8ok=!needs8D||["d1","d2","d3","d4","d5","d6","d7","d8"].every(function(k){return String((c.d8||{})[k]||"").trim()});
 var items=[
  {label:"Materialentscheidung getroffen",ok:!!(c.internal&&c.internal.disposition&&c.internal.disposition!=="Noch offen")},
  {label:"Lieferantenreaktion dokumentiert",ok:!!(c.supplierResponse&&(c.supplierResponse.acknowledged||String(c.supplierResponse.comment||"").trim()||String((c.d8||{}).d3||"").trim()))},
  {label:"8D vollständig",ok:d8ok,optional:!needs8D},
  {label:"Kosten geklärt",ok:!(Number(c.costTracking&&c.costTracking.claimed)||0)||["Anerkannt","Abgelehnt","Verrechnet","Nicht relevant"].indexOf(c.costTracking&&c.costTracking.status)>=0},
  {label:"Wirksamkeit geprüft",ok:!!(c.effectiveness&&c.effectiveness.checked)}
 ];
 return {items:items,ok:items.every(function(x){return x.ok||x.optional})};
}

function showView(id){
 document.querySelectorAll(".view").forEach(function(v){v.classList.remove("active")});
 var el=document.getElementById(id);if(el)el.classList.add("active");
 document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-view")===id)});
 if(id==="dashboard")renderDashboard();
 if(id==="complaints")renderComplaints();
 if(id==="suppliers")renderSuppliers();
 if(id==="eightd")render8DList();
 if(id==="analytics")renderAnalytics();
 if(id==="settings")renderSettings();
 if(id==="detail")renderDetail();
 if(id==="portal")renderPortal();
 window.scrollTo({top:0,behavior:"smooth"});
}
window.showView=showView;

function statCard(label,value,hint){
 return '<div class="stat"><div class="statLabel">'+esc(label)+'</div><div class="statValue">'+esc(value)+'</div><div class="statHint">'+esc(hint)+'</div></div>';
}
function complaintRow(c,withQty){
 var s=supplier(c.supplierId);
 return '<tr onclick="openDetail(\''+esc(c.id)+'\')"><td><div class="strong">'+esc(c.id)+'</div><div class="small">'+fmt(c.created)+'</div></td><td>'+esc(s.name)+'</td><td><div class="strong">'+esc(c.article)+'</div><div class="small">'+esc(c.articleName)+'</div></td>'+(withQty?'<td class="mono">'+esc(c.bad)+' / '+esc(c.qty||"–")+'</td>':'')+'<td>'+badge(c.status)+'</td><td><div class="'+(isOverdue(c)?"strong":"")+'">'+fmt(c.due)+'</div><div class="small">'+esc(dueText(c))+'</div></td></tr>';
}

function renderDashboard(){
 var open=state.complaints.filter(isOpen), overdue=open.filter(isOverdue), d8=open.filter(function(c){return c.status==="8D offen"}), bad=open.reduce(function(a,c){return a+(Number(c.bad)||0)},0);
 document.getElementById("dashboardStats").innerHTML=statCard("Offene Fälle",open.length,"aktuell in Bearbeitung")+statCard("Überfällig",overdue.length,"Rückmeldung fehlt")+statCard("8D offen",d8.length,"Berichte in Bearbeitung")+statCard("n.i.O. Teile",bad.toLocaleString("de-DE"),"aus offenen Fällen");
 var recent=open.slice().sort(function(a,b){return String(b.created).localeCompare(String(a.created))}).slice(0,6);
 document.getElementById("dashboardRows").innerHTML=recent.length?recent.map(function(c){return complaintRow(c,false)}).join(""):'<tr><td colspan="5"><div class="empty">Keine offenen Reklamationen.</div></td></tr>';
 var deadlines=open.filter(function(c){return c.due}).sort(function(a,b){return a.due.localeCompare(b.due)}).slice(0,6);
 document.getElementById("deadlineList").innerHTML=deadlines.length?deadlines.map(function(c){var s=supplier(c.supplierId);return '<div class="deadline" onclick="openDetail(\''+esc(c.id)+'\')" style="cursor:pointer"><div><b>'+esc(c.id)+' · '+esc(s.name)+'</b><span>'+esc(c.requested)+'</span></div><div style="text-align:right"><b>'+fmt(c.due)+'</b><span>'+esc(dueText(c))+'</span></div></div>'}).join(""):'<div class="empty">Keine offenen Fristen.</div>';
}

function renderComplaints(){
 var q=(document.getElementById("complaintSearch").value||"").toLowerCase(), f=document.getElementById("complaintFilter").value||"", p=document.getElementById("priorityFilter").value||"";
 var list=state.complaints.filter(function(c){var s=supplier(c.supplierId);var hay=[c.id,s.name,c.article,c.articleName,c.delivery,c.issue,c.category].join(" ").toLowerCase();return(!q||hay.indexOf(q)>=0)&&(!f||c.status===f)&&(!p||c.priority===p)});
 document.getElementById("complaintRows").innerHTML=list.length?list.map(function(c){return complaintRow(c,true)}).join(""):'<tr><td colspan="6"><div class="empty">Keine passenden Reklamationen gefunden.</div></td></tr>';
}
window.renderComplaints=renderComplaints;

function renderSuppliers(){
 var rows=state.suppliers.map(function(s){
  var cs=state.complaints.filter(function(c){return c.supplierId===s.id}), open=cs.filter(isOpen).length, bad=cs.reduce(function(a,c){return a+(Number(c.bad)||0)},0), last=cs.slice().sort(function(a,b){return String(b.created).localeCompare(String(a.created))})[0];
  return '<tr><td><div class="strong">'+esc(s.name)+'</div><div class="small">'+esc(s.supplierNo||"")+' · '+esc(s.city||"")+'</div></td><td>'+esc(s.contact||"–")+'<div class="small">'+esc(s.email||"")+'</div></td><td>'+cs.length+'</td><td>'+open+'</td><td>'+bad.toLocaleString("de-DE")+'</td><td>'+(last?fmt(last.created):"–")+'</td></tr>';
 });
 document.getElementById("supplierRows").innerHTML=rows.length?rows.join(""):'<tr><td colspan="6"><div class="empty">Noch keine Lieferanten angelegt.</div></td></tr>';
}

function d8Progress(c){var keys=["d1","d2","d3","d4","d5","d6","d7","d8"],done=keys.filter(function(k){return c.d8&&String(c.d8[k]||"").trim()}).length;return {done:done,pct:Math.round(done/8*100)}}
function render8DList(){
 var list=state.complaints.filter(function(c){return c.requested==="8D-Bericht"||c.status==="8D offen"||Object.values(c.d8||{}).some(Boolean)});
 document.getElementById("eightdRows").innerHTML=list.length?list.map(function(c){var s=supplier(c.supplierId),p=d8Progress(c),close=closureCheck(c);return '<tr onclick="openDetail(\''+esc(c.id)+'\',true)"><td><div class="strong">'+esc(c.id)+'</div><div class="small">'+esc(s.name)+'</div></td><td>'+esc(c.article)+'<div class="small">'+esc(c.articleName)+'</div></td><td style="min-width:150px"><div class="barLabel"><span>'+p.done+'/8 Felder</span><b>'+p.pct+' %</b></div><div class="progress"><span style="width:'+p.pct+'%"></span></div></td><td>'+badge(c.status)+'</td><td>'+fmt(c.due)+'</td></tr>'}).join(""):'<tr><td colspan="5"><div class="empty">Noch keine 8D-Fälle.</div></td></tr>';
}

function renderAnalytics(){
 var all=state.complaints, open=all.filter(isOpen), closed=all.filter(function(c){return c.status==="Abgeschlossen"}), totalCost=all.reduce(function(a,c){return a+(Number(c.cost)||0)},0);
 document.getElementById("analyticsStats").innerHTML=statCard("Reklamationen",all.length,"gesamt im Demo-Datensatz")+statCard("Abschlussquote",all.length?Math.round(closed.length/all.length*100)+" %":"0 %","abgeschlossene Fälle")+statCard("Lieferanten",new Set(all.map(function(c){return c.supplierId})).size,"mit Reklamationen")+statCard("Reklamationskosten",money(totalCost),"erfasste Kosten");
 var bySup=state.suppliers.map(function(s){return {name:s.name,n:all.filter(function(c){return c.supplierId===s.id}).length}}).sort(function(a,b){return b.n-a.n}), max=Math.max.apply(null,bySup.map(function(x){return x.n}).concat([1]));
 document.getElementById("supplierBars").innerHTML=bySup.map(function(x){return '<div class="barRow"><div class="barLabel"><b>'+esc(x.name)+'</b><span>'+x.n+' Fälle</span></div><div class="bar"><span style="width:'+(x.n/max*100)+'%"></span></div></div>'}).join("");
 var cat={};all.forEach(function(c){cat[c.category||"Sonstige"]=(cat[c.category||"Sonstige"]||0)+1});var cats=Object.keys(cat).map(function(k){return{name:k,n:cat[k]}}).sort(function(a,b){return b.n-a.n}),cmax=Math.max.apply(null,cats.map(function(x){return x.n}).concat([1]));
 document.getElementById("categoryBars").innerHTML=cats.map(function(x){return '<div class="barRow"><div class="barLabel"><b>'+esc(x.name)+'</b><span>'+x.n+'</span></div><div class="bar"><span style="width:'+(x.n/cmax*100)+'%"></span></div></div>'}).join("");
}

function openDetail(id,jump8d){selectedId=id;showView("detail");if(jump8d)setTimeout(function(){var e=document.getElementById("eightDPanel");if(e)e.scrollIntoView({behavior:"smooth"})},100)}
window.openDetail=openDetail;
function current(){return state.complaints.find(function(c){return c.id===selectedId})}

function renderAttachments(c){
 return c.attachments&&c.attachments.length?c.attachments.map(function(f){return '<div class="fileChip"><span>📎 '+esc(f.name)+'</span><span class="small">'+esc(f.size||"")+'</span></div>'}).join(""):'<div class="small">Noch keine Anhänge.</div>';
}
function renderDetail(){
 var c=current();if(!c){showView("complaints");return}var s=supplier(c.supplierId),p=d8Progress(c);
 var dlabels={d1:"D1 · Team",d2:"D2 · Problembeschreibung",d3:"D3 · Sofortmaßnahmen",d4:"D4 · Fehlerursache",d5:"D5 · Abstellmaßnahmen",d6:"D6 · Umsetzung & Wirksamkeit",d7:"D7 · Vorbeugung",d8:"D8 · Abschluss"};
 var dhtml=Object.keys(dlabels).map(function(k){var val=c.d8&&c.d8[k]||"";return '<div class="dstep '+(val.trim()?"done":"")+'"><div class="dstepHead"><h3>'+dlabels[k]+'</h3><span class="small">'+(val.trim()?"ausgefüllt":"offen")+'</span></div><textarea id="d_'+k+'" placeholder="Eintrag zu '+esc(dlabels[k])+'">'+esc(val)+'</textarea></div>'}).join("");
 document.getElementById("detailContent").innerHTML=
 '<div class="card" style="margin-bottom:16px"><div class="cardHead"><div><div class="small">'+esc(c.id)+'</div><h2>'+esc(s.name)+'</h2></div><div class="actions">'+badge(c.status)+(c.status==="Neu"?'<button class="btn sm primary" onclick="openSendModal()">Reklamation senden</button>':'')+'<button class="btn sm" onclick="printCase()">PDF / Drucken</button><button class="btn sm" onclick="openPortal()">Lieferantenansicht</button></div></div><div class="cardBody"><div class="metaGrid">'+
 '<div class="meta"><span>Artikel</span><b>'+esc(c.article)+' · '+esc(c.articleName)+'</b></div><div class="meta"><span>Bestellung / Lieferschein</span><b>'+esc(c.po||"–")+' / '+esc(c.delivery||"–")+'</b></div><div class="meta"><span>Charge</span><b>'+esc(c.batch||"–")+'</b></div>'+
 '<div class="meta"><span>Beanstandung</span><b>'+esc(c.bad)+' von '+esc(c.qty||"–")+' Teilen</b></div><div class="meta"><span>Priorität</span><b>'+esc(c.priority)+'</b></div><div class="meta"><span>Antwortfrist</span><b>'+fmt(c.due)+' · '+esc(dueText(c))+'</b></div></div></div></div>'+
 '<div class="card" style="margin-bottom:16px"><div class="cardHead"><div><h3>Interne Bewertung</h3><div class="small">Sperrung, Materialentscheidung und interne Absicherung</div></div><button class="btn sm noPrint" onclick="saveInternal()">Speichern</button></div><div class="cardBody"><div class="formGrid">'+
 '<div class="field"><label>Fehler entdeckt bei</label><select id="iDetected"><option '+(c.internal.detectedAt==="Wareneingang"?"selected":"")+'>Wareneingang</option><option '+(c.internal.detectedAt==="Produktion"?"selected":"")+'>Produktion</option><option '+(c.internal.detectedAt==="Endprüfung"?"selected":"")+'>Endprüfung</option><option '+(c.internal.detectedAt==="Kunde"?"selected":"")+'>Kunde</option></select></div>'+
 '<div class="field"><label>Interner Verantwortlicher</label><input id="iOwner" value="'+esc(c.internal.owner||"")+'"></div>'+
 '<div class="field"><label>Gesperrte Menge</label><input id="iBlocked" type="number" min="0" value="'+esc(c.internal.blockedQty||0)+'"></div>'+
 '<div class="field"><label>Bestandsauswirkung</label><select id="iImpact"><option '+(c.internal.stockImpact==="Unklar"?"selected":"")+'>Unklar</option><option '+(c.internal.stockImpact==="Nur Lieferung"?"selected":"")+'>Nur Lieferung</option><option '+(c.internal.stockImpact==="Lagerbestand betroffen"?"selected":"")+'>Lagerbestand betroffen</option><option '+(c.internal.stockImpact==="Produktion betroffen"?"selected":"")+'>Produktion betroffen</option></select></div>'+
 '<div class="field"><label>Materialentscheidung</label><select id="iDisposition"><option '+(c.internal.disposition==="Noch offen"?"selected":"")+'>Noch offen</option><option '+(c.internal.disposition==="Rücksendung"?"selected":"")+'>Rücksendung</option><option '+(c.internal.disposition==="Sortieren"?"selected":"")+'>Sortieren</option><option '+(c.internal.disposition==="Nacharbeit"?"selected":"")+'>Nacharbeit</option><option '+(c.internal.disposition==="Verschrotten"?"selected":"")+'>Verschrotten</option><option '+(c.internal.disposition==="Sonderfreigabe"?"selected":"")+'>Sonderfreigabe</option><option '+(c.internal.disposition==="Ersatzlieferung"?"selected":"")+'>Ersatzlieferung</option></select></div>'+
 '<div class="field"><label class="checkline"><input id="iLineStop" type="checkbox" '+(c.internal.lineStop?"checked":"")+'> Produktions-/Linienstopp</label></div>'+
 '<div class="field full"><label>Interne Sofortmaßnahme / Absicherung</label><textarea id="iContainment" placeholder="z. B. Bestand sperren, 100-%-Prüfung, Sortierung...">'+esc(c.internal.containment||"")+'</textarea></div>'+
 '</div></div></div>'+
 '<div class="detailColumns"><div>'+
 '<div class="card" style="margin-bottom:16px"><div class="cardHead"><h3>Fehler & Dokumente</h3><button class="btn sm noPrint" onclick="openEditCase()">Bearbeiten</button></div><div class="cardBody"><div class="sectionTitle">Fehlerkategorie</div><div>'+badge(c.category||"Sonstige")+'</div><div class="sectionTitle">Fehlerbeschreibung</div><p class="issue">'+esc(c.issue)+'</p><div class="sectionTitle">Anhänge</div>'+renderAttachments(c)+'</div></div>'+
 '<div class="card" id="eightDPanel"><div class="cardHead"><div><h3>8D / Stellungnahme</h3><div class="small">'+p.done+' von 8 Abschnitten ausgefüllt</div></div><div style="min-width:120px"><div class="progress"><span style="width:'+p.pct+'%"></span></div></div></div><div class="cardBody"><div class="d8grid">'+dhtml+'</div><div class="actions noPrint" style="margin-top:13px"><button class="btn primary" onclick="save8D()">8D speichern</button><button class="btn" onclick="setCaseStatus(\'Wirksamkeitsprüfung\')">Zur Wirksamkeitsprüfung</button></div></div></div>'+
 '</div><div>'+
 '<div class="card" style="margin-bottom:16px"><div class="cardHead"><h3>Bearbeitung</h3></div><div class="cardBody"><div class="sectionTitle" style="margin-top:0">Geforderte Reaktion</div><div class="strong">'+esc(c.requested)+'</div><div class="sectionTitle">Status ändern</div><select class="select" id="detailStatus" style="width:100%" onchange="setCaseStatus(this.value)">'+["Neu","Versendet","Wartet auf Stellungnahme","8D offen","Wirksamkeitsprüfung","Abgeschlossen"].map(function(x){return '<option '+(x===c.status?"selected":"")+'>'+x+'</option>'}).join("")+'</select>'+
 '<div class="sectionTitle">Kostenforderung</div><div class="formGrid" style="grid-template-columns:1fr"><div class="field"><label>Betrag</label><input id="costClaimed" type="number" min="0" step="0.01" value="'+esc(c.costTracking.claimed||0)+'"></div><div class="field"><label>Status</label><select id="costStatus"><option '+(c.costTracking.status==="Offen"?"selected":"")+'>Offen</option><option '+(c.costTracking.status==="Anerkannt"?"selected":"")+'>Anerkannt</option><option '+(c.costTracking.status==="Abgelehnt"?"selected":"")+'>Abgelehnt</option><option '+(c.costTracking.status==="Verrechnet"?"selected":"")+'>Verrechnet</option><option '+(c.costTracking.status==="Nicht relevant"?"selected":"")+'>Nicht relevant</option></select></div></div><button class="btn sm noPrint" style="margin-top:8px" onclick="saveCost()">Kosten speichern</button>'+
 '<div class="sectionTitle">Wirksamkeitsprüfung</div><label class="checkline"><input id="effectivenessChecked" type="checkbox" '+(c.effectiveness.checked?"checked":"")+'> Maßnahme wirksam</label><textarea id="effectivenessNote" style="width:100%;min-height:65px;border:1px solid var(--line);border-radius:9px;padding:9px;margin-top:8px" placeholder="Prüfung / Nachweis...">'+esc(c.effectiveness.note||"")+'</textarea><button class="btn sm noPrint" style="margin-top:8px" onclick="saveEffectiveness()">Prüfung speichern</button>'+
 '<div class="sectionTitle">Abschlusscheck</div><div class="closureList">'+close.items.map(function(x){return '<div class="closureItem '+((x.ok||x.optional)?"ok":"open")+'"><span>'+((x.ok||x.optional)?"✓":"!")+'</span><div><b>'+esc(x.label)+'</b>'+(x.optional?'<small>nicht erforderlich</small>':'')+'</div></div>'}).join("")+'</div>'+
 '<div class="actions noPrint" style="margin-top:13px"><button class="btn" onclick="copySupplierLink()">Lieferantenlink kopieren</button><button class="btn primary" onclick="attemptClose()">Abschluss prüfen</button></div></div></div>'+
 '<div class="card"><div class="cardHead"><h3>Verlauf</h3></div><div class="cardBody"><div class="timeline">'+(c.history||[]).slice().reverse().map(function(h){return '<div class="event"><b>'+esc(h.text)+'</b><p>'+fmt(h.date)+'</p></div>'}).join("")+'</div></div></div>'+
 '</div></div>';
}
function saveInternal(){var c=current();if(!c)return;c.internal.detectedAt=document.getElementById("iDetected").value;c.internal.owner=document.getElementById("iOwner").value.trim();c.internal.blockedQty=Number(document.getElementById("iBlocked").value)||0;c.internal.stockImpact=document.getElementById("iImpact").value;c.internal.disposition=document.getElementById("iDisposition").value;c.internal.lineStop=document.getElementById("iLineStop").checked;c.internal.containment=document.getElementById("iContainment").value.trim();addHistory(c,"Interne Bewertung aktualisiert");save();renderDetail();toast("Interne Bewertung gespeichert")}window.saveInternal=saveInternal;
function saveCost(){var c=current();if(!c)return;c.costTracking.claimed=Number(document.getElementById("costClaimed").value)||0;c.costTracking.status=document.getElementById("costStatus").value;c.cost=c.costTracking.claimed;addHistory(c,"Kostenstatus aktualisiert: "+c.costTracking.status);save();renderDetail();toast("Kosten gespeichert")}window.saveCost=saveCost;
function saveEffectiveness(){var c=current();if(!c)return;c.effectiveness.checked=document.getElementById("effectivenessChecked").checked;c.effectiveness.note=document.getElementById("effectivenessNote").value.trim();addHistory(c,"Wirksamkeitsprüfung aktualisiert");save();renderDetail();toast("Wirksamkeitsprüfung gespeichert")}window.saveEffectiveness=saveEffectiveness;
function attemptClose(){var c=current();if(!c)return;var chk=closureCheck(c);if(!chk.ok){var missing=chk.items.filter(function(x){return !x.ok&&!x.optional}).map(function(x){return "• "+x.label}).join("\n");alert("Für einen sauberen Abschluss fehlen noch:\n\n"+missing);return}c.status="Abgeschlossen";addHistory(c,"Reklamation nach Abschlussprüfung geschlossen");save();renderDetail();toast("Reklamation abgeschlossen")}window.attemptClose=attemptClose;
function save8D(){var c=current();if(!c)return;c.d8=c.d8||{};["d1","d2","d3","d4","d5","d6","d7","d8"].forEach(function(k){c.d8[k]=document.getElementById("d_"+k).value.trim()});if(c.status==="Neu"||c.status==="Versendet"||c.status==="Wartet auf Stellungnahme")c.status="8D offen";addHistory(c,"8D-Bericht aktualisiert");save();renderDetail();toast("8D-Bericht gespeichert")}
window.save8D=save8D;
function setCaseStatus(status){var c=current();if(!c||!status)return;if(status==="Abgeschlossen"){attemptClose();return}if(c.status!==status){c.status=status;addHistory(c,"Status geändert: "+status);save()}renderDetail()}
window.setCaseStatus=setCaseStatus;
function printCase(){window.print()}window.printCase=printCase;

function openSendModal(){
 var c=current();if(!c)return;var s=supplier(c.supplierId);
 document.getElementById("sendTo").value=s.email||"";
 document.getElementById("sendSubject").value="Lieferantenreklamation "+c.id+" – "+c.article;
 document.getElementById("sendBody").value="Guten Tag"+(s.contact?", "+s.contact:"")+",\n\nzu der Lieferung "+(c.delivery||"–")+" beanstanden wir "+c.bad+" von "+(c.qty||"–")+" Teilen des Artikels "+c.article+" ("+(c.articleName||"") +").\n\nFehler: "+c.issue+"\n\nBitte senden Sie uns bis "+fmt(c.due)+" die angeforderte Rückmeldung: "+c.requested+".\n\nDen Vorgang können Sie über den persönlichen ReklaFlow-Link bearbeiten.\n\nFreundliche Grüße\n"+(state.settings.contact||"Qualitätsmanagement")+"\n"+(state.settings.company||"");
 document.getElementById("sendModal").classList.add("open");
}window.openSendModal=openSendModal;
function markSent(){
 var c=current();if(!c)return;
 c.status="Versendet";
 c.sentAt=today();
 addHistory(c,"Reklamation an Lieferant versendet");
 save();
 closeModal("sendModal");
 renderDetail();
 toast("Reklamation als versendet markiert");
}window.markSent=markSent;
function copySendText(){
 var body=document.getElementById("sendBody").value;
 var text="Betreff: "+document.getElementById("sendSubject").value+"\n\n"+body;
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast("E-Mail-Text kopiert")})}else{prompt("E-Mail-Text:",text)}
}window.copySendText=copySendText;

function openPortal(){showView("portal")}window.openPortal=openPortal;
function renderPortal(){
 var c=current();if(!c)return;var s=supplier(c.supplierId);
 document.getElementById("portalContent").innerHTML=
 '<div class="portalShell"><div class="noPrint" style="margin-bottom:10px"><button class="btn" onclick="showView(\'detail\')">← Interne Ansicht</button></div><div class="portalHero"><div class="small" style="color:#a9c0d0">'+esc(c.id)+'</div><h1 style="margin:3px 0 5px">'+esc(state.settings.company)+'</h1><p>Bitte bearbeiten Sie die Reklamation zu Artikel <b>'+esc(c.article)+'</b> bis <b>'+fmt(c.due)+'</b>.</p></div>'+
 '<div class="card" style="margin-bottom:13px"><div class="cardBody"><div class="metaGrid"><div class="meta"><span>Ihr Unternehmen</span><b>'+esc(s.name)+'</b></div><div class="meta"><span>Artikel</span><b>'+esc(c.article)+' · '+esc(c.articleName)+'</b></div><div class="meta"><span>Beanstandung</span><b>'+esc(c.bad)+' / '+esc(c.qty||"–")+' Teile</b></div></div><div class="sectionTitle">Fehlerbeschreibung</div><p class="issue">'+esc(c.issue)+'</p><div class="sectionTitle">Anhänge</div>'+renderAttachments(c)+'</div></div>'+
 '<div class="portalGrid"><div class="portalAction"><h3>✓ Eingang bestätigen</h3><p>Bestätigen Sie, dass die Reklamation bei Ihnen in Bearbeitung ist.</p><button class="btn" onclick="supplierAction(\'confirm\')">Eingang bestätigen</button></div>'+
 '<div class="portalAction"><h3>⚡ Sofortmaßnahme</h3><p>Teilen Sie die kurzfristige Absicherung mit.</p><textarea id="portalD3" style="width:100%;min-height:70px;border:1px solid var(--line);border-radius:9px;padding:9px" placeholder="Sofortmaßnahme...">'+esc(c.d8&&c.d8.d3||"")+'</textarea><button class="btn" style="margin-top:8px" onclick="supplierAction(\'d3\')">Speichern</button></div>'+
 '<div class="portalAction"><h3>8D-Bericht bearbeiten</h3><p>Öffnet den strukturierten 8D-Bereich des Falls.</p><button class="btn" onclick="supplierAction(\'8d\')">8D starten</button></div>'+
 '<div class="portalAction"><h3>📦 Ersatzlieferung</h3><p>Termin und Menge als Rückmeldung dokumentieren.</p><input id="replacementDate" type="date" class="select" style="width:100%"><button class="btn" style="margin-top:8px" onclick="supplierAction(\'replacement\')">Termin melden</button></div></div></div>';
}
function supplierAction(type){var c=current();if(!c)return;if(type==="confirm"){c.status="Wartet auf Stellungnahme";c.supplierResponse.acknowledged=true;addHistory(c,"Lieferant hat den Eingang bestätigt");toast("Eingang bestätigt")}
 if(type==="d3"){var v=document.getElementById("portalD3").value.trim();c.d8=c.d8||{};c.d8.d3=v;c.supplierResponse.comment=v;c.status="8D offen";addHistory(c,"Sofortmaßnahme durch Lieferant aktualisiert");toast("Sofortmaßnahme gespeichert")}
 if(type==="8d"){c.status="8D offen";addHistory(c,"Lieferant hat die 8D-Bearbeitung gestartet");save();showView("detail");setTimeout(function(){document.getElementById("eightDPanel").scrollIntoView({behavior:"smooth"})},100);return}
 if(type==="replacement"){var d=document.getElementById("replacementDate").value;if(!d){alert("Bitte Termin auswählen.");return}c.supplierResponse.replacementDate=d;addHistory(c,"Ersatzlieferung angekündigt für "+fmt(d));toast("Ersatzlieferung dokumentiert")}
 save();renderPortal()}
window.supplierAction=supplierAction;

function openNewCase(){document.getElementById("caseModal").classList.add("open");fillSupplierSelect();document.getElementById("cDue").value=datePlus(Number(state.settings.defaultDueDays)||5);document.getElementById("cDeliveryDate").value=today()}window.openNewCase=openNewCase;
function closeModal(id){document.getElementById(id).classList.remove("open")}window.closeModal=closeModal;
function fillSupplierSelect(){var el=document.getElementById("cSupplier");el.innerHTML='<option value="">Lieferant wählen…</option>'+state.suppliers.map(function(s){return '<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>'}).join("")}
function createCase(){
 var sup=document.getElementById("cSupplier").value,article=document.getElementById("cArticle").value.trim(),bad=Number(document.getElementById("cBad").value),issue=document.getElementById("cIssue").value.trim();
 if(!sup||!article||!bad||!issue){alert("Bitte Lieferant, Artikelnummer, Menge n.i.O. und Fehlerbeschreibung ausfüllen.");return}
 var n=nextId(), files=Array.from(document.getElementById("cFiles").files||[]).map(function(f){return{name:f.name,size:Math.max(1,Math.round(f.size/1024))+" KB"}});
 var initialCost=Number(document.getElementById("cCost").value)||0;
 var c={id:n.id,seq:n.seq,supplierId:sup,article:article,articleName:document.getElementById("cArticleName").value.trim(),po:document.getElementById("cPO").value.trim(),delivery:document.getElementById("cDelivery").value.trim(),batch:document.getElementById("cBatch").value.trim(),deliveryDate:document.getElementById("cDeliveryDate").value,qty:Number(document.getElementById("cQty").value)||0,bad:bad,category:document.getElementById("cCategory").value,issue:issue,priority:document.getElementById("cPriority").value,requested:document.getElementById("cRequested").value,status:"Neu",created:today(),due:document.getElementById("cDue").value,cost:initialCost,attachments:files,history:[{date:today(),text:"Reklamation angelegt"}],d8:{d1:"",d2:issue,d3:"",d4:"",d5:"",d6:"",d7:"",d8:""},internal:{detectedAt:"Wareneingang",owner:state.settings.contact||"Qualitätsmanagement",blockedQty:bad,disposition:"Noch offen",containment:"",stockImpact:"Unklar",lineStop:false},supplierResponse:{acknowledged:false,comment:"",replacementDate:""},costTracking:{claimed:initialCost,status:initialCost>0?"Offen":"Nicht relevant"},effectiveness:{checked:false,note:""}};
 state.complaints.unshift(c);save();closeModal("caseModal");document.getElementById("caseForm").reset();selectedId=c.id;showView("detail");toast("Reklamation "+c.id+" angelegt")}
window.createCase=createCase;

function openEditCase(){var c=current();if(!c)return;document.getElementById("eIssue").value=c.issue;document.getElementById("eDue").value=c.due;document.getElementById("ePriority").value=c.priority;document.getElementById("eCost").value=c.cost||0;document.getElementById("editModal").classList.add("open")}window.openEditCase=openEditCase;
function saveEditCase(){var c=current();if(!c)return;c.issue=document.getElementById("eIssue").value.trim();c.due=document.getElementById("eDue").value;c.priority=document.getElementById("ePriority").value;c.cost=Number(document.getElementById("eCost").value)||0;addHistory(c,"Reklamationsdaten aktualisiert");save();closeModal("editModal");renderDetail();toast("Änderungen gespeichert")}window.saveEditCase=saveEditCase;

function openSupplierModal(){document.getElementById("supplierModal").classList.add("open")}window.openSupplierModal=openSupplierModal;
function createSupplier(){var name=document.getElementById("sName").value.trim();if(!name){alert("Bitte Firmennamen eingeben.");return}state.suppliers.push({id:uid("sup"),name:name,supplierNo:document.getElementById("sNo").value.trim(),contact:document.getElementById("sContact").value.trim(),email:document.getElementById("sEmail").value.trim(),phone:document.getElementById("sPhone").value.trim(),city:document.getElementById("sCity").value.trim()});save();document.getElementById("supplierForm").reset();closeModal("supplierModal");renderSuppliers();toast("Lieferant angelegt")}window.createSupplier=createSupplier;

function renderSettings(){var s=state.settings;document.getElementById("setCompany").value=s.company||"";document.getElementById("setContact").value=s.contact||"";document.getElementById("setEmail").value=s.email||"";document.getElementById("setPrefix").value=s.prefix||"REK";document.getElementById("setDue").value=s.defaultDueDays||5;document.getElementById("setReminder").value=s.reminderDays||2}
function saveSettings(){state.settings.company=document.getElementById("setCompany").value.trim();state.settings.contact=document.getElementById("setContact").value.trim();state.settings.email=document.getElementById("setEmail").value.trim();state.settings.prefix=document.getElementById("setPrefix").value.trim()||"REK";state.settings.defaultDueDays=Number(document.getElementById("setDue").value)||5;state.settings.reminderDays=Number(document.getElementById("setReminder").value)||2;save();toast("Einstellungen gespeichert")}window.saveSettings=saveSettings;

function exportData(){var blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="reklaflow-backup-"+today()+".json";a.click();URL.revokeObjectURL(url)}window.exportData=exportData;
function importData(input){var file=input.files&&input.files[0];if(!file)return;var r=new FileReader();r.onload=function(){try{var data=JSON.parse(r.result);if(!data.complaints||!data.suppliers)throw new Error("Ungültige Datei");state=data;save();renderAll();toast("Backup importiert")}catch(e){alert("Backup konnte nicht gelesen werden.")}input.value=""};r.readAsText(file)}window.importData=importData;
function resetDemo(){if(!confirm("Demo-Daten wirklich zurücksetzen?"))return;state=seed();migrate();save();renderAll();showView("dashboard");toast("Demo zurückgesetzt")}window.resetDemo=resetDemo;

function copySupplierLink(){
 var c=current();if(!c)return;var url=location.href.split("?")[0].split("#")[0]+"?portal="+encodeURIComponent(c.id);
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){toast("Lieferantenlink kopiert")})}else{prompt("Lieferantenlink:",url)}
}window.copySupplierLink=copySupplierLink;

function toast(msg){var t=document.getElementById("toast");t.textContent=msg;t.style.opacity="1";t.style.transform="translateY(0)";clearTimeout(window.__toast);window.__toast=setTimeout(function(){t.style.opacity="0";t.style.transform="translateY(8px)"},2200)}

function renderAll(){renderDashboard();renderComplaints();renderSuppliers();render8DList();renderAnalytics();renderSettings()}
function init(){
 load();
 document.querySelectorAll("[data-view]").forEach(function(b){b.addEventListener("click",function(){showView(b.getAttribute("data-view"))})});
 renderAll();
 var params=new URLSearchParams(location.search),portal=params.get("portal");if(portal&&state.complaints.some(function(c){return c.id===portal})){selectedId=portal;showView("portal")}else showView("dashboard");
}
document.addEventListener("DOMContentLoaded",init);
})();
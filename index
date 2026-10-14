<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>دار الأثاث - 58 ولاية</title>
<link rel="manifest" href="manifest.json"><meta name="theme-color" content="#b8935f">
</head>
<body style="font-family:system-ui;background:#faf8f3;margin:0">
<div style="background:#fff;padding:15px;box-shadow:0 2px 10px rgba(0,0,0,.1);position:sticky;top:0"><b style="color:#b8935f;font-size:20px">🏠 دار الأثاث - 58 ولاية</b></div>
<div id="wilayas" style="display:flex;overflow-x:auto;gap:8px;padding:10px"></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:15px"></div>
<div onclick="let c=prompt('بوت: اكتب حول محل 5 إلى 20'); if(c) alert('تم: '+c)" style="position:fixed;bottom:15px;left:15px;right:15px;background:#b8935f;color:#fff;padding:14px;border-radius:25px;text-align:center">💬 بوت دار الأثاث</div>
<script>
const W=["أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة","تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل","سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة","وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي","خنشلة","سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تموشنت","غرداية","غليزان","تيميمون","برج باجي مختار","أولاد جلال","بني عباس","عين صالح","عين قزام","تقرت","جانت","المغير","المنيعة"];
document.getElementById('wilayas').innerHTML=W.map((w,i)=>`<span style="background:#fff;border:1px solid #b8935f;color:#b8935f;padding:6px 12px;border-radius:20px;white-space:nowrap;font-size:12px">${i+1}.${w}</span>`).join('');
fetch('api/products.json').then(r=>r.json()).then(d=>{document.getElementById('grid').innerHTML=d.slice(0,20).map(p=>`<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)"><img src="${p.image}" style="width:100%;height:120px;object-fit:cover"><div style="padding:8px"><div style="font-size:13px">${p.title}</div><b style="color:#b8935f">${p.price} دج</b><br><small>${p.wilaya}</small></div></div>`).join('')});
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
</script></body></html>

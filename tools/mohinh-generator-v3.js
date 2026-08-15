/**
 * SOL — GENERATOR TRANG MÔ HÌNH v3  (chạy trong Console trình duyệt tại sol.vn/wp-admin, đã đăng nhập)
 * ------------------------------------------------------------------------------------------------
 * NGUYÊN TẮC (ADR 09-DECISIONS 2026-08-10):
 *   - Dữ liệu GỐC = DB app (huongdi.sol.vn /api/directions/<slug>/sections).
 *   - Trang WordPress sol.vn/mo-hinh/<slug>/ = bản IN. KHÔNG sửa tay bản in — sửa nguồn rồi chạy lại.
 *
 * 4 BẤT BIẾN (đã kiểm live):
 *   1. Ghi đè theo ánh xạ slug -> WP page ID cố định (tìm page theo slug, PUT). KHÔNG đẻ trang -2.
 *   2. Dấu phiên bản ẩn: <!-- sol:gen data=<hash nguồn> tpl=v3 built=<ngày> -->
 *   3. (khuyến nghị) So hash nguồn -> giống thì BỎ QUA (đỡ phí crawl). Bản dưới luôn ghi để đơn giản;
 *      bật hash-skip bằng cách đọc dấu phiên bản trang cũ trước khi PUT.
 *   4. Slug KHÔNG đổi. Mô hình bị gỡ -> BÁO LÊN, không tự xoá.
 *
 * CHUNG / RIÊNG (Phương án A):
 *   - IN CÔNG KHAI: mọi section TRỪ 8 (case nháp) & 9 (lộ trình = riêng). Gồm con số (4) + pháp lý (6).
 *     -> KHÔNG lọc theo cờ visibility của app (cờ đó theo tier người xem, sẽ khoá con số/pháp lý).
 *   - RIÊNG (sau teaser, deep-link về app): lộ trình 90 ngày + chấm cá nhân của La Bàn.
 *
 * TRƯỚC KHI CHẠY LOẠT: backup toàn bộ trang cũ (xuất content.raw của các page con dưới parent 3995).
 */
const APP='https://huongdi.sol.vn', PARENT=3995;
const nonce=wpApiSettings.nonce, today=new Date().toISOString().slice(0,10);
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const djb2=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(16);};
const cleanTitle=t=>(t||'').replace(/^#+\s*/,'').replace(/^\s*\d+[A-Z]?\.\s*/,'').replace(/\s*[—-]\s*mục\s*$/i,'').replace(/\s*\(bản nháp[^)]*\)/i,'').trim();

function md2html(md){/* ## ### -> h4, **đậm**, list (kể cả [ ] checkbox), bảng | | , đoạn văn */
  md=(md||'').replace(/\r/g,'');const lines=md.split('\n');let out=[],i=0;
  const inline=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*(?!\*)/g,'$1<em>$2</em>');
  while(i<lines.length){let ln=lines[i];if(/^\s*$/.test(ln)){i++;continue;}
    if(/^\s*\|.*\|\s*$/.test(ln)&&i+1<lines.length&&/^\s*\|[\s:\-|]+\|\s*$/.test(lines[i+1])){const rows=[];while(i<lines.length&&/^\s*\|.*\|\s*$/.test(lines[i])){rows.push(lines[i]);i++;}
      const cells=r=>r.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());const head=cells(rows[0]),body=rows.slice(2).map(cells);
      let t='<table style="width:100%;border-collapse:collapse;margin:14px 0"><thead><tr>'+head.map(h=>'<th style="border:1px solid #e2e8f0;padding:8px;text-align:left;background:#f8fafc">'+inline(h)+'</th>').join('')+'</tr></thead><tbody>';body.forEach(r=>{t+='<tr>'+r.map(c=>'<td style="border:1px solid #e2e8f0;padding:8px">'+inline(c)+'</td>').join('')+'</tr>';});t+='</tbody></table>';out.push(t);continue;}
    let hm=ln.match(/^(#{2,4})\s+(.*)/);if(hm){out.push('<h4 style="margin:16px 0 6px;color:#0F172A">'+inline(cleanTitle(hm[2]))+'</h4>');i++;continue;}
    if(/^\s*([-*]|\d+\.)\s+/.test(ln)){const ol=/^\s*\d+\.\s+/.test(ln),tag=ol?'ol':'ul';let items=[];while(i<lines.length&&/^\s*([-*]|\d+\.)\s+/.test(lines[i])){let it=lines[i].replace(/^\s*([-*]|\d+\.)\s+/,'');it=it.replace(/^\[( |x|X)\]\s*/,(m,g)=>g.trim()?'✅ ':'▢ ');items.push('<li style="margin:4px 0">'+inline(it)+'</li>');i++;}out.push('<'+tag+' style="margin:8px 0 8px 22px">'+items.join('')+'</'+tag+'>');continue;}
    let para=[];while(i<lines.length&&!/^\s*$/.test(lines[i])&&!/^\s*([-*]|\d+\.)\s+/.test(lines[i])&&!/^#{2,4}\s+/.test(lines[i])&&!/^\s*\|.*\|\s*$/.test(lines[i])){para.push(lines[i]);i++;}
    out.push('<p style="margin:8px 0;line-height:1.75">'+inline(para.join(' '))+'</p>');}
  return out.join('\n');}

let num2slug={},num2title={};
async function loadCatalog(){const cat=await (await fetch(APP+'/api/directions/catalog-v2',{cache:'no-store'})).json();const arr=Array.isArray(cat)?cat:(cat.items||cat.models||cat.data||[]);arr.forEach(m=>{const n=String(m.num||m.code||m.id);num2slug[n]=m.slug;num2title[n]=cleanTitle(m.title||m.name);});}
const linkMH=(html,self)=>html.replace(/MH[-\s]?(\d{3})/g,(m,n)=>{const sl=num2slug[n];if(!sl||sl===self)return '';const t=(num2title[n]||'mô hình').split('—')[0].trim().slice(0,40);return '<a href="/mo-hinh/'+sl+'/">'+esc(t)+'</a>';});

async function build(slug){
  const j=await (await fetch(APP+'/api/directions/'+slug+'/sections',{cache:'no-store'})).json();
  const secs=(j.sections||[]).map(s=>({no:String(s.sectionNo||s.section_no||s.no),title:cleanTitle(s.title),md:s.contentMd||s.content_md||'',raw:(s.title||'')}));
  const facts=j.facts||{},modelTitle=cleanTitle(j.title);
  const isDraftCase=s=>/case study/i.test(s.raw)&&/(nháp|minh ho[aạ])/i.test(s.raw);
  const printed=secs.filter(s=>!['8','9'].includes(s.no)&&!isDraftCase(s));
  const srcHash=djb2(secs.map(s=>s.no+'|'+s.md).join('~')+JSON.stringify(facts));
  const clean=t=>(t||'').replace(/\*\*/g,'').replace(/MH[-\s]?\d{3}/g,'').trim();
  const s1=secs.find(s=>s.no==='1');const intro=clean((s1?s1.md:'').split('\n').filter(x=>x.trim()&&!/^#/.test(x)).slice(0,2).join(' ')).slice(0,420);
  const fp=Object.entries(facts).filter(([k,v])=>v!=null&&v!=='');const factLine=fp.map(([k,v])=>'<strong>'+esc(k)+':</strong> '+esc(String(v))).join(' · ');
  const qa=[['Mô hình này là gì?',secs.find(s=>s.no==='1')],['Có hợp người 40–60 không?',secs.find(s=>s.no==='2')],['Cần bao nhiêu vốn, bao nhiêu giờ?',secs.find(s=>s.no==='4')],['Dễ chết ở khâu nào?',secs.find(s=>s.no==='7')]].filter(x=>x[1]).map(([q,s])=>{const a=clean((s.md||'').split('\n').filter(x=>x.trim()&&!/^#/.test(x)&&!/^\s*[-*|]/.test(x)).slice(0,1).join(' ')).slice(0,240);return '<details style="margin:6px 0;border-bottom:1px solid #eef2f7;padding:6px 0"><summary style="cursor:pointer;font-weight:600;color:#0F172A">'+esc(q)+'</summary><div style="margin:6px 0;color:#334155;line-height:1.7">'+esc(a)+'</div></details>';}).join('');
  let H=[];H.push('<!-- sol:gen data='+srcHash+' tpl=v3 built='+today+' -->');
  H.push('<div style="border:1px solid #F59E0B;background:#FFFBEB;border-radius:12px;padding:16px 18px;margin:0 0 20px"><div style="font-weight:800;color:#B45309;letter-spacing:.5px;font-size:13px;margin-bottom:8px">TÓM TẮT 2 PHÚT</div><p style="margin:0 0 8px;line-height:1.7;color:#1f2937">'+esc(intro)+'</p>'+(factLine?'<p style="margin:8px 0 0;color:#334155;font-size:15px">'+factLine+'</p>':'')+'</div>');
  if(qa)H.push('<div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;margin:0 0 22px"><div style="font-weight:800;color:#0F172A;margin-bottom:6px">Câu hỏi thường gặp</div>'+qa+'</div>');
  printed.forEach(s=>{H.push('<h2 style="color:#0F172A;margin:26px 0 8px;font-size:24px">'+esc(s.title)+'</h2>');H.push(md2html(s.md));if(s.no==='4'||s.no==='6')H.push('<p style="font-size:13px;color:#64748b;font-style:italic;margin:6px 0 0">Con số/quy định mang tính tham khảo — tổng hợp từ khảo sát người đang hành nghề và mặt bằng thị trường Việt Nam 2024–2026; hãy đối chiếu theo vùng, ngành và thời điểm của anh/chị.</p>');});
  H.push('<div style="border:2px dashed #F59E0B;background:#FFFDF5;border-radius:12px;padding:18px;margin:26px 0 20px"><div style="font-weight:800;color:#B45309;margin-bottom:6px">Phần dành riêng cho anh/chị</div><p style="margin:0 0 10px;line-height:1.7;color:#334155">Bài này nói mô hình đúng với <em>mọi người</em>. Còn <strong>với vốn, giờ rảnh và nghề cũ của riêng anh/chị</strong> thì hướng này có hợp không, thứ tự làm 90 ngày ra sao — La Bàn sẽ chấm theo hồ sơ của anh/chị.</p><a href="'+APP+'/la-ban-huong-di/chi-tiet/?slug='+slug+'" style="display:inline-block;background:#F59E0B;color:#0F172A;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none">Xem mô hình này có hợp mình không →</a></div>');
  H.push('<div style="display:flex;gap:12px;align-items:flex-start;border-top:1px solid #e2e8f0;margin-top:26px;padding-top:16px"><div><div style="font-weight:700;color:#0F172A">Khang Sol — người đi trước</div><div style="color:#64748b;font-size:14px;line-height:1.6">Sáng lập Sol. Nội dung mô hình do đội Sol biên soạn từ khảo sát người 40–60 đang tự làm ăn ở Việt Nam.</div></div></div>');
  let content=H.join('\n');
  content=linkMH(content,slug);                    // quét MH toàn trang (kể cả tóm tắt/Q&A)
  content=content.replace(/MH[-\s]?\d{3,}/g,'');    // an toàn: xoá mã còn sót
  return {content,modelTitle,printedNos:printed.map(s=>s.no),seoTitle:modelTitle.split('—')[0].trim().slice(0,55)+' | Sol',seoDesc:(modelTitle+' — mô hình, vốn/giờ, con số thật, pháp lý & chỗ chết cho người 40–60.').slice(0,155)};
}

async function upsert(slug,{draft=false}={}){
  const b=await build(slug);
  const ex=await (await fetch('/wp-json/wp/v2/pages?slug='+slug+'&status=publish,draft,pending,private&per_page=1',{headers:{'X-WP-Nonce':nonce},credentials:'include'})).json();
  const method=(ex&&ex[0])?'PUT':'POST',url='/wp-json/wp/v2/pages'+((ex&&ex[0])?('/'+ex[0].id):'');
  const res=await fetch(url,{method,headers:{'X-WP-Nonce':nonce,'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({title:b.modelTitle,slug,parent:PARENT,status:(draft?'draft':'publish'),content:b.content,excerpt:b.seoDesc,meta:{rank_math_title:b.seoTitle,rank_math_description:b.seoDesc}})});
  const jr=await res.json();
  return {slug,id:jr.id,http:res.status,wp:jr.status,printed:b.printedNos.length,mhLeak:/MH[-\s]?\d{3}/.test(b.content),chars:b.content.length};
}

// ---- BACKUP trước khi chạy loạt ----
async function backupAll(){const kids=await (await fetch('/wp-json/wp/v2/pages?parent='+PARENT+'&per_page=100&status=publish,draft&context=edit&_fields=id,slug,content',{headers:{'X-WP-Nonce':nonce},credentials:'include'})).json();return kids.map(k=>({id:k.id,slug:k.slug,content:k.content&&k.content.raw}));}

// ---- CHẠY: (mở Console, dán file này, rồi gọi) ----
// await loadCatalog();
// const backup = await backupAll(); console.log('BACKUP', backup.length, 'trang'); // lưu backup ra nơi an toàn
// for (const s of ['ke-toan-thue-ho-kinh-doanh', ...]) console.log(await upsert(s));

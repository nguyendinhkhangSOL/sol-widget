/**
 * SOL — GENERATOR TRANG MÔ HÌNH v4  (chạy trong Console trình duyệt tại sol.vn/wp-admin, đã đăng nhập)
 * ------------------------------------------------------------------------------------------------
 * v4 sửa 6 lỗi so với v3 (nghiệm thu 2026-08-11, theo review của Khang):
 *   1. Q&A không còn trống — câu "vốn/giờ" lấy từ FACTS; câu khác lấy câu văn thật (firstProse).
 *   2. Không in tên biến facts — format thành "20 – 60 triệu", bỏ riskScore/aiImpactScore.
 *   3. Không lặp heading — stripLead() cắt dòng heading đầu trong body section.
 *   4. Tóm tắt sạch — firstProse() bỏ nhãn "**Là:**", bullet, bảng, blockquote.
 *   5. Link nội bộ KHÔNG cắt cứng 40 ký tự — dùng tên đầy đủ (trước "—"/":").
 *   6. Có H1 (tiêu đề ngắn) đầu bài; tiêu đề ngắn ≤55 ký tự (bỏ tiêu đề 88 ký tự).
 *   + Bỏ hẳn claim "khảo sát"; giữ ảnh hero (đọc từ featured media).
 *
 * NGUYÊN TẮC & 4 BẤT BIẾN: xem 09-DECISIONS. Ghi đè theo pageId (không đẻ trang -2 — đã nghiệm thu 12 = 12).
 * CHUNG/RIÊNG (Phương án A): in mọi section TRỪ 8 (case nháp) & 9 (lộ trình=riêng); gồm con số (4)+pháp lý (6).
 * ĐỘ DÀY: chỉ mở index mô hình đủ dày (≈3000 chữ, 5 bảng). Mô hình mỏng → để trong sol-mohinh-noindex.php.
 */
const APP='https://huongdi.sol.vn', PARENT=3995, nonce=wpApiSettings.nonce, today=new Date().toISOString().slice(0,10);
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const djb2=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(16);};

// ---- FACTS: format số, bỏ key nội bộ ----
function vnd(n){n=Number(n);if(!isFinite(n)||!n)return'';if(n>=1e9){let v=n/1e9;return (v%1?v.toFixed(1):v)+' tỷ';}if(n>=1e6){let v=n/1e6;return (v%1?v.toFixed(1):v)+' triệu';}return n.toLocaleString('vi-VN')+' đ';}
function rsu(a,b){a=Number(a);b=Number(b);if(a&&b){if(a>=1e6&&b>=1e6&&a<1e9&&b<1e9){const x=a/1e6,y=b/1e6;return (x%1?x.toFixed(1):x)+' – '+(y%1?y.toFixed(1):y)+' triệu';}return vnd(a)+' – '+vnd(b);}return a?('từ '+vnd(a)):(b?('đến '+vnd(b)):'');}
function factLine(f){if(!f)return'';const p=[];const c=rsu(f.capitalMinVnd,f.capitalMaxVnd);if(c)p.push('<strong>Vốn khởi động:</strong> '+c);const i=rsu(f.incomeMinVnd,f.incomeMaxVnd);if(i)p.push('<strong>Thu nhập/tháng (tham khảo):</strong> '+i);if(f.ttrMinMonths||f.ttrMaxMonths)p.push('<strong>Hoà vốn:</strong> '+(f.ttrMinMonths||'')+(f.ttrMaxMonths?('–'+f.ttrMaxMonths):'')+' tháng');return p.join(' · ');}
function factsAns(f){const p=[];const c=rsu(f.capitalMinVnd,f.capitalMaxVnd);if(c)p.push('vốn khởi động khoảng '+c);if(f.ttrMinMonths||f.ttrMaxMonths)p.push('hoà vốn trong '+(f.ttrMinMonths||'')+(f.ttrMaxMonths?('–'+f.ttrMaxMonths):'')+' tháng');const i=rsu(f.incomeMinVnd,f.incomeMaxVnd);if(i)p.push('thu nhập tham khảo '+i+'/tháng');return p.length?(p.join('; ').replace(/^./,x=>x.toUpperCase())+'. Con số thay đổi theo vùng và cách làm.'):'';}

// ---- TEXT: cắt heading lặp + lấy câu văn thật ----
function stripLead(md){return (md||'').replace(/^\s*#{1,6}\s+.*(\n|$)/,'');}
function firstProse(md){const L=(md||'').replace(/\r/g,'').split('\n');for(let raw of L){let l=raw.trim();if(!l)continue;if(/^#/.test(l))continue;if(/^\*\*[^*]+:?\*\*\s*$/.test(l))continue;if(/^\|/.test(l))continue;if(/^>/.test(l))continue;l=l.replace(/^[-*]\s+/,'').replace(/^\d+\.\s+/,'');l=l.replace(/^\*\*\s*([^*]+?)\s*:?\s*\*\*\s*:?\s*/,'$1: ');l=l.replace(/\*\*/g,'').replace(/MH[-\s]?\d{3}/g,'').replace(/::/g,':').trim();if(l.length>=25)return l;}return '';}

function md2html(md){md=(md||'').replace(/\r/g,'');const L=md.split('\n');let out=[],i=0;const inline=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*(?!\*)/g,'$1<em>$2</em>');
 while(i<L.length){let ln=L[i];if(/^\s*$/.test(ln)){i++;continue;}
  if(/^\s*\|.*\|\s*$/.test(ln)&&i+1<L.length&&/^\s*\|[\s:\-|]+\|\s*$/.test(L[i+1])){const rows=[];while(i<L.length&&/^\s*\|.*\|\s*$/.test(L[i])){rows.push(L[i]);i++;}const cells=r=>r.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());const hd=cells(rows[0]),bd=rows.slice(2).map(cells);let t='<table style="width:100%;border-collapse:collapse;margin:14px 0"><thead><tr>'+hd.map(h=>'<th style="border:1px solid #e2e8f0;padding:8px;text-align:left;background:#f8fafc">'+inline(h)+'</th>').join('')+'</tr></thead><tbody>';bd.forEach(r=>{t+='<tr>'+r.map(c=>'<td style="border:1px solid #e2e8f0;padding:8px">'+inline(c)+'</td>').join('')+'</tr>';});t+='</tbody></table>';out.push(t);continue;}
  let hm=ln.match(/^(#{2,6})\s+(.*)/);if(hm){out.push('<h3 style="margin:18px 0 6px;color:#0F172A;font-size:19px">'+inline(hm[2].replace(/^\d+[A-Z]?\.\s*/,''))+'</h3>');i++;continue;}
  if(/^\s*([-*]|\d+\.)\s+/.test(ln)){const ol=/^\s*\d+\.\s+/.test(ln),tag=ol?'ol':'ul';let it=[];while(i<L.length&&/^\s*([-*]|\d+\.)\s+/.test(L[i])){let x=L[i].replace(/^\s*([-*]|\d+\.)\s+/,'');x=x.replace(/^\[( |x|X)\]\s*/,(m,g)=>g.trim()?'✅ ':'▢ ');it.push('<li style="margin:4px 0">'+inline(x)+'</li>');i++;}out.push('<'+tag+' style="margin:8px 0 8px 22px">'+it.join('')+'</'+tag+'>');continue;}
  let pa=[];while(i<L.length&&!/^\s*$/.test(L[i])&&!/^\s*([-*]|\d+\.)\s+/.test(L[i])&&!/^#{2,6}\s+/.test(L[i])&&!/^\s*\|.*\|\s*$/.test(L[i])){pa.push(L[i]);i++;}
  out.push('<p style="margin:8px 0;line-height:1.75">'+inline(pa.join(' '))+'</p>');}
 return out.join('\n');}

let n2s={},n2t={};
async function loadCatalog(){const cat=await (await fetch(APP+'/api/directions/catalog-v2',{cache:'no-store'})).json();const arr=Array.isArray(cat)?cat:(cat.items||cat.models||cat.data||[]);arr.forEach(m=>{const n=String(m.num||m.code||m.id);n2s[n]=m.slug;n2t[n]=(m.title||m.name||'').split('—')[0].split(':')[0].trim();});}
function linkMH(html,self){return html.replace(/MH[-\s]?(\d{3})/g,(m,n)=>{const sl=n2s[n];if(!sl||sl===self)return '';return '<a href="/mo-hinh/'+sl+'/">'+esc(n2t[n]||'mô hình')+'</a>';});}

// Tiêu đề NGẮN (≤55 ký tự) cho H1 + <title>. Bổ sung khi làm mô hình mới.
const SHORT={'fractional-manager-sme':'Giám đốc thuê ngoài (Fractional Manager) cho SME','ke-toan-thue-ho-kinh-doanh':'Dịch vụ kế toán – thuế – hóa đơn cho hộ kinh doanh','so-hoa-ai-hoa-ho-kinh-doanh-sme':'Số hoá + AI hoá cho hộ kinh doanh & SME nhỏ','cho-thue-tai-san-nho':'Cho thuê tài sản nhỏ vận hành bằng nền tảng số','freelancer-chuyen-mon':'Freelancer chuyên môn — bán kỹ năng theo dự án','tu-van-doanh-nghiep':'Tư vấn doanh nghiệp cho SME','kinh-doanh-online-1-nguoi':'Kinh doanh online một mình','day-kem-nguoi-lon-theo-ngach':'Dạy kèm người lớn theo ngách','kenh-chia-se-chuyen-mon-nghe-cu':'Kênh chia sẻ chuyên môn nghề cũ trên video','thuc-pham-nha-lam-co-dang-ky':'Thực phẩm nhà làm có đăng ký','sua-chua-bao-tri-nha-theo-goi':'Sửa chữa – bảo trì nhà theo gói','affiliate-marketing-nganh':'Affiliate marketing theo ngách chuyên môn'};

async function heroUrl(pageId){const p=await (await fetch('/wp-json/wp/v2/pages/'+pageId+'?_fields=featured_media',{headers:{'X-WP-Nonce':nonce},credentials:'include'})).json();if(!p.featured_media)return'';const m=await (await fetch('/wp-json/wp/v2/media/'+p.featured_media+'?_fields=source_url',{headers:{'X-WP-Nonce':nonce},credentials:'include'})).json();return m.source_url||'';}

async function build(slug,pageId){
 const j=await (await fetch(APP+'/api/directions/'+slug+'/sections',{cache:'no-store'})).json();
 const secs=(j.sections||[]).map(s=>({no:String(s.sectionNo||s.section_no||s.no),title:(s.title||'').replace(/^\d+[A-Z]?\.\s*/,'').replace(/\s*[—-]\s*mục\s*$/i,'').trim(),md:s.contentMd||s.content_md||'',raw:(s.title||'')}));
 const f=j.facts||{};const title=SHORT[slug]||(j.title||'').split('—')[0].trim();
 const dc=s=>/case study/i.test(s.raw)&&/(nháp|minh ho[aạ])/i.test(s.raw);
 const printed=secs.filter(s=>!['8','9'].includes(s.no)&&!dc(s));
 const S=no=>secs.find(x=>x.no===no);
 const intro=firstProse((S('1')||{}).md);
 const qr=[['Mô hình này là gì?',firstProse((S('1')||{}).md)],['Mô hình này có hợp người 40–60 không?',firstProse((S('2')||{}).md)],['Cần bao nhiêu vốn, bao nhiêu giờ?',factsAns(f)],['Dễ chết ở khâu nào?',firstProse((S('7')||{}).md)]].filter(x=>x[1]&&x[1].length>10);
 const qa=qr.map(([q,a])=>'<details style="margin:6px 0;border-bottom:1px solid #eef2f7;padding:6px 0"><summary style="cursor:pointer;font-weight:600;color:#0F172A">'+esc(q)+'</summary><div style="margin:6px 0;color:#334155;line-height:1.7">'+esc(a)+'</div></details>').join('');
 const hero=pageId?await heroUrl(pageId):'';
 let H=[];H.push('<!-- sol:gen data='+djb2(secs.map(s=>s.no+'|'+s.md).join('~')+JSON.stringify(f))+' tpl=v4 built='+today+' -->');
 if(hero)H.push('<figure class="sol-hero-cover" style="margin:0 0 18px"><img src="'+hero+'" alt="'+esc(title)+'" style="width:100%;height:auto;border-radius:14px" loading="eager"/></figure>');
 H.push('<h1 style="font-size:32px;line-height:1.25;color:#0F172A;margin:0 0 16px;font-weight:800">'+esc(title)+'</h1>');
 H.push('<div style="border:1px solid #F59E0B;background:#FFFBEB;border-radius:12px;padding:16px 18px;margin:0 0 20px"><div style="font-weight:800;color:#B45309;letter-spacing:.5px;font-size:13px;margin-bottom:8px">TÓM TẮT 2 PHÚT</div><p style="margin:0 0 8px;line-height:1.7;color:#1f2937">'+esc(intro)+'</p>'+(factLine(f)?'<p style="margin:8px 0 0;color:#334155;font-size:15px">'+factLine(f)+'</p>':'')+'</div>');
 if(qa)H.push('<div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;margin:0 0 22px"><div style="font-weight:800;color:#0F172A;margin-bottom:6px">Câu hỏi thường gặp</div>'+qa+'</div>');
 printed.forEach(sec=>{H.push('<h2 style="color:#0F172A;margin:26px 0 8px;font-size:24px">'+esc(sec.title)+'</h2>');H.push(linkMH(md2html(stripLead(sec.md)),slug));if(sec.no==='4'||sec.no==='6')H.push('<p style="font-size:13px;color:#64748b;font-style:italic;margin:6px 0 0">Con số/quy định mang tính tham khảo — tổng hợp từ tư liệu thị trường Việt Nam 2024–2026 và kinh nghiệm người đi trước; hãy đối chiếu theo vùng, ngành và thời điểm của anh/chị.</p>');});
 H.push('<div style="border:2px dashed #F59E0B;background:#FFFDF5;border-radius:12px;padding:18px;margin:26px 0 20px"><div style="font-weight:800;color:#B45309;margin-bottom:6px">Phần dành riêng cho anh/chị</div><p style="margin:0 0 10px;line-height:1.7;color:#334155">Bài này nói mô hình đúng với <em>mọi người</em>. Còn <strong>với vốn, giờ rảnh và nghề cũ của riêng anh/chị</strong> thì hướng này có hợp không, thứ tự làm 90 ngày ra sao — La Bàn sẽ chấm theo hồ sơ của anh/chị.</p><a href="'+APP+'/la-ban-huong-di/chi-tiet/?slug='+slug+'" style="display:inline-block;background:#F59E0B;color:#0F172A;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none">Xem mô hình này có hợp mình không →</a></div>');
 H.push('<div style="display:flex;gap:12px;align-items:flex-start;border-top:1px solid #e2e8f0;margin-top:26px;padding-top:16px"><div><div style="font-weight:700;color:#0F172A">Đội Sol biên soạn</div><div style="color:#64748b;font-size:14px;line-height:1.6">Nội dung mô hình dựa trên kinh nghiệm người đi trước và tư liệu thị trường Việt Nam — cập nhật liên tục.</div></div></div>');
 let c=H.join('\n');c=c.replace(/MH[-\s]?\d{3,}/g,'');
 return {content:c,title,seoTitle:title.slice(0,55)+' | Sol',seoDesc:(title+' — mô hình, vốn/giờ, con số thật, pháp lý & chỗ chết cho người 40–60.').slice(0,155)};
}

// Ghi đè theo pageId cố định (giữ featured/hero). Trả về status.
async function upsertById(slug,pageId){const b=await build(slug,pageId);
 const r=await fetch('/wp-json/wp/v2/pages/'+pageId,{method:'POST',headers:{'X-WP-Nonce':nonce,'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({title:b.title,content:b.content,excerpt:b.seoDesc,meta:{rank_math_title:b.seoTitle,rank_math_description:b.seoDesc}})});
 return {slug,pageId,http:r.status};}

// ---- CHẠY ----
// await loadCatalog();
// const kids=await (await fetch('/wp-json/wp/v2/pages?parent='+PARENT+'&per_page=100&status=publish&_fields=id,slug',{headers:{'X-WP-Nonce':nonce},credentials:'include'})).json();
// for(const k of kids) console.log(await upsertById(k.slug,k.id));

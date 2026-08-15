# EOD WRAP — 2026-07-29 · Chat-Memory + Rà soát trang chủ

> Mục đích: chốt phiên để **phục hồi được**. Đọc file này là nắm đủ context để deploy/rollback.

---

## 1. TÓM TẮT PHIÊN
Hai việc chính:
1. **Rà soát trang chủ khớp hệ thống** (audit honesty) — sửa lại vài chỗ copy cho đúng thực tế.
2. **Xây Lớp trí nhớ NỘI DUNG CHAT** (chat-memory) cho Sol Đồng Hành — moat sâu hơn, giữ token rẻ.

---

## 2. ĐÍNH CHÍNH QUAN TRỌNG (đọc code thật)
Phiên trước từng kết luận "thẻ nhớ chưa build" — **SAI**. Đọc `sol-dong-hanh.ts` + `memory.ts`:
- Trí nhớ **hồ sơ** (Lớp 2/3) ĐÃ build + ĐÃ nối chat + tối ưu token (nạp `getBusinessMemory` vào systemPrompt dòng ~260; `refreshBusinessMemory` chạy nền dòng ~369; kiểm soát token: 10 lượt gần nhất + model rẻ mặc định + trần chi phí/tháng).
- → Đã đưa lại câu "La Bàn nhớ anh chị" (đúng sự thật) trên trang chủ.

## 3. TRANG CHỦ (sol-landing-full.html → index.html hosting)
Các sửa trong phiên (đã có trên file, **CẦN redeploy index.html** vì làm sau lần đẩy gần nhất):
- Thẻ 🧾 "giấy tờ": mô tả đúng mức trợ lý soạn nháp, tham chiếu **kho 42 prompt văn phòng**.
- Thẻ 📚 câu hỏi: làm mềm "đang mở rộng dần cho từng mô hình" (thực tế 8/64).
- Thẻ 💬 + FAQ trí nhớ: giữ bản mạnh-đúng-sự-thật.
- Giá động đọc từ `/api/config/facts` (đã xác minh whitelist, CORS OK, chỉ đọc).

## 4. CHAT-MEMORY — ĐÃ BUILD (chưa deploy)
Nhớ **những gì đã trò chuyện** (đã thử gì, lo gì, quyết định gì), không chỉ hồ sơ.
Nguyên tắc giữ rẻ: tóm tắt **lũy tiến** + **debounce ~6 tin** + **Gemini Flash** + best-effort.

**File đụng tới:**
| File | Thay đổi |
|---|---|
| `prisma/seeds/30-chat-memory.sql` | MỚI — thêm cột `chat_summary`, `chat_summary_at` (IF NOT EXISTS) |
| `src/services/chat-memory.ts` | MỚI — `maybeRefreshChatMemory()` tóm tắt lũy tiến |
| `src/services/memory.ts` | `getBusinessMemory()` trả thêm `chatMemory` (đọc tách, không gãy nếu chưa migrate) |
| `src/routes/sol-dong-hanh.ts` | import + inject `chatMemory` vào prompt + gọi `maybeRefreshChatMemory` nền |
| `prisma/seeds/DEPLOY-30-chat-memory.md` | MỚI — 4 bước deploy + núm chỉnh + rollback |

**Test:** harness logic 13/13 pass (debounce, watermark, lũy tiến, model lỗi giữ nguyên, tắt được, không crash).
`tsc` không chạy được trong sandbox (npm registry chặn E403) — code bám sát 1:1 route production.

**Núm chỉnh (app_config):** `ai_chat_memory_every` (mặc định 6; 0=tắt) · `ai_chat_memory_model` (trống=Flash).

## 5. TRẠNG THÁI DEPLOY
- ✅ **ĐÃ deploy** chat-memory (29/07 ~23:26). Backup DB: `/var/backups/pre-chatmemory-2026-07-29-2255.sql.gz` (699K). Code: git `d163747`.
  - Migration 30 chạy OK (2 cột). Build sạch. `huongdi-api` online, log khởi động sạch, `gemini=true`.
  - Lưu ý deploy: server KHÔNG có git ở `/var/www/huongdi/backend`; deploy backend = **scp file → npm run build → pm2 restart**. Thư mục `src` owner `solop` NHƯNG vài file trong `src/services` thuộc root → phải scp qua `/tmp` rồi `sudo cp` + `sudo chown solop`.
- ⏳ **CẦN redeploy** index.html (các sửa audit + menu mobile + giá động).

## 5b. 🐞 LỖI CŨ PHÁT HIỆN (ưu tiên vá ở Việc #2)
Log 28/07: `permission denied for table model_question_sets` (P2010/42501) tại `sol-dong-hanh.ts:117` (endpoint suggested-questions).
→ Bảng `model_question_sets` chưa GRANT cho `huongdi_user` → 8 bộ câu hỏi đã seed KHÔNG đọc được.
→ Vá đầu tiên khi làm #2: `GRANT SELECT ON model_question_sets TO huongdi_user;` (kiểm cả các bảng liên quan).

## 6. BACKUP PHIÊN NÀY (làm TRƯỚC deploy)
```
# DB full (trước migration)
ssh sol-vps "sudo -u postgres pg_dump huongdi_prod | gzip > /var/backups/pre-chatmemory-$(date +%F-%H%M).sql.gz && ls -lh /var/backups/pre-chatmemory-*.sql.gz | tail -1"
# Code = git push (SSOT). Restore DB nếu cần:
# ssh sol-vps "gunzip -c /var/backups/pre-chatmemory-XXXX.sql.gz | sudo -u postgres psql huongdi_prod"
```

## 7. VIỆC TIẾP THEO
1. **Việc #2**: bộ câu hỏi 8→64 + **cơ chế cập nhật** khi đổi hồ sơ mẫu (chưa bắt đầu).
2. Redeploy index.html.
3. (Không khuyến nghị) nhớ sâu hơn nữa = tốn thêm token — bản hiện tại đã đủ.

## 8. KIẾN TRÚC LOCK (nhắc lại)
sol.vn = marketing (WordPress) · huongdi.sol.vn = app (Node + Postgres) · GitHub = SSOT · không trộn 2 tuyến.

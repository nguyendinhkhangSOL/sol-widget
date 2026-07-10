# Backup sol.vn (WordPress) qua cPanel — 3 phút

## 🎯 Backup 2 phần

**1. Files** (`/public_html/`) — WordPress core, themes, plugins, uploads
**2. Database** (MySQL) — Posts, pages, users, options

---

## 📦 Cách 1: Softaculous Backup Wizard (Recommended)

Nếu cPanel có mục **"Softaculous Apps Installer"**:

1. cPanel main → tìm **Softaculous**
2. Click nút **Installations** (biểu tượng danh sách)
3. Tìm WordPress installation của sol.vn
4. Nhấn nút **Backup** (biểu tượng đĩa)
5. Tick:
   - ✅ Backup Directory (files)
   - ✅ Backup Database
6. Click **Backup Installation**
7. Chờ ~2-5 phút → có link download `.tar.gz`

## 📦 Cách 2: cPanel Backup Wizard

Nếu Softaculous không có:

1. cPanel main → tìm **"Backup"** hoặc **"Backup Wizard"**
2. Click **Backup Wizard** → **Back Up** → chọn:
   - **Home Directory** (files)
   - **MySQL Databases** (chọn DB của sol.vn)
3. Click **Generate Backup**
4. Chờ email thông báo hoặc check `/home/user/backups/`

## 📦 Cách 3: Manual (nếu 2 cách trên không có)

### Files backup:

1. cPanel → **File Manager**
2. Vào `/public_html/`
3. **Select All** → nút **Compress** (toolbar)
4. Chọn format `.zip` hoặc `.tar.gz`
5. Save vào `/home/user/` hoặc download về máy

### DB backup:

1. cPanel → **phpMyAdmin**
2. Chọn DB của sol.vn (thường có prefix như `qbsigblp_wp_xxx`)
3. Tab **Export**
4. Method: **Quick** — Format: **SQL**
5. Click **Go** → download file `.sql`

---

## ✅ Verify backup

Sau khi backup xong, anh cần có:
- ✅ 1 file `.tar.gz` hoặc `.zip` chứa `public_html/` (~200-500 MB)
- ✅ 1 file `.sql` DB (~5-50 MB)
- ✅ Lưu trên máy anh (Google Drive, Dropbox, hoặc external HDD)

---

## 🔄 Cách restore (nếu cần rollback)

**Restore Files:**
- Upload lại `.tar.gz` vào `/public_html/`
- Extract → confirm overwrite

**Restore DB:**
- cPanel → phpMyAdmin → chọn DB → **Import** → chọn file `.sql`
- Click **Go**

---

## 📝 Note quan trọng

- **Đừng xóa backup file cũ** — giữ ít nhất 3 backups gần nhất
- **Test restore trên staging** trước khi restore production
- Backup **mỗi tuần** hoặc **trước mỗi lần deploy lớn**

---

## 🚀 Sau khi backup xong

Báo em confirm:
- "Backup sol.vn xong, file size X MB"

Em sẽ start Phase 1 Bước 4 Roadmap.

# Lì Xì Consultant

Trang bốc lì xì dành riêng cho tư vấn viên — sau buổi tư vấn, TV sẽ đưa mã bảo vệ cho học viên để bốc lì xì giảm học phí.

## Tính năng
- 🔐 Mã bảo vệ 6 ký tự (ngẫu nhiên, không logic)
- 🧧 100 bao lì xì — tất cả đều có voucher giảm giá
- 💰 Giá trị: 500K → 3 triệu
- 🎉 Animation sinh động: hoa rơi, confetti, envelope flip

## Setup

### 1. Tạo Supabase Project mới
- Vào [supabase.com](https://supabase.com) → New Project
- Copy URL và Anon Key vào `.env.local`

### 2. Chạy SQL Schema
- Mở Supabase SQL Editor
- Paste nội dung file `supabase_consultant_schema.sql`
- Chạy toàn bộ → sẽ tự tạo tables, RPCs, và 100 mã bảo vệ

### 3. Cài đặt & chạy
```bash
npm install
npm run dev
```

### 4. Tạo thêm mã bảo vệ
Trong Supabase SQL Editor:
```sql
-- Tạo 50 mã mới
SELECT * FROM generate_consultant_codes(50);

-- Xem tất cả mã chưa dùng
SELECT code FROM consultant_codes WHERE is_used = false;
```

### 5. Deploy lên Vercel
```bash
git init
git add .
git commit -m "Initial commit"
# Tạo repo mới trên GitHub → push → connect Vercel
```

## Phân phối giải thưởng
| Giá trị | Số lượng |
|---|---|
| 3.000.000đ | 1 |
| 2.000.000đ | 3 |
| 1.500.000đ | 5 |
| 1.000.000đ | 8 |
| 800.000đ | 12 |
| 500.000đ | 71 |

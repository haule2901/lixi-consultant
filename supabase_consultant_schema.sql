-- ====================================================
-- LÌ XÌ CONSULTANT — SUPABASE SCHEMA
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- ====================================================
-- ====================================================
-- BƯỚC 1: Bảng mã bảo vệ (consultant tạo trước)
-- ====================================================
CREATE TABLE public.consultant_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    used_by UUID,
    used_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT false
);
ALTER TABLE public.consultant_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view codes" ON public.consultant_codes FOR
SELECT TO anon USING (true);
CREATE POLICY "Allow update codes" ON public.consultant_codes FOR
UPDATE TO anon USING (true);
-- ====================================================
-- BƯỚC 2: Bảng leads (thông tin học viên)
-- ====================================================
CREATE TABLE public.lixi_consultant_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    concern TEXT,
    prize_id TEXT,
    consultant_code TEXT REFERENCES consultant_codes(code)
);
ALTER TABLE public.lixi_consultant_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow inserts" ON public.lixi_consultant_leads FOR
INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow updates" ON public.lixi_consultant_leads FOR
UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow reads" ON public.lixi_consultant_leads FOR
SELECT TO anon USING (true);
-- ====================================================
-- BƯỚC 3: Bảng slots (100 phong bì)
-- ====================================================
CREATE TABLE public.lixi_consultant_slots (
    slot_number INT PRIMARY KEY,
    prize_id TEXT NOT NULL,
    claimed_by UUID,
    claimed_at TIMESTAMPTZ
);
ALTER TABLE public.lixi_consultant_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view slots" ON public.lixi_consultant_slots FOR
SELECT TO anon USING (true);
CREATE POLICY "Allow claim via RPC" ON public.lixi_consultant_slots FOR
UPDATE TO anon USING (true);
-- ====================================================
-- BƯỚC 4: Hàm khởi tạo 100 slot với phân phối giải mới
-- Chạy 1 lần trước khi event bắt đầu
-- ====================================================
CREATE OR REPLACE FUNCTION init_consultant_slots() RETURNS void AS $$
DECLARE prizes TEXT [] := ARRAY [
        -- 1x 3.000.000đ (1%)
        'v_3m',
        -- 3x 2.000.000đ (3%)
        'v_2m', 'v_2m', 'v_2m',
        -- 5x 1.500.000đ (5%)
        'v_1m5', 'v_1m5', 'v_1m5', 'v_1m5', 'v_1m5',
        -- 8x 1.000.000đ (8%)
        'v_1m', 'v_1m', 'v_1m', 'v_1m', 'v_1m', 'v_1m', 'v_1m', 'v_1m',
        -- 12x 800.000đ (12%)
        'v_800k', 'v_800k', 'v_800k', 'v_800k', 'v_800k', 'v_800k',
        'v_800k', 'v_800k', 'v_800k', 'v_800k', 'v_800k', 'v_800k',
        -- 71x 500.000đ (71%)
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k', 'v_500k',
        'v_500k'
    ];
shuffled TEXT [];
BEGIN
SELECT array_agg(
        p
        ORDER BY random()
    ) INTO shuffled
FROM unnest(prizes) p;
DELETE FROM lixi_consultant_slots;
FOR i IN 1..100 LOOP
INSERT INTO lixi_consultant_slots (slot_number, prize_id)
VALUES (i, shuffled [i]);
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Chạy hàm khởi tạo ngay
SELECT init_consultant_slots();
-- ====================================================
-- BƯỚC 5: RPC claim slot (atomic)
-- ====================================================
CREATE OR REPLACE FUNCTION claim_consultant_slot(p_slot_number INT, p_lead_id UUID) RETURNS TABLE(prize_id TEXT, success BOOLEAN) AS $$
DECLARE v_prize TEXT;
BEGIN
UPDATE lixi_consultant_slots
SET claimed_by = p_lead_id,
    claimed_at = now()
WHERE lixi_consultant_slots.slot_number = p_slot_number
    AND claimed_by IS NULL
RETURNING lixi_consultant_slots.prize_id INTO v_prize;
IF v_prize IS NOT NULL THEN
UPDATE lixi_consultant_leads
SET prize_id = v_prize
WHERE id = p_lead_id;
RETURN QUERY
SELECT v_prize,
    true;
ELSE RETURN QUERY
SELECT ''::TEXT,
    false;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ====================================================
-- BƯỚC 6: RPC validate mã bảo vệ
-- ====================================================
CREATE OR REPLACE FUNCTION validate_consultant_code(p_code TEXT) RETURNS TABLE(valid BOOLEAN, code_id UUID) AS $$
DECLARE v_id UUID;
BEGIN
SELECT id INTO v_id
FROM consultant_codes
WHERE code = p_code
    AND is_used = false;
IF v_id IS NOT NULL THEN RETURN QUERY
SELECT true,
    v_id;
ELSE RETURN QUERY
SELECT false,
    NULL::UUID;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ====================================================
-- BƯỚC 7: RPC đánh dấu mã đã sử dụng
-- ====================================================
CREATE OR REPLACE FUNCTION mark_code_used(p_code TEXT, p_lead_id UUID) RETURNS void AS $$ BEGIN
UPDATE consultant_codes
SET is_used = true,
    used_by = p_lead_id,
    used_at = now()
WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ====================================================
-- BƯỚC 8: Hàm tạo batch mã bảo vệ
-- Tư vấn viên chạy trực tiếp trong SQL Editor
-- VD: SELECT generate_consultant_codes(50);
-- ====================================================
CREATE OR REPLACE FUNCTION generate_consultant_codes(p_count INT DEFAULT 50) RETURNS TABLE(generated_code TEXT) AS $$
DECLARE chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
new_code TEXT;
i INT;
BEGIN FOR i IN 1..p_count LOOP LOOP new_code := '';
FOR j IN 1..6 LOOP new_code := new_code || substr(
    chars,
    floor(random() * length(chars) + 1)::int,
    1
);
END LOOP;
-- Check uniqueness
EXIT
WHEN NOT EXISTS (
    SELECT 1
    FROM consultant_codes
    WHERE code = new_code
);
END LOOP;
INSERT INTO consultant_codes (code)
VALUES (new_code);
generated_code := new_code;
RETURN NEXT;
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Tạo sẵn 100 mã bảo vệ
SELECT *
FROM generate_consultant_codes(100);
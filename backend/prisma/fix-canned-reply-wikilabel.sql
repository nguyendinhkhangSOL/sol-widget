\set ON_ERROR_STOP on

UPDATE "CannedReply" SET "wikiUrl" = 'https://sol.vn/wiki/lang-tranh-con-them', "wikiLabel" = 'Xem giải thích chi tiết' WHERE slug = 'them-thuoc';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'bo-cuoc';
UPDATE "CannedReply" SET "wikiUrl" = 'https://sol.vn/wiki/hieu-ung-1-dieu', "wikiLabel" = 'Xem nghiên cứu về hiệu ứng 1 điếu' WHERE slug = 'mot-dieu';
UPDATE "CannedReply" SET "wikiUrl" = 'https://sol.vn/wiki/timeline-cai-thuoc', "wikiLabel" = 'Xem timeline đầy đủ' WHERE slug = 'bao-lau-het-them';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'mat-ngu';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'cau-gat';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'tang-can';
UPDATE "CannedReply" SET "wikiUrl" = 'https://sol.vn/wiki/vape-co-an-toan-khong', "wikiLabel" = 'Xem nghiên cứu so sánh vape vs thuốc lá' WHERE slug = 'vape-an-toan';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'them-du-doi';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'sap-hut-lai';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'lo-hut-roi';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'ho-co-dom';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'dau-dau';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'chong-mat';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'kho-tho';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'tao-bon';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'mieng-lo-loet';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'buon-chan';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'co-don';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'lo-au';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'stress-cong-viec';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'khong-la-minh';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'di-nhau';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'ca-phe-sang';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'ban-moi-thuoc';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'vo-chong-gian';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'dam-tang-cuoi';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'tet-le';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'phoi-hoi-phuc';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'tim-mach';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'champix';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'mieng-dan-nicotine';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'khang-tung-cam-thay';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'thanh-cong-toi';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'dang-hi-sinh';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'cach-dung-app';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'doi-q-day';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'hoan-tien';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'lien-he-khang';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'voice-khang';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'khac-mau';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'dau-nguc-du';
UPDATE "CannedReply" SET "wikiUrl" = '', "wikiLabel" = '' WHERE slug = 'y-nghi-tu-hai';

-- Verify
SELECT slug, "wikiLabel" FROM "CannedReply" WHERE "wikiLabel" IS NOT NULL AND "wikiLabel" != '' ORDER BY slug LIMIT 8;

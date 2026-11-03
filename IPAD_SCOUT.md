# Tim iPad tai Nhat Ban

Admin co hai trang:

- `/admin/scout/rules`: quan ly may can tim, loi can tranh, gia toi da (JPY), nhap Excel `.xlsx`.
- `/admin/scout/results`: xem tin tim duoc, xem link goc, danh dau quan tam/bo qua, bam **Tim ngay**.

File Excel can dong tieu de `Ma may`, `Gia toi da JPY`. Co the them `Tu khoa`, `Loi can tranh` (hoac header tieng Anh `Model`, `Max price JPY`, `Query`, `Avoid defects`). Gia la yen Nhat, khong phai VND. Moi lan nhap tao them dong, khong ghi de dong cu.

Moi luot job quet toi da 30 tieu chi dang bat. Neu co nhieu hon 30, job luan phien qua cac luot ke tiep; thoi gian quay lai mot ma may se dai hon 30 phut.

## Cau hinh server

Dat cac bien sau trong `server/.env` khi chay local hoac Render Environment:

```env
YAHOO_JP_CLIENT_ID=...
OPENAI_API_KEY=...
OPENAI_SCOUT_MODEL=gpt-4o-mini
ENABLE_IPAD_SCOUT=false
CRON_SECRET=...
DISCORD_WEBHOOK_URL=...
```

`YAHOO_JP_CLIENT_ID`: tao ung dung tai [Yahoo! Developer Network](https://developer.yahoo.co.jp/). `OPENAI_API_KEY`: tao key trong [OpenAI API Platform](https://platform.openai.com/api-keys). Hai key chi dat o server, khong dat trong `VITE_` hoac commit vao Git. Tai khoan dang nhap ChatGPT khong phai API key; chi phi API tinh rieng. Discord webhook da duoc server dung cho don hang, co the dung lai de bao tin iPad.

Nguon hien duoc tu dong hoa la API Yahoo! Shopping, loc hang `used`, con hang, gia khong vuot gioi han. API nay khong co thoi diem dang tin de sap xep theo tin vua dang; ket qua moi duoc luu theo *thoi diem phat hien*. AI chi danh gia ten va mo ta do API tra ve. Can mo tin goc de xac minh tinh trang, gia va kha nang mua truoc khi giao dich. PayPay Flea, Rakuten, Mercari chua duoc ket noi vao job.

## Lich 30 phut

GitHub Actions workflow `.github/workflows/ipad-scout.yml` goi endpoint moi phut 7 va 37. Trong repository Settings -> Secrets and variables -> Actions:

1. Tao variable `SCOUT_API_URL` bang URL server Render, vi du `https://your-service.onrender.com`.
2. Tao secret `CRON_SECRET` giong gia tri `CRON_SECRET` tren Render.
3. De `ENABLE_IPAD_SCOUT=false` khi dung GitHub Actions de tranh hai scheduler goi cung luc.

GitHub Actions scheduled workflow co the tre hoac bi bo qua luc he thong ban. Render Free ngu khi khong co request; lan goi dau co the mat thoi gian khoi dong. De server chay lien tuc va lich on dinh hon, nang Render web service len goi khong ngu va dat `ENABLE_IPAD_SCOUT=true`; khi do co the tat workflow GitHub Actions. Render Cron Job la mot lua chon khac co phi rieng.

Moi lan chay co khoa Firestore ngan chay trung va chi gui Discord cho tin moi. Ket qua duoc luu Firestore, khong mat khi server restart.

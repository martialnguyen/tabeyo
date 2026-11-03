# Tìm iPad tại Nhật Bản

Trang quản trị có hai màn hình:

- `/admin/scout/rules`: thêm, sửa, xóa máy cần tìm; nhập Excel `.xlsx`.
- `/admin/scout/results`: xem tin, mở link gốc, đánh dấu quan tâm/bỏ qua và bấm **Tìm ngay**.

File Excel cần có cột `Mã máy` và `Giá tối đa JPY`; có thể thêm `Từ khóa`, `Lỗi cần tránh`. Mỗi lần nhập sẽ thêm dòng mới. Job quét tối đa 30 tiêu chí đang bật mỗi lượt; nếu nhiều hơn, các tiêu chí được luân phiên.

## Nguồn dữ liệu

Job đọc trang tìm kiếm và trang sản phẩm **Rakuten công khai**, không đăng nhập và không cần `YAHOO_JP_CLIENT_ID`. Nó lọc giá, tên máy và một số lỗi rõ ràng trong mô tả tiếng Nhật (ví dụ: máy lỗi, ố/vỡ màn, điểm trắng, khóa iCloud). Không có OpenAI API key, kết quả được gắn **Cần kiểm tra** và không gửi Discord như tin đạt chuẩn. Đây là tin cần người mua mở trang gốc để xác minh.

Nếu đặt `OPENAI_API_KEY`, job gửi tên và mô tả tin tới OpenAI để đánh giá chặt hơn. Chỉ tin được AI xác nhận mới gắn **Đạt tiêu chí** và gửi Discord. API key là của OpenAI API Platform, khác với tài khoản đăng nhập ChatGPT và có phí riêng. Luôn kiểm tra lại tình trạng, giá và còn hàng trước khi mua.

PayPay Flea hiện trả HTTP 404 khi server này truy cập tự động trang tìm kiếm; Mercari chưa có bộ trích xuất dữ liệu ổn định trong job. Không được ghi chúng là nguồn đã quét. Rakuten không cung cấp thời điểm đăng tin trong dữ liệu đọc được, nên bảng chỉ ghi *thời điểm phát hiện*, không bảo đảm tin vừa đăng.

## Cấu hình server

Trong `server/.env` hoặc Render Environment:

```env
# Không bắt buộc nếu chỉ cần danh sách tin để tự kiểm tra
OPENAI_API_KEY=
OPENAI_SCOUT_MODEL=gpt-4o-mini
ENABLE_IPAD_SCOUT=false
CRON_SECRET=...
DISCORD_WEBHOOK_URL=...
```

Không đưa API key hoặc webhook lên Git. `DISCORD_WEBHOOK_URL` dùng chung với thông báo đơn hàng hiện có.

## Lịch 30 phút

Workflow `.github/workflows/ipad-scout.yml` gọi server vào phút 7 và 37. Trong GitHub repository Settings -> Secrets and variables -> Actions:

1. Tạo variable `SCOUT_API_URL` là URL Render, ví dụ `https://your-service.onrender.com`.
2. Tạo secret `CRON_SECRET` bằng giá trị `CRON_SECRET` trên Render.
3. Giữ `ENABLE_IPAD_SCOUT=false` khi dùng GitHub Actions để không chạy hai lịch cùng lúc.

GitHub Actions có thể trễ hoặc bỏ lượt khi tải cao. Render Free có thể ngủ khi không có request. Nếu cần server chạy liên tục và lịch ổn định hơn, dùng gói Render không ngủ và bật `ENABLE_IPAD_SCOUT=true`; khi đó có thể tắt workflow GitHub Actions. Dữ liệu kết quả nằm trong Firestore.

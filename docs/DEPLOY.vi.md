# Triển khai QuickCart

## 0. Yêu cầu trước khi bắt đầu

- Một tài khoản AWS (tài khoản dùng thử/sandbox là được — app này được thiết
  kế để hoạt động sai lệch một cách chủ đích).
- Node.js 20+, npm.
- AWS CLI đã được cấu hình cục bộ (`aws configure`) **hoặc** chỉ cần một cặp
  access key/secret, dùng cho bước 2.
- Cowork Local đang chạy với chế độ **Public URL** (Cloudflare tunnel) của
  một project Bugs Hunter đã được bật — xem repo chính `CoworkHackathon`.
  Copy URL dạng `https://<random>.trycloudflare.com/hook/<token>` mà nó hiển
  thị cho bạn; đó chính là `COWORK_WEBHOOK_URL` của bạn.

## 1. Thiết lập cục bộ lần đầu

```bash
npm install
npx ampx sandbox
```

`ampx sandbox` cấp phát một bản sao thật (nhưng dùng-rồi-bỏ, riêng cho từng
developer) của toàn bộ backend trong tài khoản AWS của bạn và ghi ra file
`amplify_outputs.json` THẬT (ghi đè lên file placeholder được commit sẵn để
build cục bộ). Để nó chạy trong một terminal — nó sẽ tự động redeploy mỗi khi
có thay đổi file.

Trong một terminal thứ hai:

```bash
npx tsx scripts/seed.ts   # tạo sẵn ~20-30 sản phẩm demo
npm run dev               # http://localhost:3000
```

## 2. Trỏ log-forwarder về Cowork Local

Lambda `log-forwarder` đọc `COWORK_WEBHOOK_URL` từ chính environment của nó
(`amplify/functions/log-forwarder/resource.ts`). Với một lượt chạy sandbox,
export biến này trước khi khởi động sandbox:

```bash
export COWORK_WEBHOOK_URL="https://<your-tunnel>.trycloudflare.com/hook/<token>"
npx ampx sandbox
```

**Đây là việc bạn sẽ phải làm lại mỗi buổi demo** — URL của Cloudflare tunnel
thay đổi mỗi khi app desktop Cowork Local khởi động lại. Hoặc là export lại
và để sandbox tự redeploy, hoặc cập nhật trực tiếp biến môi trường của Lambda
đã deploy qua AWS Console/CLI mà không cần redeploy toàn bộ:

```bash
aws lambda update-function-configuration \
  --function-name <tên function log-forwarder lấy từ Amplify console> \
  --environment "Variables={COWORK_WEBHOOK_URL=https://<new-tunnel>/hook/<token>}"
```

## 3. Deploy thật + CI/CD (GitHub Actions → Amplify Hosting)

1. Tạo một app Amplify một lần duy nhất (qua console, hoặc `ampx
   pipeline-deploy` sẽ tự lo việc cấp phát backend không cần thao tác thủ
   công — xem tài liệu Amplify Gen 2 của AWS để biết lệnh một dòng hiện tại).
   Ghi lại App ID.
2. Trong cài đặt repo GitHub của bạn → Secrets and variables → Actions, thêm:
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (hoặc cấu hình OIDC và đổi
     bước auth của workflow — khuyến nghị cho bất cứ thứ gì tồn tại lâu dài
     hơn một buổi demo)
   - `AMPLIFY_APP_ID`
   - `COWORK_WEBHOOK_URL` (lưu ý tương tự như trên — cập nhật secret này và
     chạy lại workflow mỗi khi URL tunnel thay đổi)
3. Push lên `main`. `.github/workflows/deploy.yml` chạy `ampx pipeline-deploy`
   cho backend; Amplify Hosting build và deploy frontend Next.js từ CÙNG một
   repo (kết nối repo một lần trong Amplify Console, hoặc để bước
   pipeline-deploy tự lo việc đó — dù theo cách nào, sau khi tạo app một lần,
   mỗi lượt `git push` lên `main` sẽ redeploy toàn bộ).

Vậy là xong — "cấu hình API key AWS là deploy được luôn."

## 4. Kiểm tra nhanh toàn bộ pipeline

1. Mở QuickCart, vào `/admin/chaos`.
2. Bấm nút "Trigger" của bất kỳ lỗi nào.
3. Trong khoảng một phút (chu kỳ đánh giá của CloudWatch Alarm), một sự cố
   sẽ xuất hiện ở tab Bugs Hunter của Cowork Local cho project này.
4. Nếu không thấy gì xuất hiện: kiểm tra CloudWatch Logs của Lambda
   `log-forwarder` trước tiên (các vấn đề network/URL đều được log ở đó,
   không âm thầm biến mất) trước khi động vào cấu hình alarm/metric-filter.

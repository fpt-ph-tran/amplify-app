# QuickCart — 10 lỗi được cài cắm chủ đích

Mỗi lỗi dưới đây đều là lỗi thật, xảy ra trên code production có thể tái hiện
được (không phải lỗi giả lập/mock) — khi kích hoạt sẽ ném/log ra một lỗi thật
từ một Lambda thật, được CloudWatch bắt lại và chuyển tiếp đến Cowork Local
(xem `README.md` để biết pipeline).

**⚡ Chaos Panel** (`/admin/chaos`) cung cấp hai cách cho mỗi lỗi:

- **Run in UI** — một chế độ tự lái (autopilot) tiếp quản trình duyệt và tái
  hiện lỗi bằng cách đi xuyên qua storefront thật: nó điều hướng, cuộn các
  control thật vào tầm nhìn, click vào chúng và gõ chữ vào chúng. Không có gì
  bị giả lập hay gọi lén sau lưng trang web, nên những gì người xem thấy chính
  là những gì một khách hàng sẽ làm.
- **Trigger** — gọi thẳng vào Lambda. Nhanh hơn, nhưng không có gì để xem.

| # | Lỗi | Vị trí | Run in UI | Trigger |
|---|-----|-------|:---:|:---:|
| 1 | Bán vượt tồn kho (Oversell) | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 2 | Đơn hàng bị trùng khi retry | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 3 | IAM AccessDenied khi ghi audit log | `amplify/backend.ts` (thiếu grant) | ✅ | ✅ |
| 4 | Mất cập nhật giỏ hàng | Model `Cart` (không có conditional write) | ✅ (mở tab thứ 2) | — |
| 5 | Phép tính coupon phụ thuộc thứ tự | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 6 | Sai lệch làm tròn số thực (floating-point) | `amplify/functions/checkout/handler.ts` | ✅ | — |
| 7 | Dữ liệu đầu vào không hợp lệ không được xử lý | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 8 | Lambda timeout khi ước tính phí ship | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 9 | Session token hết hạn/cũ | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 10 | Truy vấn catalog kiểu N+1 | `amplify/functions/catalog/handler.ts` | ✅ | ✅ |

Mọi lỗi trong số đó cũng đều có thể chạm tới bằng cách dùng storefront một
cách thủ công — panel chỉ loại bỏ việc phải phỏng đoán về thời điểm. Các bước
của autopilot nằm trong `lib/chaos-scenarios.ts`, còn những control mà nó điều
khiển được đánh dấu trong các trang bằng thuộc tính `data-chaos`.

---

## 1. Bán vượt tồn kho (Oversell)

**Vấn đề:** Lambda checkout giảm `Product.stock` bằng một `UpdateCommand`
thông thường, không có `ConditionExpression`. Hai lượt checkout đồng thời cho
đơn vị hàng cuối cùng đều đọc thấy `stock = 1`, cả hai đều pass, cả hai đều
giảm — tồn kho cuối cùng có thể bị âm.

**Cách tái hiện:** Chaos Panel → #1 **Run in UI**: nó thêm sản phẩm vào giỏ,
đặt số lượng bằng toàn bộ tồn kho còn lại, rồi double-click *Place order* để
hai lượt checkout đua nhau. Thủ công: cũng làm y như vậy, hoặc hai tab trình
duyệt cùng submit trong cùng một giây. Catalog sẽ đánh dấu bất kỳ sản phẩm nào
có tồn kho bị âm.

**Cách sửa thật sự:** thêm `ConditionExpression: "stock >= :qty"` vào
`UpdateCommand` và bắt `ConditionalCheckFailedException` để trả về một lỗi
409 "hết hàng" rõ ràng.

## 2. Đơn hàng bị trùng khi retry

**Vấn đề:** `checkout` nhận tham số `idempotencyKey` nhưng không bao giờ kiểm
tra nó với các key đã thấy trước đó trước khi ghi một `Order` mới — một
request bị retry hoặc double-click sẽ tạo ra đơn hàng thứ hai (và trong một
hệ thống thanh toán thật, là một lần charge thứ hai) mỗi lần xảy ra.

**Cách tái hiện:** Chaos Panel → #2 **Run in UI**, hoặc đơn giản là tự
double-click *Place order*. Trang checkout tạo ra một idempotency key duy nhất
khi vừa mở (đúng như một client thật sẽ làm) và không bao giờ disable nút đó,
nên cả hai request đều mang CÙNG một key.

**Cách sửa thật sự:** một bảng `IdempotencyKey` nhỏ với `PutItem` có điều
kiện (`attribute_not_exists(key)`) TRƯỚC KHI tạo đơn hàng; từ chối request
thứ hai thay vì âm thầm thành công hai lần.

## 3. IAM AccessDenied khi ghi audit log

**Vấn đề:** execution role của Lambda checkout cố tình **không** được cấp
quyền `s3:PutObject` trên bucket audit-log (xem comment trong
`amplify/backend.ts` ngay chỗ thiếu grant). Mọi đơn hàng đều thất bại ở bước
ghi này với lỗi `AccessDenied` — điều này mô phỏng lại hình dạng của một sự
cố production thật (được tạo trước bước ghi S3, nên bản thân đơn hàng vẫn
"thành công" từ góc nhìn khách hàng, trong khi audit trail âm thầm không bao
giờ được ghi lại).

**Cách tái hiện:** Chaos Panel → #3 **Run in UI**, hoặc thực chất là bất kỳ
lượt checkout bình thường nào — lỗi này xảy ra mỗi lần. Handler bắt lấy và log
lại thất bại đó thay vì đưa nó ra ngoài; chính việc "nuốt" lỗi đó *là* bug, và
đó là lý do khách hàng vẫn nhận được xác nhận đơn hàng.

**Cách sửa thật sự:** `auditBucket.grantPut(backend.checkout.resources.lambda)`
trong `amplify/backend.ts`.

## 4. Mất cập nhật giỏ hàng

**Vấn đề:** model `Cart` không có version/conditional-write nào được cấu
hình, nên mutation `update` do Amplify Data sinh ra chỉ là kiểu
last-write-wins đơn giản. Hai tab trình duyệt cùng sửa một giỏ hàng gần như
cùng lúc — một lần lưu sẽ âm thầm ghi đè lên lần kia mà không có lỗi
conflict nào.

**Cách tái hiện:** Chaos Panel → #4 **Run in UI** — nó mở một tab trình duyệt
thứ hai trên cùng giỏ hàng (hãy cho phép pop-up), để tab đó ghi một số lượng
trong khi tab này ghi một số lượng khác, rồi đọc lại từ server để cho thấy
thay đổi nào sống sót. Thủ công: mở `/cart` ở hai tab và thay đổi số lượng ở
cả hai trong vòng một hai giây. Lần lưu cuối cùng sẽ thắng, không có cảnh báo
nào.

**Cách sửa thật sự:** thêm một trường version kiểu optimistic-lock +
`ConditionExpression` trên mutation update, hiển thị conflict thật cho
người dùng thay vì âm thầm làm mất dữ liệu.

## 5. Phép tính coupon phụ thuộc thứ tự

**Vấn đề:** `calculateTotal()` duyệt qua chuỗi coupon phân tách bằng dấu phẩy
và áp dụng từng mã lên bất kỳ giá trị `total` nào đang có tại thời điểm đó —
`SAVE10` giảm 10%, `FLAT5` trừ thẳng `$5`. Gõ đúng hai mã đó theo thứ tự
ngược lại và giỏ hàng có giá khác đi, mà không có spec nào nói rõ thứ tự nào
là "đúng". Với một giỏ hàng $269.70 thì đó là $237.73 so với $238.23.

**Cách tái hiện:** Chaos Panel → #5 **Run in UI** — nó checkout cùng một giỏ
hàng hai lần, một lần với `SAVE10,FLAT5` và một lần với `FLAT5,SAVE10`, rồi
báo cáo cả hai tổng tiền. Thủ công: gõ một trong hai chuỗi đó vào ô nhập
coupon trên trang checkout.

**Cách sửa thật sự:** định nghĩa rõ ràng, có tài liệu về thứ tự áp dụng
discount (hoặc không cho phép kết hợp mã), và thêm một test chốt kết quả
tổng mong đợi.

## 6. Sai lệch làm tròn số thực (floating-point)

**Vấn đề:** `calculateTotal()` cộng dồn `item.price * item.quantity` dưới
dạng số thực JS thông thường và không bao giờ làm tròn về đơn vị cent. Một
giỏ hàng có nhiều mặt hàng sẽ lệch một hai cent so với những gì máy tính cầm
tay tính ra.

**Cách tái hiện:** Chaos Panel → #6 **Run in UI** — nó chất đầy giỏ hàng bằng
nhiều dòng sản phẩm, rồi so sánh tổng tiền mà trang hiển thị với tổng tiền mà
server thực sự tính; panel kết quả checkout sẽ in ra độ lệch tính bằng cent.

**Cách sửa thật sự:** tính toán tiền bằng số nguyên cent (hoặc một thư viện
decimal), chỉ làm tròn một lần duy nhất ở bước cuối cùng.

## 7. Dữ liệu đầu vào không hợp lệ không được xử lý

**Vấn đề:** không có validation nào cho `productId` hay `quantity`. Một
`productId` bịa ra khiến `res.Item` trả về `undefined` từ DynamoDB, và dòng
tiếp theo (`res.Item!.price`) ném lỗi `Cannot read properties of undefined`
— một lỗi 500 không được xử lý, chứ không phải một 4xx rõ ràng. Một
`quantity` **âm** được chấp nhận âm thầm và *tăng* tồn kho (vì trừ đi một số
âm) thay vì bị từ chối.

**Cách tái hiện:** Chaos Panel → #7 **Run in UI** gõ thẳng `-2` vào ô số lượng
trong giỏ hàng rồi checkout — không có gì từ chối nó cả, và tồn kho của sản
phẩm lại *tăng* lên. **Trigger** lo nửa còn lại (một `productId` bịa ra, gây
ra lỗi 500 không được xử lý).

**Cách sửa thật sự:** kiểm tra `quantity > 0` và mọi `productId` phải trỏ
đến một item có thật TRƯỚC KHI chạm vào DynamoDB; trả về 400 kèm thông báo
rõ ràng.

## 8. Lambda timeout khi ước tính phí ship

**Vấn đề:** timeout của Lambda `checkout` được đặt khá ngắn, 6 giây
(`amplify/functions/checkout/resource.ts`), trong khi lệnh gọi ước tính phí
ship (giả lập) có thể mất tới 8 giây — hàm bị kill giữa chừng, hiển thị ra
frontend dưới dạng lỗi 502/504 mà không có bước dọn dẹp tiến trình dở dang
nào.

**Cách tái hiện:** Chaos Panel → #8 **Run in UI** tick vào tùy chọn *Express
shipping — live carrier quote* trên trang checkout rồi đặt hàng. Chính tùy chọn
đó là thứ đẩy request đi qua lệnh gọi downstream chậm chạp kia.

**Cách sửa thật sự:** hoặc tăng timeout lên đủ để vượt qua p99 của lệnh gọi
downstream, hoặc biến việc ước tính phí ship thành bất đồng bộ (trả về ngay
lập tức, thông báo cho người dùng khi có kết quả).

## 9. Session token cũ / hết hạn

**Vấn đề:** một access token Cognito bình thường có thể hết hạn giữa lúc
checkout nếu frontend không bao giờ refresh nó; `checkout` không phân biệt
"chưa từng đăng nhập" với "token vừa hết hạn" — khách hàng bị mất vị trí
đang checkout chỉ với một lỗi Unauthorized chung chung.

**Cách tái hiện:** Chaos Panel → #9 **Run in UI** dùng control *Simulate an
idle-timeout* trên trang checkout — thay thế cho tình huống thật, vì ngồi chờ
một token hết hạn trực tiếp không phù hợp cho demo — rồi thử thanh toán.

**Cách sửa thật sự:** refresh token âm thầm trước khi gọi checkout, hoặc một
luồng "vui lòng đăng nhập lại — giỏ hàng của bạn đã được lưu" thay vì làm
mất giỏ hàng.

## 10. Truy vấn catalog kiểu N+1

**Vấn đề:** handler của `catalog` chạy một lượt `Scan` cho tất cả sản phẩm,
rồi lặp qua từng sản phẩm để chạy một `GetItem` RIÊNG BIỆT vào bảng `Rating`
thay vì dùng một `BatchGetItem` duy nhất. Không sao với ~20-30 sản phẩm seed,
nhưng khi catalog lớn lên, đây chính xác là kiểu pattern bắt đầu gây throttle
DynamoDB dưới tải — vô hình trong code review, chỉ lộ ra khi thành một sự cố
thật.

**Cách tái hiện:** Chaos Panel → #10 **Run in UI** bấm *Reload catalog* ba lần
rồi báo cáo thời gian round-trip trung bình; storefront cũng in ra thời gian
load gần nhất và số lượt tra cứu ngay dưới phần hero. Kiểm tra CloudWatch
Logs/X-Ray để thấy một lượt gọi GetItem cho mỗi sản phẩm.

**Cách sửa thật sự:** thay thế vòng lặp bằng một `BatchGetItemCommand` duy
nhất, dùng key là tất cả product id cùng lúc.

# 02 — Mô hình nghiệp vụ

Các khái niệm mà nghiệp vụ dựa vào để suy luận, cùng những quy tắc luôn đúng bất
kể chúng được lưu trữ như thế nào.

## Các thực thể nhìn tổng quan

```
Session ──owns──▶ Basket ──contains──▶ Line item ──refers to──▶ Product
   │                                                               │
   └──places──▶ Order ──contains──▶ Line item (frozen copy)        │
                  │                                          Rating (1:1)
                  └──produces──▶ Audit record
```

## Product (Sản phẩm)

Một món hàng có thể bán được.

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `id` | định danh | Do hệ thống gán, không bao giờ dùng lại |
| `name` | văn bản | Bắt buộc, hiển thị cho khách hàng |
| `description` | văn bản | Tuỳ chọn |
| `price` | tiền tệ | Bắt buộc, lớn hơn 0, tính bằng số xu nguyên |
| `imageUrl` | url | Tuỳ chọn |
| `stock` | số nguyên | Bắt buộc. **Không bao giờ âm.** Bằng 0 nghĩa là đã bán hết |

Sản phẩm có tồn kho bằng 0 vẫn hiển thị nhưng không thể thêm vào giỏ hàng.

Giá là một giá trị **tiền tệ**: nó chỉ được xử lý dưới dạng số nguyên xu.
Sản phẩm không được phiên bản hoá — đổi giá sẽ đổi ở mọi nơi mà giá chưa được
chốt lại trên một đơn hàng.

## Rating (Đánh giá)

Điểm tổng hợp cho một sản phẩm. Mỗi sản phẩm có một bản ghi đánh giá.

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `productId` | định danh | Xác định sản phẩm; mỗi sản phẩm một đánh giá |
| `value` | số thập phân | Điểm trung bình, 1.0–5.0, một chữ số thập phân |
| `count` | số nguyên | Số lượt đánh giá riêng lẻ đã đóng góp. Bằng 0 hoặc lớn hơn |

Sản phẩm không có bản ghi đánh giá được hiển thị mà không kèm điểm, chứ không
phải hiển thị là 0.

## Session (Phiên)

Danh tính của một khách truy cập ẩn danh.

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `id` | định danh | Được tạo ở lần truy cập đầu tiên, ổn định trong suốt lượt truy cập |
| `expiresAt` | dấu thời gian | Thời điểm phiên hết hiệu lực |

Phiên không mang bất kỳ dữ liệu cá nhân nào. Một phiên chỉ xác định giỏ hàng nào
là của ai, không hơn. Phiên đã hết hạn là một trạng thái riêng biệt và nhận biết
được — nó không giống với việc chưa từng có phiên nào.

## Basket (Giỏ hàng)

Các món hàng người mua đã chọn nhưng chưa thanh toán. Mỗi phiên có một giỏ hàng.

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `sessionId` | định danh | Phiên sở hữu giỏ hàng |
| `items` | danh sách dòng hàng | Có thể rỗng |
| `updatedAt` | dấu thời gian | Lần cuối giỏ hàng thay đổi |

Giỏ hàng là **trạng thái dùng chung**: cùng một phiên có thể đang mở trên nhiều
tab trình duyệt hoặc nhiều thiết bị, và tất cả đều tác động lên cùng một giỏ
hàng. Các thay đổi đồng thời phải được hoà giải, không bao giờ được âm thầm bỏ đi.

Giỏ hàng là trạng thái làm việc, không phải bản ghi lưu trữ. Nó có thể được dọn
rỗng sau khi đơn hàng của nó đã được đặt.

### Dòng hàng (trong giỏ hàng)

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `productId` | định danh | Phải trỏ tới một sản phẩm có thật |
| `quantity` | số nguyên | **Lớn hơn 0.** Không bao giờ bằng 0, không bao giờ âm |

Thêm một sản phẩm đã có trong giỏ hàng sẽ làm tăng số lượng của dòng đó, chứ
không tạo dòng thứ hai cho cùng sản phẩm.

## Order (Đơn hàng)

Một giao dịch mua đã được xác nhận. **Bất biến** sau khi được tạo.

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `id` | định danh | Do hệ thống gán |
| `sessionId` | định danh | Ai đã đặt đơn |
| `items` | danh sách dòng hàng | Bản sao đã đóng băng, bao gồm cả giá tại thời điểm mua |
| `subtotal` | tiền tệ | Tổng các thành tiền dòng trước khi giảm giá |
| `discountCodes` | danh sách văn bản | Các mã đã áp dụng, theo thứ tự chúng được áp dụng |
| `total` | tiền tệ | Số tiền bị tính, sau khi giảm giá. Không bao giờ âm |
| `idempotencyKey` | văn bản | Xác định ý định mua hàng đã sinh ra đơn này |
| `status` | enum | Xem vòng đời bên dưới |
| `createdAt` | dấu thời gian | Thời điểm đơn được xác nhận |

Các dòng hàng trên đơn hàng là **bản sao đã đóng băng**, không phải tham chiếu.
Một thay đổi giá về sau không bao giờ được làm thay đổi số tiền mà một đơn hàng
trong quá khứ ghi nhận là khách hàng đã trả.

### Vòng đời đơn hàng

```
   pending ──────▶ confirmed
      │
      └──────────▶ failed
```

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | Đang được xử lý. Chưa phải là một lời hứa với khách hàng |
| `confirmed` | Đã chấp nhận. Tồn kho đã được trừ, khách hàng đã được báo là thành công |
| `failed` | Không hoàn tất. Không trừ tồn kho, không tính tiền, khách hàng đã được báo là thất bại |

Không có đường ra khỏi `confirmed` hay `failed` — cả hai đều là trạng thái cuối.
Một đơn hàng không bao giờ được xác nhận một phần: hoặc mọi dòng hàng đều thành
công, hoặc cả đơn hàng thất bại.

## Audit record (Bản ghi kiểm toán)

Bản ghi vĩnh viễn của một đơn hàng, được giữ để đối soát.

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `orderId` | định danh | Đơn hàng mà nó mô tả |
| `sessionId` | định danh | Ai đã đặt đơn |
| `items` | danh sách dòng hàng | Đúng như đã tính tiền |
| `total` | tiền tệ | Đúng như đã tính tiền |
| `createdAt` | dấu thời gian | Thời điểm được ghi |

Mỗi đơn hàng đã xác nhận có đúng một bản ghi kiểm toán, không có ngoại lệ. Chỉ
ghi một lần: không bao giờ sửa, không bao giờ xoá.

## Tiền tệ

Mọi số tiền trong tài liệu đặc tả này đều tuân theo cùng bộ quy tắc:

- Được giữ dưới dạng số nguyên **xu (cents)**; không bao giờ là giá trị phân số
- Phép tính là chính xác tuyệt đối — không kết quả nào được phụ thuộc vào cách biểu diễn dấu phẩy động
- Làm tròn **một lần duy nhất**, ở cuối phép tính, không bao giờ ở các bước trung gian
- Hiển thị với đúng hai chữ số thập phân
- Số tiền hiển thị cho khách hàng và số tiền ghi trên đơn hàng luôn luôn là cùng
  một con số

## Bất biến (Invariants)

Những điều sau luôn đúng ở mọi thời điểm, trên mọi nhánh mã.

| # | Bất biến |
|---|---|
| INV-1 | `Product.stock` không bao giờ âm |
| INV-2 | Số lượng của một dòng hàng trong giỏ luôn là số nguyên lớn hơn 0 |
| INV-3 | `total` của một đơn hàng bằng `subtotal` trừ đi các khoản giảm giá đã áp dụng, và không bao giờ âm |
| INV-4 | Một `idempotencyKey` tương ứng với tối đa một đơn hàng |
| INV-5 | Mỗi đơn hàng `confirmed` có đúng một bản ghi kiểm toán |
| INV-6 | Tổng các thành tiền dòng của một đơn hàng bằng `subtotal` của nó, chính xác đến từng xu |
| INV-7 | Các dòng hàng của một đơn hàng không bao giờ thay đổi sau khi được tạo |

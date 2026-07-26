# 01 — Tổng quan sản phẩm

## Tầm nhìn

QuickCart là một cửa hàng trực tuyến quy mô nhỏ. Khách truy cập vào trang, duyệt
danh mục hàng hoá vật lý, bỏ sản phẩm vào giỏ hàng, có thể áp dụng mã giảm giá,
rồi thanh toán. Không có bước tạo tài khoản và không lưu phương thức thanh toán:
đây là con đường ngắn nhất có thể từ lúc vào trang đến khi có một đơn hàng được
xác nhận.

Sản phẩm được xem là thành công khi khách hàng đi hết con đường đó mà không bao
giờ phải băn khoăn liệu nó có hoạt động hay không — giá hiển thị đúng bằng giá
họ trả, món hàng họ mua thực sự còn trong kho, và bấm nút hai lần không khiến họ
mất tiền hai lần.

## Ai sử dụng

| Đối tượng | Mô tả | Họ cần gì |
|---|---|---|
| **Người mua hàng** | Khách ẩn danh, đến từ tìm kiếm hoặc một đường liên kết. Không đăng nhập. | Thấy được có gì để mua và giá bao nhiêu, mua xong trong dưới một phút, và chắc chắn về số tiền bị trừ. |
| **Người vận hành cửa hàng** | Điều hành cửa hàng hằng ngày. | Tin tưởng rằng số lượng tồn kho phản ánh đúng thực tế và mọi đơn hàng đều có bản ghi. |
| **Nhân viên hỗ trợ** | Xử lý các liên hệ kiểu "tôi bị trừ tiền hai lần" / "đơn hàng của tôi biến mất". | Với bất kỳ đơn hàng nào, có thể dựng lại chính xác chuyện gì đã xảy ra và vào lúc nào. |
| **Tài chính / kiểm toán** | Đối soát doanh thu định kỳ. | Một bản ghi đầy đủ, bất biến của mọi đơn hàng, khớp với số tiền khách hàng đã bị tính. |

## Phạm vi

### Trong phạm vi

- Duyệt danh mục sản phẩm kèm giá, mức tồn kho và đánh giá
- Giỏ hàng được giữ nguyên khi điều hướng trong cùng một lượt truy cập
- Điều chỉnh số lượng và xoá sản phẩm
- Mã giảm giá, bao gồm việc kết hợp nhiều mã
- Đặt hàng và nhận xác nhận ngay lập tức
- Ghi nhận mọi đơn hàng phục vụ kiểm toán

### Ngoài phạm vi

- Thu tiền thanh toán thật — đơn hàng được xác nhận mà không có dòng tiền nào di chuyển
- Vận chuyển, hoàn tất đơn và theo dõi giao hàng
- Đổi trả và hoàn tiền
- Tài khoản khách hàng, lịch sử đơn hàng, địa chỉ đã lưu
- Đa tiền tệ; mọi số tiền đều tính bằng USD
- Tính thuế
- Quy trình nhập bổ sung hàng tồn kho

## "Hoàn thành" nghĩa là gì

| Mục tiêu | Thước đo |
|---|---|
| Khách hàng tin vào mức giá | Tổng tiền hiển thị trước khi thanh toán bằng đúng số tiền được ghi trên đơn hàng, chính xác đến từng xu, mọi lúc |
| Khách hàng không bao giờ bị trừ tiền hai lần | Một ý định mua hàng của khách tạo ra đúng một đơn hàng, bất kể nút được bấm bao nhiêu lần |
| Tồn kho là trung thực | Danh mục không bao giờ chào bán món hàng không thể giao được, và tồn kho không bao giờ xuống dưới 0 |
| Không có gì bị mất trong im lặng | Mọi thao tác không thể hoàn tất đều phải báo cho khách hàng, thay vì trông như đã thành công |
| Vấn đề luôn nhìn thấy được | Mọi lỗi đều được ghi nhận với đủ chi tiết để giải thích chuyện gì đã sai, mà không cần khách hàng phải báo |

## Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| **Phiên (Session)** | Danh tính của một khách truy cập ẩn danh, được giữ trong suốt lượt truy cập. Dùng để xác định giỏ hàng nào là của ai; không gắn dữ liệu cá nhân nào. |
| **Danh mục (Catalogue)** | Danh sách sản phẩm được chào bán, kèm giá hiện tại, tồn kho và đánh giá. |
| **Sản phẩm (Product)** | Một món hàng có thể bán được. Có tên, mô tả, giá, hình ảnh và số lượng tồn kho. |
| **Tồn kho (Stock)** | Số đơn vị hàng hiện có sẵn để bán. |
| **Đánh giá (Rating)** | Điểm tổng hợp của khách hàng cho một sản phẩm: một giá trị trung bình và số lượt đánh giá tạo nên giá trị đó. |
| **Giỏ hàng (Basket / cart)** | Tập hợp các món hàng người mua đã chọn nhưng chưa thanh toán, kèm số lượng cho mỗi món. |
| **Dòng hàng (Line item)** | Một sản phẩm cộng với số lượng, nằm trong một giỏ hàng hoặc một đơn hàng. |
| **Thành tiền dòng (Line total)** | Đơn giá × số lượng của một dòng hàng. |
| **Tạm tính (Subtotal)** | Tổng của tất cả thành tiền dòng, trước khi giảm giá. |
| **Mã giảm giá (Discount code)** | Mã được nhập ở bước thanh toán, làm giảm số tiền phải trả. |
| **Tổng tiền đơn hàng (Order total)** | Số tiền cuối cùng khách hàng bị tính, sau khi đã giảm giá. |
| **Đơn hàng (Order)** | Một giao dịch mua đã được xác nhận. Bất biến sau khi được tạo. |
| **Khoá idempotency (Idempotency key)** | Một giá trị định danh cho một ý định mua hàng, để việc gửi lại nhiều lần cùng một ý định không thể tạo ra nhiều hơn một đơn hàng. |
| **Bản ghi kiểm toán (Audit record)** | Bản ghi vĩnh viễn được ghi cho mọi đơn hàng, dùng để đối soát. |
| **Báo giá vận chuyển (Shipping quote)** | Ước tính chi phí giao hàng lấy từ đơn vị vận chuyển trong lúc thanh toán. |

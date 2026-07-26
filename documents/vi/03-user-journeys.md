# 03 — Hành trình người dùng

Mỗi hành trình liệt kê luồng thuận lợi trước, sau đó là những luồng quan trọng
hơn: chuyện gì xảy ra khi có sự cố. Một hành trình chỉ được coi là hoàn chỉnh
khi các luồng ngoại lệ của nó được xử lý đúng như mô tả.

---

## J-01 — Duyệt danh mục

**Tác nhân:** Người mua hàng
**Mục tiêu:** Xem có gì đang được bán.

**Luồng chính**

1. Người mua mở cửa hàng.
2. Hệ thống hiển thị mọi sản phẩm kèm tên, mô tả, hình ảnh, giá, mức tồn kho và
   đánh giá.
3. Sản phẩm sắp hết hàng được đánh dấu rõ ràng.
4. Sản phẩm hết hàng được hiển thị là đã bán hết và không thể thêm vào giỏ.

**Luồng ngoại lệ**

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| E1 | Không tải được danh mục | Hiển thị lỗi rõ ràng. Không bao giờ hiển thị danh mục rỗng như thể cửa hàng không có sản phẩm nào |
| E2 | Sản phẩm chưa có đánh giá | Hiển thị sản phẩm mà không kèm điểm. Không hiển thị là 0 |
| E3 | Danh mục thực sự rỗng | Nói rõ điều đó, phân biệt được với E1 |

**Hậu điều kiện** — Không có gì thay đổi. Việc duyệt danh mục không có tác dụng phụ.

---

## J-02 — Thêm một món hàng vào giỏ

**Tác nhân:** Người mua hàng
**Tiền điều kiện:** Sản phẩm còn hàng trong kho.

**Luồng chính**

1. Người mua chọn một sản phẩm và thêm nó vào giỏ.
2. Hệ thống thêm một đơn vị vào giỏ hàng, hoặc tăng thêm một cho dòng hàng đã có
   của sản phẩm đó.
3. Số lượng trên giỏ hàng cập nhật ngay lập tức và nhìn thấy được.

**Luồng ngoại lệ**

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| E1 | Sản phẩm đã bán hết trong khoảng thời gian giữa lúc tải trang và lúc bấm | Từ chối, và báo cho người mua rằng sản phẩm giờ đã hết hàng |
| E2 | Việc thêm sẽ vượt quá tồn kho hiện có | Từ chối phần vượt quá và cho biết còn bao nhiêu hàng |
| E3 | Không lưu được giỏ hàng | Báo cho người mua. Không bao giờ để màn hình hiển thị một món hàng chưa được lưu |

---

## J-03 — Thay đổi giỏ hàng

**Tác nhân:** Người mua hàng

**Luồng chính**

1. Người mua mở giỏ hàng và thấy từng dòng kèm số lượng và thành tiền dòng, cùng
   với tạm tính.
2. Người mua sửa số lượng hoặc xoá một dòng.
3. Các tổng tiền được tính lại ngay lập tức.
4. Thay đổi được lưu lại.

**Luồng ngoại lệ**

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| E1 | Số lượng nhập vào bằng 0, âm, hoặc không phải số nguyên | Từ chối trước khi lưu, kèm thông báo cho biết giá trị nào được chấp nhận |
| E2 | Số lượng vượt quá tồn kho hiện có | Từ chối, và cho biết còn bao nhiêu hàng |
| E3 | **Cùng một giỏ hàng bị thay đổi ở nơi khác vào cùng thời điểm** (tab khác hoặc thiết bị khác) | Phát hiện xung đột. Hoặc gộp thay đổi, hoặc báo cho người mua rằng thay đổi của họ không được áp dụng. **Không bao giờ âm thầm ghi đè lên thay đổi kia** |
| E4 | Không lưu được giỏ hàng | Báo cho người mua và giữ nguyên dữ liệu họ đã nhập trên màn hình |

**Ghi chú về E3.** Giỏ hàng của một phiên là trạng thái dùng chung. Việc mở hai
tab trên cùng một giỏ hàng là hành vi bình thường của khách hàng, không phải
trường hợp biên hiếm gặp. Một thay đổi được chấp nhận trên màn hình rồi sau đó
biến mất còn tệ hơn một thay đổi bị từ chối.

---

## J-04 — Áp dụng mã giảm giá

**Tác nhân:** Người mua hàng
**Tiền điều kiện:** Giỏ hàng không rỗng.

**Luồng chính**

1. Người mua nhập một hoặc nhiều mã giảm giá ở bước thanh toán.
2. Hệ thống kiểm tra tính hợp lệ của từng mã.
3. Các khoản giảm giá được áp dụng theo một **thứ tự đã được định nghĩa và công
   bố**, không phụ thuộc vào thứ tự người mua gõ vào.
4. Tổng tiền mới được hiển thị, kèm theo khoản giảm giá đã áp dụng.

**Luồng ngoại lệ**

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| E1 | Một mã không tồn tại hoặc đã hết hạn | Cho biết mã nào bị từ chối và vì sao. Giữ nguyên các mã hợp lệ đã áp dụng |
| E2 | Hai mã không thể dùng chung | Nói rõ điều đó và cho biết mã nào đã được áp dụng |
| E3 | Tổng giảm giá vượt quá tạm tính | Chặn sàn tổng tiền ở mức 0. Không bao giờ tạo ra tổng tiền âm |

**Ghi chú về bước 3.** Với một giỏ hàng cho trước và một tập mã cho trước, tổng
tiền phải giống nhau mọi lúc — bất kể thứ tự các mã được nhập, và bất kể ai
trong hai người mua đã nhập chúng.

---

## J-05 — Đặt hàng

**Tác nhân:** Người mua hàng
**Tiền điều kiện:** Giỏ hàng không rỗng và phiên còn hiệu lực.

**Luồng chính**

1. Người mua xem lại giỏ hàng và tổng tiền.
2. Người mua gửi đơn hàng.
3. Hệ thống:
   a. kiểm tra từng dòng hàng đối chiếu với tồn kho hiện tại;
   b. tính tổng tiền từ giá hiện tại và các khoản giảm giá đã áp dụng;
   c. lấy báo giá vận chuyển;
   d. giữ chỗ tồn kho;
   e. tạo đơn hàng ở trạng thái `confirmed`;
   f. ghi bản ghi kiểm toán.
4. Màn hình xác nhận được hiển thị kèm mã tham chiếu đơn hàng và số tiền bị tính.
5. Giỏ hàng được dọn rỗng.

**Luồng ngoại lệ**

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| E1 | **Người mua gửi đơn nhiều hơn một lần** (nhấp đúp, retry, tải lại trang) | Đúng một đơn hàng được tạo. Các lần gửi tiếp theo của cùng một ý định trả về đơn hàng ban đầu, và không tính tiền thêm |
| E2 | **Hai người mua cùng mua đơn vị hàng cuối cùng vào cùng lúc** | Đúng một người thành công. Người còn lại được báo là đã hết hàng. Tồn kho không bao giờ xuống dưới 0 |
| E3 | Một dòng hàng trỏ tới sản phẩm không còn tồn tại | Từ chối kèm thông báo rõ ràng nêu tên sản phẩm. Đây không phải lỗi bất ngờ |
| E4 | Một số lượng không hợp lệ | Từ chối trước khi bất cứ thứ gì được giữ chỗ |
| E5 | Báo giá vận chuyển chậm hoặc không khả dụng | Không được để riêng việc này làm hỏng đơn hàng. Áp dụng timeout, dùng fallback là mức phí tiêu chuẩn, và tiếp tục |
| E6 | **Phiên hết hạn trong khoảng giữa lúc mở trang thanh toán và lúc trả tiền** | Báo cho người mua rằng phiên của họ đã hết hạn, giữ nguyên giỏ hàng, và cho phép họ tiếp tục sau khi phiên được thiết lập lại. Không bao giờ vứt bỏ giỏ hàng |
| E7 | **Không ghi được bản ghi kiểm toán** | Đơn hàng **không** được xác nhận với khách hàng. Một đơn hàng không ghi lại được thì coi như chưa từng xảy ra |
| E8 | Bất kỳ bước nào sau khi giữ chỗ tồn kho bị lỗi | Nhả lại phần tồn kho đã giữ chỗ. Không bao giờ để tồn kho bị trừ cho một đơn hàng không tồn tại |

**Hậu điều kiện khi thành công** — Tồn tại đúng một đơn hàng `confirmed`; tồn
kho đã giảm đúng bằng số lượng đã đặt; tồn tại đúng một bản ghi kiểm toán; giỏ
hàng rỗng.

**Hậu điều kiện khi thất bại** — Không có đơn hàng nào; tồn kho không đổi; không
có bản ghi kiểm toán; giỏ hàng nguyên vẹn và người mua biết là đã thất bại.

---

## J-06 — Phiên hết hạn

**Tác nhân:** Người mua hàng
**Kích hoạt:** Phiên không còn hiệu lực, thường là sau một khoảng không hoạt động.

**Luồng chính**

1. Người mua thực hiện một thao tác sau khi phiên đã hết hạn.
2. Hệ thống nhận biết **cụ thể** rằng phiên đã hết hạn — khác với việc chưa từng
   có phiên nào.
3. Hệ thống thử thiết lập lại phiên mà không cần người mua tham gia.
4. Nếu thành công, thao tác ban đầu được thực hiện tiếp và người mua không nhận
   thấy điều gì bất thường.

**Luồng ngoại lệ**

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| E1 | Không thể thiết lập lại phiên | Báo cho người mua rằng phiên của họ đã hết hạn **và rằng giỏ hàng của họ vẫn an toàn**. Mời họ tiếp tục |
| E2 | Phiên hết hạn giữa chừng khi đang thanh toán | Xử lý như E1. Giỏ hàng và mọi mã giảm giá đã nhập đều được giữ lại |

**Ghi chú.** "Đã hết hạn" và "chưa từng xác thực" là hai vấn đề khác nhau với
cách khắc phục khác nhau. Một thông báo không phân biệt được hai trường hợp này
khiến người mua không biết phải làm gì, và được coi là một lỗi.

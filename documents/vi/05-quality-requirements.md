# 05 — Yêu cầu chất lượng và tiêu chí chấp nhận

Các mục tiêu đo lường được, và những phép kiểm tra quyết định xem một quy tắc
trong tài liệu 04 đã được thoả mãn hay chưa.

---

## Hiệu năng

| # | Yêu cầu | Mục tiêu |
|---|---|---|
| NFR-P-01 | Danh mục tải xong | p95 dưới 1.0s, p99 dưới 2.0s, với tối đa 500 sản phẩm |
| NFR-P-02 | Cập nhật giỏ hàng được ghi nhận | p95 dưới 300ms |
| NFR-P-03 | Thanh toán hoàn tất đầu-cuối | p95 dưới 3.0s, ngân sách cứng 6.0s |
| NFR-P-04 | Chi phí tải danh mục tăng dưới mức tuyến tính theo kích thước danh mục | Lấy về N sản phẩm phát sinh một số lượt truy vấn dữ liệu không tăng tỉ lệ thuận với N |

**Về NFR-P-04.** Một trang tốn một lượt truy vấn cho mỗi sản phẩm trông vẫn ổn
với ba mươi sản phẩm và sụp đổ với ba nghìn sản phẩm. Dữ liệu liên quan của một
tập sản phẩm phải được lấy theo lô, không phải một lượt tra cứu cho mỗi món. Đây
là một yêu cầu về tính đúng đắn của cách hệ thống chịu tải khi mở rộng, không
phải một tối ưu hoá vi mô.

## Độ tin cậy

| # | Yêu cầu |
|---|---|
| NFR-R-01 | Mọi lời gọi ra ngoài đều có timeout tường minh, ngắn hơn ngân sách thời gian của thao tác chứa nó |
| NFR-R-02 | Mọi lời gọi ra ngoài đều có hành vi đã định nghĩa khi thất bại: hoặc dùng fallback, hoặc làm thao tác thất bại một cách sạch sẽ. Không bao giờ treo |
| NFR-R-03 | Các thao tác làm thay đổi tồn kho hoặc tạo đơn hàng phải an toàn khi retry: retry không bao giờ tạo ra tác động thứ hai |
| NFR-R-04 | Một thất bại giữa chừng không để lại trạng thái dở dang — không có tồn kho đã giữ chỗ mà không có đơn hàng, không có đơn hàng mà không có bản ghi kiểm toán |

## Toàn vẹn dữ liệu

| # | Yêu cầu |
|---|---|
| NFR-D-01 | Cả bảy bất biến trong tài liệu 02 đều đúng dưới tải đồng thời |
| NFR-D-02 | Các lần ghi đồng thời lên cùng một bản ghi được phát hiện, chứ không âm thầm hợp nhất theo kiểu last-write-wins |
| NFR-D-03 | Tiền được lưu trữ và tính toán dưới dạng số nguyên xu |

## Khả năng quan sát

| # | Yêu cầu |
|---|---|
| NFR-O-01 | Mọi thất bại, kể cả những thất bại đã được xử lý, đều sinh ra một bản ghi kèm nguyên nhân, đơn hàng hoặc phiên bị ảnh hưởng, và dấu thời gian |
| NFR-O-02 | Bản ghi lỗi đến được với người vận hành trong vòng một phút kể từ khi xảy ra |
| NFR-O-03 | Mỗi lần xảy ra đều được báo cáo. Các lỗi lặp lại không bị gộp thành một thông báo duy nhất |
| NFR-O-04 | Một bản ghi mang đủ ngữ cảnh để chẩn đoán mà không cần tái hiện lại vấn đề |

## Bảo mật và quyền riêng tư

| # | Yêu cầu |
|---|---|
| NFR-S-01 | Không thu thập hay lưu trữ bất kỳ dữ liệu cá nhân nào |
| NFR-S-02 | Mỗi thành phần chỉ giữ đúng những quyền nó cần. Thiếu quyền là một lỗi triển khai, không bao giờ là thứ để lách qua lúc chạy |
| NFR-S-03 | Định danh nội bộ và chi tiết lỗi không bao giờ được phơi ra cho người mua |

---

# Tiêu chí chấp nhận

Cho trước / Khi / Thì, mỗi tiêu chí gắn với quy tắc mà nó chứng minh.

## Danh mục

**AC-01** — `BR-CAT-01`
> **Cho trước** không lấy được danh mục
> **Khi** một người mua mở cửa hàng
> **Thì** một lỗi rõ ràng được hiển thị, và nó không được trình bày như một cửa hàng rỗng

**AC-02** — `BR-CAT-02`
> **Cho trước** một sản phẩm có tồn kho bằng 0
> **Khi** người mua xem sản phẩm đó
> **Thì** nó được đánh dấu là đã bán hết và không thể thêm vào giỏ

**AC-03** — `BR-CAT-03`
> **Cho trước** một sản phẩm chưa có đánh giá nào
> **Khi** nó được hiển thị
> **Thì** không có điểm nào được hiển thị, và nó không bị hiểu thành 0.0

## Giỏ hàng

**AC-04** — `BR-CRT-01`
> **Cho trước** một giỏ hàng có chứa một sản phẩm
> **Khi** người mua đặt số lượng thành −2
> **Thì** thao tác bị từ chối kèm thông báo, không có gì được lưu, và không thể bắt đầu thanh toán từ giỏ hàng đó

**AC-05** — `BR-CRT-01`
> **Cho trước** một dòng hàng trong giỏ
> **Khi** số lượng được đặt thành 0
> **Thì** thao tác bị từ chối, hoặc dòng hàng bị xoá — không bao giờ được lưu thành một dòng có số lượng bằng 0

**AC-06** — `BR-CRT-03`
> **Cho trước** giỏ hàng của một phiên đang mở trên hai tab, cả hai đều hiển thị số lượng 1
> **Khi** tab A đặt thành 9 và tab B đặt thành 2 trong cùng một giây
> **Thì** xung đột được phát hiện và báo cho ít nhất một tab
> **Và** không thay đổi nào bị vứt bỏ mà người mua không được báo

**AC-07** — `BR-CRT-04`
> **Cho trước** một sản phẩm có tồn kho bằng 3
> **Khi** người mua đặt số lượng thành 5
> **Thì** thao tác bị từ chối và số lượng còn có sẵn được nêu rõ

## Tồn kho

**AC-08** — `BR-INV-01`, `BR-INV-02`
> **Cho trước** một sản phẩm có tồn kho bằng 1
> **Khi** hai lượt thanh toán cho đơn vị hàng đó được gửi đồng thời
> **Thì** đúng một lượt được xác nhận, lượt còn lại được báo là đã hết hàng
> **Và** tồn kho kết thúc ở 0, không bao giờ thấp hơn

**AC-09** — `BR-INV-04`
> **Cho trước** một giao dịch mua bất kỳ
> **Khi** nó hoàn tất
> **Thì** tồn kho thấp hơn trước đó, không bao giờ cao hơn

**AC-10** — `BR-INV-03`
> **Cho trước** một lượt thanh toán thất bại sau khi tồn kho đã được giữ chỗ
> **Khi** nó trả về
> **Thì** tồn kho trở lại giá trị trước khi thanh toán và không có đơn hàng nào tồn tại

## Thanh toán

**AC-11** — `BR-ORD-01`, `BR-ORD-02`
> **Cho trước** một giỏ hàng đã sẵn sàng để thanh toán
> **Khi** người mua nhấp đúp vào nút gửi đơn
> **Thì** đúng một đơn hàng tồn tại và khách hàng bị tính tiền một lần

**AC-12** — `BR-ORD-01`
> **Cho trước** một lần gửi đơn đã tạo ra một đơn hàng
> **Khi** đúng request đó được phát lại với cùng một khoá idempotency
> **Thì** đơn hàng ban đầu được trả về, và không có đơn hàng thứ hai nào được tạo

**AC-13** — `BR-ORD-03`
> **Cho trước** một lượt thanh toán tham chiếu tới một id sản phẩm không tồn tại
> **Khi** nó được gửi đi
> **Thì** nó bị từ chối kèm thông báo nêu rõ vấn đề, chứ không phải một lỗi nội bộ bất ngờ

**AC-14** — `BR-ORD-06`, `BR-ORD-07`
> **Cho trước** báo giá vận chuyển mất nhiều thời gian hơn timeout của nó
> **Khi** người mua thanh toán
> **Thì** mức phí tiêu chuẩn được áp dụng và đơn hàng hoàn tất trong ngân sách thời gian của nó

**AC-15** — `BR-ORD-04`
> **Cho trước** một giỏ hàng hai dòng trong đó dòng thứ hai không thể đáp ứng được
> **Khi** nó được gửi đi
> **Thì** không có đơn hàng nào được tạo và không có tồn kho nào bị trừ cho cả hai dòng

## Giá cả

**AC-16** — `BR-PRC-01`
> **Cho trước** một giỏ hàng bất kỳ
> **Khi** đơn hàng được xác nhận
> **Thì** tổng tiền được ghi nhận bằng tổng tiền đã hiển thị trước khi gửi đơn, chính xác đến từng xu

**AC-17** — `BR-PRC-02`, `BR-PRC-03`
> **Cho trước** một giỏ hàng gồm 30 dòng hàng với giá kết thúc bằng số xu lẻ
> **Khi** tổng tiền được tính
> **Thì** nó bằng đúng tổng chính xác của các thành tiền dòng, không có sai lệch tích luỹ

**AC-18** — `BR-PRC-04`
> **Cho trước** một giỏ hàng và hai mã giảm giá có thể dùng chung
> **Khi** các mã được nhập theo một thứ tự, rồi cũng hai mã đó được nhập theo thứ tự ngược lại
> **Thì** cả hai lần đều cho ra cùng một tổng tiền

**AC-19** — `BR-PRC-05`
> **Cho trước** các khoản giảm giá lớn hơn tạm tính
> **Khi** tổng tiền được tính
> **Thì** nó bằng 0, không âm

**AC-20** — `BR-PRC-06`
> **Cho trước** một đơn hàng đã được xác nhận
> **Khi** giá của sản phẩm trong danh mục sau đó thay đổi
> **Thì** đơn hàng vẫn hiển thị mức giá đã trả tại thời điểm mua

## Phiên

**AC-21** — `BR-SES-01`, `BR-SES-02`
> **Cho trước** một giỏ hàng đầy và một phiên đã hết hạn
> **Khi** người mua gửi đơn hàng
> **Thì** họ được báo cụ thể rằng phiên đã hết hạn
> **Và** giỏ hàng cùng các mã giảm giá đã nhập vẫn còn nguyên sau đó

**AC-22** — `BR-SES-01`
> **Cho trước** một request hoàn toàn không có phiên
> **Khi** nó được gửi đi
> **Thì** thông báo khác với thông báo dành cho phiên hết hạn

## Kiểm toán

**AC-23** — `BR-AUD-01`
> **Cho trước** một đơn hàng đã được xác nhận
> **Khi** các bản ghi được kiểm tra
> **Thì** tồn tại đúng một bản ghi kiểm toán cho đơn hàng đó, khớp với số tiền đã tính

**AC-24** — `BR-AUD-02`
> **Cho trước** không ghi được bản ghi kiểm toán
> **Khi** người mua thanh toán
> **Thì** đơn hàng không được xác nhận với họ, và lỗi được báo cáo

## Khả năng quan sát

**AC-25** — `BR-OBS-01`, `BR-OBS-02`
> **Cho trước** một lỗi đã được xử lý bất kỳ
> **Khi** nó xảy ra
> **Thì** tồn tại một bản ghi nêu tên thao tác, đơn hàng hoặc phiên bị ảnh hưởng, và nguyên nhân

**AC-26** — `BR-OBS-04`
> **Cho trước** cùng một lỗi xảy ra năm lần trong một phút
> **Khi** người vận hành xem lại
> **Thì** cả năm lần xảy ra đều nhìn thấy được, không bị gộp thành một

**AC-27** — `BR-OBS-03`
> **Cho trước** một lỗi xảy ra trên môi trường production
> **Khi** không có khách hàng nào báo cáo nó
> **Thì** người vận hành vẫn được thông báo về lỗi đó

## Các quy tắc còn lại

**AC-28** — `BR-CAT-04`
> **Cho trước** một sản phẩm có tồn kho đã thay đổi
> **Khi** danh mục được lấy về ở lần tiếp theo
> **Thì** tồn kho hiển thị là số lượng hiện đang có sẵn

**AC-29** — `BR-CRT-02`
> **Cho trước** một giỏ hàng đã chứa sẵn một sản phẩm
> **Khi** đúng sản phẩm đó được thêm vào lần nữa
> **Thì** số lượng của dòng hàng đã có tăng lên, và giỏ hàng vẫn chỉ có một dòng cho sản phẩm đó

**AC-30** — `BR-ORD-05`
> **Cho trước** một đơn hàng đã được xác nhận
> **Khi** có bất kỳ nỗ lực nào nhằm thay đổi các dòng hàng, số lượng hoặc tổng tiền của nó
> **Thì** đơn hàng không thay đổi

**AC-31** — `BR-SES-03`
> **Cho trước** một phiên
> **Khi** nội dung được lưu của nó được kiểm tra
> **Thì** nó không chứa dữ liệu cá nhân nào — chỉ có những gì cần thiết để xác định giỏ hàng

**AC-32** — `BR-AUD-03`
> **Cho trước** một bản ghi kiểm toán đang tồn tại
> **Khi** có bất kỳ nỗ lực nào nhằm sửa đổi hoặc xoá nó
> **Thì** bản ghi không thay đổi và nỗ lực đó được báo cáo

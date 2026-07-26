# 04 — Quy tắc nghiệp vụ

Các phát biểu được đánh số, có thể kiểm thử, mà hệ thống phải tuân thủ. Mỗi quy
tắc nêu rõ yêu cầu là gì, vì sao nghiệp vụ quan tâm, và cái giá phải trả khi quy
tắc bị vi phạm.

Hãy trích dẫn mã định danh quy tắc khi báo cáo một lỗi.

---

## Danh mục — `BR-CAT`

### BR-CAT-01 — Lỗi tải danh mục không bao giờ được hiển thị thành cửa hàng rỗng
**Mức độ: Cao**

Nếu không lấy được danh mục, người mua phải được báo là đã thất bại. Kết quả rỗng
và yêu cầu thất bại là hai trạng thái khác nhau và phải trông khác nhau.

*Vì sao:* "Chúng tôi không có gì để bán" và "chúng tôi đang hỏng" đòi hỏi những
phản ứng khác nhau từ phía người mua và từ phía người vận hành. Hiển thị cái này
thành cái kia sẽ che giấu một sự cố ngừng dịch vụ.

*Vi phạm khi:* cửa hàng hiển thị danh mục rỗng hoặc thiếu sót trong khi việc lấy
dữ liệu thực tế đã báo lỗi, đã timeout, hoặc trả về dữ liệu mà trang không đọc được.

### BR-CAT-02 — Sản phẩm đã bán hết không thể thêm vào giỏ
**Mức độ: Trung bình**

Sản phẩm có tồn kho bằng 0 vẫn hiển thị, được đánh dấu là đã bán hết, và không
thể bỏ vào giỏ hàng.

### BR-CAT-03 — Thiếu đánh giá là "không có", không phải "bằng 0"
**Mức độ: Thấp**

Sản phẩm chưa có đánh giá nào được hiển thị mà không kèm điểm. Nó không bao giờ
được hiển thị là 0.0, vì con số đó được hiểu là "khách hàng ghét sản phẩm này".

### BR-CAT-04 — Danh mục phản ánh đúng tồn kho thực có
**Mức độ: Cao**

Tồn kho hiển thị là tồn kho thực sự có sẵn. Không được chào bán cho người mua
món hàng không thể giao được.

---

## Giỏ hàng — `BR-CRT`

### BR-CRT-01 — Số lượng là số nguyên dương
**Mức độ: Nghiêm trọng**

Mọi số lượng của dòng hàng trong giỏ đều là số nguyên từ 1 trở lên. Số lượng
bằng 0, số âm và số thập phân bị từ chối ngay tại điểm nhập, trước khi bất cứ
thứ gì được lưu.

*Vì sao:* một số lượng âm đảo ngược mọi phép tính phía sau — nó làm giảm số tiền
phải trả và *làm tăng* tồn kho. Nó âm thầm biến một giao dịch mua thành một
khoản hoàn tiền cộng với một lần nhập kho ảo.

*Vi phạm khi:* một số lượng nhỏ hơn hoặc bằng 0 được chấp nhận ở bất kỳ đâu giữa
ô nhập liệu và bản ghi đơn hàng.

### BR-CRT-02 — Thêm sản phẩm đã có sẽ làm tăng dòng hàng của nó
**Mức độ: Thấp**

Cùng một sản phẩm không bao giờ xuất hiện thành hai dòng trong một giỏ hàng.

### BR-CRT-03 — Thay đổi giỏ hàng đồng thời không bao giờ bị mất trong im lặng
**Mức độ: Cao**

Giỏ hàng của một phiên có thể được chỉnh sửa từ nhiều tab hoặc nhiều thiết bị
cùng lúc. Khi hai thay đổi chồng lấn nhau, hệ thống hoặc gộp chúng lại, hoặc từ
chối một thay đổi và nói rõ điều đó. Hệ thống không bao giờ chấp nhận một thay
đổi trên màn hình rồi vứt bỏ nó.

*Vì sao:* người mua đã thấy thay đổi của mình được chấp nhận. Mất nó mà không
một lời báo nghĩa là họ trả tiền cho thứ họ không định mua, và không có lỗi nào
được ghi lại ở đâu để ai đó điều tra.

*Vi phạm khi:* một lần ghi sau đè lên một lần ghi trước mà không có cơ chế phát
hiện xung đột, khiến thay đổi trước đó biến mất mà không có lỗi nào.

### BR-CRT-04 — Giỏ hàng không thể vượt quá tồn kho hiện có
**Mức độ: Cao**

Số lượng được kiểm tra đối chiếu với tồn kho khi được thiết lập, và một lần nữa
ở bước thanh toán.

---

## Tồn kho — `BR-INV`

### BR-INV-01 — Tồn kho không bao giờ âm
**Mức độ: Nghiêm trọng**

`Product.stock` luôn lớn hơn hoặc bằng 0 ở mọi thời điểm, trên mọi nhánh mã, dưới
bất kỳ mức đồng thời nào.

*Vì sao:* tồn kho âm nghĩa là đã bán ra những đơn vị hàng không tồn tại. Mỗi đơn
vị như vậy là một đơn hàng không thể giao, một khách hàng phải xin lỗi, và một
khoản hoàn tiền.

*Vi phạm khi:* quan sát thấy tồn kho nhỏ hơn 0, ở bất kỳ thời điểm nào, dù chỉ
trong tích tắc.

### BR-INV-02 — Mua đồng thời đơn vị hàng cuối cùng: đúng một người thắng
**Mức độ: Nghiêm trọng**

Khi hai hoặc nhiều lượt thanh toán tranh nhau cùng phần tồn kho còn lại, số lượt
thành công đúng bằng số đơn vị hàng còn lại. Số còn lại được báo là đã hết hàng.

*Vì sao:* hai người mua cùng giành đơn vị hàng cuối cùng không phải là một race
hiếm gặp — đó chính là hình ảnh của một sản phẩm bán chạy. Kiểm tra tồn kho rồi
mới trừ đi, dưới dạng hai bước riêng biệt không được bảo vệ, sẽ cho phép cả hai
cùng vượt qua bước kiểm tra.

*Vi phạm khi:* tổng số lượng đặt qua các lượt thanh toán đồng thời vượt quá lượng
tồn kho tồn tại trước đó.

### BR-INV-03 — Tồn kho được nhả lại khi đơn hàng thất bại
**Mức độ: Cao**

Nếu bất kỳ bước nào sau khi giữ chỗ tồn kho bị lỗi, phần tồn kho đã giữ chỗ phải
được trả lại. Tồn kho không bao giờ bị trừ cho một đơn hàng không tồn tại.

### BR-INV-04 — Tồn kho chỉ giảm khi có giao dịch mua
**Mức độ: Nghiêm trọng**

Một giao dịch mua làm giảm tồn kho. Không hành động nào do khách hàng khởi tạo
được phép làm tăng tồn kho.

*Vì sao:* nhập bổ sung hàng là quyết định của người vận hành. Nếu khách hàng có
thể đẩy tồn kho tăng lên thông qua luồng thanh toán thì con số tồn kho không còn
ý nghĩa gì nữa.

---

## Thanh toán và đơn hàng — `BR-ORD`

### BR-ORD-01 — Một ý định mua hàng tạo ra tối đa một đơn hàng
**Mức độ: Nghiêm trọng**

Mỗi ý định mua hàng mang theo một khoá idempotency. Hệ thống bảo đảm tối đa một
đơn hàng cho mỗi khoá. Các lần gửi lặp lại — nhấp đúp, retry, tải lại trang, phát
lại request do mạng — trả về đơn hàng ban đầu và không tính thêm bất kỳ khoản nào.

*Vì sao:* đây chính là lỗi trừ tiền hai lần. Đó là điều gây tổn hại lớn nhất cho
niềm tin của khách hàng mà một cửa hàng có thể gây ra, và khách hàng thường phát
hiện ra trước cả cửa hàng.

*Vi phạm khi:* tồn tại hai đơn hàng với cùng một khoá idempotency, hoặc một ý
định mua hàng dẫn đến nhiều hơn một lần tính tiền.

*Lưu ý:* nhận khoá mà không kiểm tra nó thì cũng như không có khoá.

### BR-ORD-02 — Việc gửi đơn có thể lặp lại một cách an toàn
**Mức độ: Nghiêm trọng**

Giao diện không được trông chờ vào việc khách hàng chỉ bấm nút đúng một lần. Nhấp
đúp vì sốt ruột là đầu vào phải lường trước, không phải hành vi sử dụng sai.

### BR-ORD-03 — Đầu vào không hợp lệ dẫn tới từ chối rõ ràng, không bao giờ dẫn tới sập
**Mức độ: Cao**

Sản phẩm không tồn tại, số lượng không hợp lệ và request sai định dạng đều bị từ
chối kèm thông báo nêu rõ vấn đề. Chúng không bao giờ hiện ra dưới dạng lỗi nội
bộ bất ngờ.

*Vì sao:* một lỗi kiểm tra dữ liệu mà khách hàng có thể tự khắc phục là chuyện
khác hẳn với một lỗi máy chủ. Gộp chung hai loại này làm lãng phí thời gian của
bộ phận hỗ trợ và làm chìm những lỗi thật vào nhiễu.

*Vi phạm khi:* một đầu vào lẽ ra có thể kiểm tra được lại tạo ra một lỗi không
được xử lý.

### BR-ORD-04 — Đơn hàng là tất cả hoặc không gì cả
**Mức độ: Nghiêm trọng**

Hoặc mọi dòng hàng đều được chấp nhận và đơn hàng được xác nhận, hoặc không có gì
được ghi nhận. Không tồn tại đơn hàng được xác nhận một phần.

### BR-ORD-05 — Đơn hàng là bất biến
**Mức độ: Cao**

Sau khi được tạo, các dòng hàng, giá và tổng tiền của một đơn hàng không bao giờ
thay đổi. Những thay đổi giá về sau không viết lại lịch sử.

### BR-ORD-06 — Thanh toán hoàn tất trong ngân sách thời gian của nó, hoặc thất bại một cách sạch sẽ
**Mức độ: Cao**

Luồng thanh toán có một ngân sách thời gian đầu-cuối (xem tài liệu 05). Mọi lời
gọi ra ngoài mà nó thực hiện đều có timeout ngắn hơn ngân sách đó và có một
fallback đã được định nghĩa.

*Vì sao:* một luồng thanh toán bị giết giữa chừng để lại khách hàng không có câu
trả lời và cửa hàng không có bản ghi nào về những gì đã hoàn tất. Sự chậm chạp
phải suy giảm thành một kết cục đã định nghĩa trước, chứ không phải chết đột ngột.

*Vi phạm khi:* luồng thanh toán bị chấm dứt bởi một timeout thay vì trả về kết
quả, hoặc một lời gọi ra ngoài được phép chạy lâu hơn mức ngân sách cho phép.

### BR-ORD-07 — Báo giá vận chuyển không bao giờ chặn một đơn hàng
**Mức độ: Trung bình**

Nếu đơn vị vận chuyển phản hồi chậm hoặc không khả dụng, luồng thanh toán áp dụng
mức phí tiêu chuẩn và tiếp tục. Báo giá là một tối ưu hoá, không phải một phụ thuộc.

---

## Giá cả và tiền tệ — `BR-PRC`

### BR-PRC-01 — Tổng tiền hiển thị bằng tổng tiền bị tính
**Mức độ: Nghiêm trọng**

Số tiền hiển thị cho khách hàng trước khi họ chốt đơn đúng bằng số tiền được ghi
trên đơn hàng. Chính xác đến từng xu. Mọi lúc.

*Vì sao:* bất kỳ chênh lệch nào, dù nhỏ đến đâu, cũng là việc khách hàng bị tính
một khoản mà họ không đồng ý.

*Vi phạm khi:* tổng tiền của đơn hàng khác với tổng tiền đã hiển thị cho khách
hàng, dù chênh lệch bao nhiêu.

### BR-PRC-02 — Tiền được tính bằng số nguyên xu
**Mức độ: Nghiêm trọng**

Mọi phép tính tiền tệ đều thực hiện trên số xu nguyên. Không tổng tiền nào được
phụ thuộc vào cách biểu diễn dấu phẩy động.

*Vì sao:* phần lẻ tiền tệ tích luỹ sẽ trôi dần. Nó vô hình trên một giỏ hàng hai
dòng và lộ ra trên một giỏ hàng lớn — và nó lộ ra dưới dạng một chênh lệch đối
soát mà nhiều tháng sau không ai giải thích nổi.

*Vi phạm khi:* một tổng tiền khác với tổng chính xác của các thành tiền dòng, ở
bất kỳ số chữ số thập phân nào.

### BR-PRC-03 — Làm tròn một lần, ở cuối
**Mức độ: Cao**

Việc làm tròn diễn ra một lần duy nhất, trên số tiền cuối cùng. Các giá trị trung
gian không bao giờ được làm tròn.

### BR-PRC-04 — Việc cộng dồn giảm giá là tất định
**Mức độ: Nghiêm trọng**

Khi có nhiều hơn một mã giảm giá được áp dụng, chúng được áp dụng theo một thứ tự
cố định, có tài liệu, là thuộc tính của bản thân các mã — không bao giờ phụ thuộc
vào thứ tự mà khách hàng tình cờ gõ chúng vào.

*Vì sao:* cùng một giỏ hàng với cùng các mã thì phải có cùng giá. Nếu trình tự
làm thay đổi giá thì hai khách hàng sẽ được báo hai con số khác nhau cho cùng một
giao dịch mua, và không con số nào bảo vệ được.

*Vi phạm khi:* đảo thứ tự cùng một tập mã làm thay đổi tổng tiền.

### BR-PRC-05 — Tổng tiền không bao giờ âm
**Mức độ: Cao**

Các khoản giảm giá vượt quá tạm tính sẽ chặn sàn tổng tiền ở mức 0.

### BR-PRC-06 — Giá được chốt tại thời điểm mua
**Mức độ: Cao**

Đơn hàng ghi lại mức giá tại thời điểm mua. Những thay đổi danh mục về sau không
bao giờ làm thay đổi một đơn hàng trong quá khứ.

---

## Phiên — `BR-SES`

### BR-SES-01 — "Hết hạn" phân biệt được với "chưa từng xác thực"
**Mức độ: Cao**

Hệ thống phân biệt được hai trường hợp này và nói rõ trường hợp nào đã xảy ra.

*Vì sao:* "phiên của bạn đã hết hạn, giỏ hàng của bạn vẫn an toàn" và "bạn chưa
từng đăng nhập" dẫn người mua tới những hành động khác nhau. Một thông báo từ
chối chung chung khiến họ mắc kẹt.

*Vi phạm khi:* một phiên hết hạn tạo ra đúng cùng một lỗi không phân biệt được
như khi không có phiên nào.

### BR-SES-02 — Khôi phục sau khi hết hạn mà không mất giỏ hàng
**Mức độ: Cao**

Hệ thống thử thiết lập lại phiên một cách tự động. Nếu không được, người mua được
thông báo, và giỏ hàng cùng mọi mã giảm giá đã nhập đều được giữ lại.

*Vì sao:* mất cả một giỏ hàng đầy vì timeout do không hoạt động chính là một đơn
hàng bị bỏ dở.

### BR-SES-03 — Một phiên chỉ định danh một giỏ hàng, không hơn
**Mức độ: Trung bình**

Phiên không mang bất kỳ dữ liệu cá nhân nào.

---

## Kiểm toán — `BR-AUD`

### BR-AUD-01 — Mỗi đơn hàng đã xác nhận có đúng một bản ghi kiểm toán
**Mức độ: Nghiêm trọng**

Việc xác nhận một đơn hàng và việc ghi nhận nó là một kết cục duy nhất, không
phải hai nỗ lực độc lập.

*Vì sao:* bản ghi kiểm toán là thứ mà bộ phận tài chính dùng để đối soát. Một đơn
hàng tồn tại với khách hàng nhưng không có trong bản ghi là khoản doanh thu không
thể hạch toán được.

*Vi phạm khi:* một đơn hàng đã xác nhận không có bản ghi kiểm toán, hoặc có nhiều
hơn một.

### BR-AUD-02 — Đơn hàng không ghi lại được thì không được xác nhận
**Mức độ: Nghiêm trọng**

Nếu không ghi được bản ghi kiểm toán, khách hàng không được thông báo rằng đơn
hàng đã thành công.

*Vì sao:* phiên bản nguy hiểm của lỗi này là phiên bản im lặng — khách hàng nhận
được xác nhận, sổ sách của cửa hàng thì không, và không ai phát hiện ra cho tới
một kỳ đối soát nhiều tháng sau. Thất bại một cách ồn ào chỉ tốn một đơn hàng;
thất bại trong im lặng làm mất luôn khả năng tin vào sổ sách.

*Vi phạm khi:* một đơn hàng được xác nhận với khách hàng trong khi việc ghi kiểm
toán đã thất bại, bất kể thất bại đó bị nuốt đi, được ghi log rồi bỏ qua, hay đã
retry mà không thành công.

### BR-AUD-03 — Bản ghi kiểm toán chỉ ghi một lần
**Mức độ: Cao**

Không bao giờ sửa, không bao giờ xoá.

---

## Khả năng quan sát — `BR-OBS`

### BR-OBS-01 — Mọi lỗi đều được ghi nhận
**Mức độ: Cao**

Bất kỳ thao tác nào thất bại, kể cả thao tác đã được bắt và xử lý, đều để lại một
bản ghi cho biết cái gì đã thất bại, thuộc đơn hàng hoặc phiên nào, và vì sao.

*Vì sao:* một lỗi bị nuốt đi là một khiếm khuyết chỉ lộ ra dưới dạng khiếu nại
của khách hàng.

### BR-OBS-02 — Bản ghi lỗi mang đủ chi tiết để hành động
**Mức độ: Trung bình**

Một bản ghi phải xác định được thao tác, đơn hàng hoặc phiên bị ảnh hưởng, và
nguyên nhân gốc. "Đã có lỗi xảy ra" không phải là một bản ghi.

### BR-OBS-03 — Lỗi tự lộ ra mà không cần khách hàng báo cáo
**Mức độ: Cao**

Lỗi phải tự đến được với người vận hành. Không ai nên biết về một khiếm khuyết
lần đầu tiên từ chính người bị nó ảnh hưởng.

### BR-OBS-04 — Mọi lỗi đều được báo cáo, không chỉ lỗi đầu tiên
**Mức độ: Trung bình**

Việc báo cáo không được gộp các lỗi lặp lại hoặc xảy ra đồng thời thành một thông
báo duy nhất. Tần suất tự nó đã là thông tin: một sự cố xảy ra một trăm lần không
phải là cùng một sự cố với một lần xảy ra duy nhất.

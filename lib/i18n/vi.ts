import type { Dictionary } from "./en";

export const vi: Dictionary = {
  "lang.name.en": "English",
  "lang.name.vi": "Tiếng Việt",
  "lang.name.ja": "日本語",
  "lang.switch": "Đổi ngôn ngữ",

  "nav.shop": "Cửa hàng",
  "nav.cart": "Giỏ hàng",
  "nav.chaos": "Chaos Panel",
  "nav.theme.toLight": "Chuyển sang giao diện sáng",
  "nav.theme.toDark": "Chuyển sang giao diện tối",
  "footer.tagline":
    "QuickCart là một storefront demo với mười lỗi production cố ý — mọi sự cố ở đây đều là thật và được đẩy thẳng từ CloudWatch Logs sang Cowork Local.",

  "home.eyebrow": "Storefront demo",
  "home.title": "Mọi thứ ở đây đều chạy. Đó mới là vấn đề.",
  "home.subtitle":
    "Cứ mua sắm bình thường và bạn sẽ gặp lỗi production thật — bán vượt tồn kho, tính tiền trùng lặp, giá thay đổi tùy theo thứ tự bạn gõ mã giảm giá. Mỗi lỗi đều là code backend thật, và mỗi sự cố đều được gửi sang Cowork Local.",
  "home.reload": "Tải lại danh mục",
  "home.reloading": "Đang tải danh mục…",
  "home.lastLoad": "lần tải gần nhất {ms}ms · 1 Scan + {count} lượt tra cứu đánh giá",
  "home.loadFailed": "Không tải được danh mục: {error}",
  "home.oversoldTitle": "Phát hiện tồn kho âm",
  "home.oversoldBody": "ở {names} — đó là bug #1, bán vượt quá số 0.",
  "home.badge.oversold": "bán vượt {stock}",
  "home.badge.soldOut": "Hết hàng",
  "home.badge.onlyLeft": "Chỉ còn {stock}",
  "home.inStock": "Còn {stock} trong kho",
  "home.addToCart": "Thêm vào giỏ",
  "home.added": "Đã thêm ✓",
  "home.empty": "Chưa có sản phẩm nào — chạy {command} để nạp dữ liệu cho danh mục.",

  "cart.title": "Giỏ hàng của bạn",
  "cart.empty": "Chưa có gì ở đây.",
  "cart.summary": "{count} dòng sản phẩm · đã đồng bộ với bản ghi giỏ hàng dùng chung",
  "cart.reload": "Tải lại từ server",
  "cart.emptyBody": "Giỏ hàng của bạn đang trống.",
  "cart.browse": "Xem cửa hàng",
  "cart.each": "${price} mỗi cái",
  "cart.remove": "Xóa",
  "cart.quantityFor": "Số lượng cho {name}",
  "cart.subtotal": "Tạm tính",
  "cart.checkout": "Tiến hành thanh toán",
  "cart.hint":
    "Số lượng được lưu bằng một lệnh update last-write-wins đơn giản. Mở trang này ở hai tab rồi đổi số ở cả hai — một trong hai thay đổi sẽ biến mất không một lời cảnh báo.",
  "cart.sync.saving": "đang lưu vào bản ghi giỏ hàng dùng chung…",
  "cart.sync.saved": "đã lưu {time}",
  "cart.sync.inSync": "đã đồng bộ",
  "cart.sync.error": "không kết nối được backend giỏ hàng — chỉ lưu cục bộ",
  "cart.serverHolds": "server đang giữ số lượng {qty} cho dòng 1",
  "cart.peer.title": "Tab thứ hai — cùng một giỏ hàng",
  "cart.peer.body":
    "Tab này vừa ghi số lượng {qty} vào bản ghi giỏ hàng dùng chung. Tab kia đang ghi một số khác vào đúng thời điểm đó. Ai ghi sau thì thắng, còn thay đổi kia biến mất mà không hề có lỗi xung đột nào.",
  "cart.peer.saving": "đang lưu…",
  "cart.peer.saved": "đã lưu lúc {time}",
  "cart.peer.waiting": "đang chờ giỏ hàng tải xong…",

  "checkout.title": "Thanh toán",
  "checkout.session": "Phiên",
  "checkout.tokenExpired": "· token đã hết hạn",
  "checkout.summary": "Tóm tắt đơn hàng",
  "checkout.totalShown": "Tổng hiển thị cho bạn",
  "checkout.coupon": "Mã giảm giá",
  "checkout.couponPlaceholder": "SAVE10, FLAT5 — hoặc cả hai, cách nhau bằng dấu phẩy",
  "checkout.couponHint": "Các mã được áp dụng từ trái sang phải. {a} và {b} không cho ra cùng một giá.",
  "checkout.express": "Express shipping",
  "checkout.expressHint":
    "Lấy báo giá vận chuyển trực tiếp từ hãng ngay lúc thanh toán. Lệnh gọi này có thể mất tới 8s.",
  "checkout.youPay": "Bạn trả",
  "checkout.placeOrder": "Place order",
  "checkout.placing": "Đang đặt hàng… ({count} yêu cầu đang chạy)",
  "checkout.expireSession": "Mô phỏng idle-timeout (làm hết hạn phiên của tôi)",
  "checkout.sessionStale": "Phiên đã cũ",
  "checkout.emptyBody": "Không có gì để thanh toán — giỏ hàng của bạn đang trống.",
  "checkout.result.confirmed": "Đơn hàng đã được xác nhận",
  "checkout.result.multi": "{ok}/{total} yêu cầu đã tạo ra đơn hàng",
  "checkout.result.failed": "Thanh toán thất bại",
  "checkout.result.charged": "Server đã tính",
  "checkout.result.drift": "trang hiển thị ${shown} — lệch {cents} cent",
  "checkout.result.order": "đơn hàng {id}",
  "checkout.result.duplicate": "Cả hai đều mang idempotency key {key}… — tính tiền trùng lặp.",
  "checkout.footnote":
    "Mọi lỗi trên trang này đều là hành vi backend thật, được chuyển tiếp sang Cowork Local qua CloudWatch.",

  "chaos.eyebrow": "Chaos panel",
  "chaos.title": "Mười bug, gọi lúc nào cũng có",
  "chaos.intro.a": "Run in UI",
  "chaos.intro.b":
    "giao trình duyệt cho autopilot: nó đi qua storefront thật, bấm đúng những nút thật và gõ vào đúng những ô nhập thật cho tới khi lỗi xảy ra ngay trước mắt bạn.",
  "chaos.intro.c": "Trigger",
  "chaos.intro.d": "bỏ qua màn hình và gọi thẳng Lambda — nhanh hơn, nhưng chẳng có gì để xem.",
  "chaos.driving": "Autopilot đang chạy — theo dõi bảng ở góc màn hình.",
  "chaos.runInUI": "Run in UI",
  "chaos.running": "Đang chạy…",
  "chaos.trigger": "Trigger",
  "chaos.onScreen": "Trên màn hình:",
  "chaos.pipeline.title": "Một sự cố đi tới Cowork Local như thế nào",
  "chaos.pipeline.body":
    "Lambda ghi log lỗi → một subscription filter của CloudWatch Logs khớp dòng log đó và tự đẩy event đi → Lambda log-forwarder POST nó tới webhook của Bugs Hunter. Sự kiện tới nơi trong vài giây, kèm message và stack trace thật, mỗi lần xảy ra là một lần gửi.",

  "hud.title": "Chaos autopilot",
  "hud.finished": "Đã chạy xong",
  "hud.starting": "Đang khởi động…",
  "hud.hide": "Ẩn",
  "hud.show": "Hiện",
  "hud.stop": "Dừng",
  "hud.close": "Đóng",
  "hud.driving": "Đang điều khiển UI thật cho #{num} — {title}.",
  "hud.stopped": "Đã dừng lượt chạy.",

  "step.openShop": "Mở storefront",
  "step.openCart": "Mở giỏ hàng",
  "step.checkout": "Tiến hành thanh toán",
  "step.addFirst": "Thêm sản phẩm đầu tiên vào giỏ",
  "step.rebuildCart": "Dựng lại đúng giỏ hàng đó",
  "step.goto": "Đi tới {path}",

  "bug1.title": "Bán vượt những đơn vị cuối cùng",
  "bug1.what":
    "Tồn kho bị trừ mà không dùng conditional write, nên hai lượt thanh toán cho cùng những đơn vị cuối cùng đều đi lọt.",
  "bug1.screen":
    "Thêm một sản phẩm, đặt số lượng bằng toàn bộ tồn kho còn lại, rồi bấm đúp Place order để hai lượt thanh toán chạy đua.",
  "bug1.stockNote": '"{name}" còn {stock} đơn vị.',
  "bug1.add": "Thêm nó vào giỏ",
  "bug1.setQty": "Đặt số lượng bằng cả {stock} còn lại",
  "bug1.doubleClick": "Bấm đúp Place order — hai lượt thanh toán chạy đua",
  "bug1.both":
    'Cả hai lượt thanh toán đồng thời cho toàn bộ {stock} đơn vị của "{name}" đều thành công — tồn kho giờ có thể âm. Tải lại danh mục để thấy.',
  "bug1.partial":
    "{ok}/2 lượt thanh toán thành công. Chạy lại với sản phẩm nhiều tồn kho hơn, hoặc kiểm tra danh mục xem có số âm không.",

  "bug2.title": "Đơn hàng trùng lặp khi bấm đúp",
  "bug2.what":
    "idempotency key được gửi lên nhưng không hề được kiểm tra ở phía server, nên một cú bấm đúp vì sốt ruột sẽ bị tính tiền hai lần.",
  "bug2.screen":
    "Bỏ một món vào giỏ rồi bấm đúp Place order — trang không hề disable nút, nên cả hai request đều đi ra với cùng một key.",
  "bug2.keyNote": "Trang thanh toán đang giữ idempotency key {key}… cho giỏ hàng này.",
  "bug2.doubleClick": "Bấm đúp Place order",
  "bug2.both":
    "Cả hai request đều mang CÙNG một idempotency key và đều tạo ra đơn hàng — đó là một lần tính tiền trùng lặp.",
  "bug2.partial":
    "{ok}/2 request thành công — request thứ hai không bị cơ chế chống trùng nào chặn cả, nó chỉ thua cuộc đua.",

  "bug3.title": "Audit log hỏng âm thầm (IAM)",
  "bug3.what":
    "Role thanh toán không có quyền s3:PutObject trên bucket audit, nên mọi đơn hàng đều mất dấu vết audit trong khi khách vẫn thấy thành công.",
  "bug3.screen":
    "Mua một món hoàn toàn bình thường. Đơn hàng được xác nhận trên màn hình — lỗi chỉ nhìn thấy được trong CloudWatch.",
  "bug3.place": "Đặt một đơn hàng hết sức bình thường",
  "bug3.ok":
    "Đơn hàng đã xác nhận trên màn hình. Lỗi s3:PutObject AccessDenied xảy ra ở phía server — khách sẽ không bao giờ biết bản ghi audit bị thiếu.",
  "bug3.failed": "Thanh toán hỏng trước khi tới bước ghi audit — xem bảng kết quả.",

  "bug4.title": "Mất cập nhật giỏ hàng giữa các tab",
  "bug4.what":
    "Giỏ hàng được lưu bằng một lệnh update last-write-wins đơn giản, nên một tab âm thầm ghi đè thay đổi của tab kia.",
  "bug4.screen":
    "Mở một tab trình duyệt THỨ HAI trên giỏ hàng. Cả hai tab đổi số lượng trong cùng một khoảnh khắc; chỉ một cái sống sót.",
  "bug4.openTab": "Mở tab thứ hai trên cùng giỏ hàng",
  "bug4.blocked": "Trình duyệt đã chặn tab thứ hai. Cho phép pop-up trên site này rồi chạy lại.",
  "bug4.opened": "Đã mở tab thứ hai — nó sẽ ghi số lượng 9 lên server.",
  "bug4.setQty": "Tab này đặt số lượng thành 2 cùng lúc",
  "bug4.reread": "Đọc lại giỏ hàng từ server",
  "bug4.reload": "Tải lại giỏ hàng từ server",
  "bug4.result":
    "Hai tab ghi 9 và 2 trong cùng một giây; server giữ lại {qty}. Thay đổi của tab kia biến mất mà không có lỗi xung đột nào.",

  "bug5.title": "Phép tính mã giảm giá phụ thuộc thứ tự",
  "bug5.what":
    "SAVE10 (giảm 10%) và FLAT5 (−$5) được áp dụng trong hai câu if tách rời, nên thứ tự liệt kê chúng làm đổi luôn giá.",
  "bug5.screen":
    "Thanh toán cùng một giỏ hàng hai lần — một lần với SAVE10,FLAT5 và một lần với FLAT5,SAVE10 — rồi so tổng tiền.",
  "bug5.setQty": "Đặt số lượng thành 3",
  "bug5.setQtyAgain": "Lại đặt số lượng thành 3",
  "bug5.enterA": 'Nhập mã "SAVE10,FLAT5"',
  "bug5.enterB": "Nhập ĐÚNG hai mã đó, đảo ngược thứ tự",
  "bug5.place": "Đặt hàng",
  "bug5.noteA": "SAVE10 rồi FLAT5 → {total}",
  "bug5.noteB": "FLAT5 rồi SAVE10 → {total}",
  "bug5.differ":
    "Cùng giỏ hàng, cùng hai mã, giá lại khác: {a} so với {b} — chênh {diff} chỉ vì thứ tự chuỗi.",
  "bug5.same": "Tổng trả về là {a} và {b}. Xem các bảng kết quả phía trên.",

  "bug6.title": "Sai lệch làm tròn số dấu phẩy động",
  "bug6.what":
    "Tổng từng dòng được cộng dồn bằng float JS thô và không bao giờ được làm tròn về cent, nên tổng cuối lệch khỏi tổng của những con số đang hiển thị.",
  "bug6.screen":
    "Nhét một giỏ đầy sản phẩm, rồi so tổng mà trang hiển thị với tổng mà server thực sự tính tiền.",
  "bug6.fill": "Nhét thật nhiều dòng sản phẩm vào giỏ",
  "bug6.addNth": "Thêm sản phẩm {n} (vòng {round}/3)",
  "bug6.basket": "Giỏ hàng giờ trải trên {count} sản phẩm × 3 vòng.",
  "bug6.place": "Đặt hàng",
  "bug6.drift": "Trang hiển thị {shown} nhưng server tính {charged} — lệch {cents} cent.",
  "bug6.noDrift":
    "Trang {shown} so với server {charged} — giỏ này chưa thấy lệch. Thêm vài món giá lẻ nữa rồi chạy lại.",
  "bug6.fallback": "Đã đặt hàng — so hai con số tổng trong bảng kết quả.",

  "bug7.title": "Số lượng âm vẫn được chấp nhận",
  "bug7.what":
    "Số lượng không hề được validate, nên một số âm sẽ trừ đi một số âm — lượt thanh toán CỘNG tồn kho trở lại và làm lệch tổng tiền.",
  "bug7.screen": "Gõ thẳng −2 vào ô số lượng của giỏ hàng rồi thanh toán. Chẳng có gì chặn lại.",
  "bug7.before": "Ô số lượng hiện đang là {qty}.",
  "bug7.setQty": "Gõ một số lượng ÂM: −2",
  "bug7.place": "Cứ đặt hàng bình thường",
  "bug7.ok":
    "Đã chấp nhận số lượng −2 và trả về tổng {total}. Tải lại danh mục: tồn kho của sản phẩm đó TĂNG lên.",
  "bug7.threw":
    "Lượt thanh toán ném lỗi vì số lượng âm — một lỗi 500 không được xử lý, thay vì một lỗi validation tử tế.",

  "bug8.title": "Lambda chết khi lấy báo giá vận chuyển",
  "bug8.what":
    "Báo giá trực tiếp từ hãng vận chuyển có thể mất 8s trong khi Lambda timeout ở 6s — hàm bị giết giữa chừng, không dọn dẹp gì cả.",
  "bug8.screen":
    'Tích đúng tùy chọn "Express shipping — báo giá trực tiếp từ hãng" ở trang thanh toán, rồi đặt hàng và ngồi chờ nó chết.',
  "bug8.tick": "Tích Express shipping (báo giá trực tiếp từ hãng)",
  "bug8.place": "Đặt hàng và chờ hết lệnh gọi tới hãng vận chuyển",
  "bug8.survived":
    "Lần này báo giá kịp về trước timeout — chạy lại đi, độ trễ được random tới 8s.",
  "bug8.died":
    "Lambda bị giết giữa lúc thanh toán. Khách chỉ thấy một lỗi, còn phần việc làm dở thì bỏ lại đó.",

  "bug9.title": "Phiên hết hạn giữa lúc thanh toán",
  "bug9.what":
    "Token hết hạn không được phân biệt với chưa từng đăng nhập — khách bị đá ra với một lỗi Unauthorized chung chung.",
  "bug9.screen":
    'Dùng nút "làm hết hạn phiên của tôi" ở trang thanh toán (đúng như một idle timeout thật sẽ làm), rồi thử trả tiền.',
  "bug9.expire": "Để cho phiên bị cũ đi",
  "bug9.place": "Thử trả tiền với phiên đã cũ",
  "bug9.ok": "Bất ngờ là thanh toán vẫn thành công với phiên đã cũ.",
  "bug9.failed":
    "Unauthorized chung chung, không thử refresh, cũng không có lối 'giỏ hàng của bạn vẫn được lưu' — khách mất sạch những gì đang làm dở.",

  "bug10.title": "Truy vấn N+1 phía sau danh mục",
  "bug10.what":
    "Lambda danh mục Scan toàn bộ sản phẩm, rồi gọi riêng một GetItem cho từng sản phẩm để lấy điểm đánh giá.",
  "bug10.screen":
    "Tải lại storefront từ server vài lần để thấy rõ fan-out trong CloudWatch và trong thời gian tải.",
  "bug10.reload": "Tải lại danh mục ({i}/3)",
  "bug10.result":
    "{products} sản phẩm, thời gian đi-về trung bình {ms}ms — mỗi lần tải là 1 Scan + {products} lệnh GetItem đánh giá riêng lẻ.",

  "headless.noProduct": "Chưa nạp sản phẩm nào.",
};

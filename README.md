# ChemTutor AI

Website gia sư Hóa học về thuyết acid–base Brønsted–Lowry, xây dựng từ mã Python Gemini do người dùng cung cấp.

## 1. Chạy thử trên máy tính

Yêu cầu Python 3.10 trở lên.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Sao chép `.env.example` thành `.env`, sau đó điền Gemini API key. Cài thêm `python-dotenv` nếu muốn Flask tự nạp `.env`, hoặc đặt biến môi trường trực tiếp trong terminal:

```bash
# Windows PowerShell
$env:GEMINI_API_KEY="YOUR_KEY"
python app.py
```

```bash
# macOS/Linux
export GEMINI_API_KEY="YOUR_KEY"
python app.py
```

Mở http://127.0.0.1:5000

Lấy API key tại Google AI Studio: https://aistudio.google.com/app/apikey

## 2. Triển khai online bằng Render

1. Tạo repository GitHub mới và tải toàn bộ thư mục dự án lên repository.
2. Đăng nhập https://render.com và chọn **New → Blueprint** (hoặc tạo Web Service).
3. Kết nối repository GitHub có file `render.yaml`.
4. Trong Environment, thêm `GEMINI_API_KEY` với giá trị API key của bạn. Không đưa key vào GitHub.
5. Deploy. Sau khi hoàn tất, Render cung cấp URL website dạng `https://...onrender.com`.
6. Mở URL và thử gửi câu hỏi. Có thể kiểm tra máy chủ tại `/health`.

## 3. Cấu trúc dự án

```text
chemtutor_ai/
├── app.py
├── requirements.txt
├── render.yaml
├── .env.example
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── app.js
```

## 4. Bảo mật và lưu ý

- API key chỉ được đọc ở backend qua biến môi trường `GEMINI_API_KEY`; không gửi key xuống trình duyệt.
- Không commit `.env` hoặc API key lên GitHub.
- Website hiện tập trung vào thuyết acid–base Brønsted–Lowry; chưa có tài khoản học sinh, cơ sở dữ liệu lưu lịch sử lâu dài hay bảng điều khiển giáo viên.
- Mỗi lần gọi Gemini có thể phát sinh mức sử dụng/quota theo tài khoản Google AI Studio. Kiểm tra điều khoản và hạn mức hiện hành trước khi chia sẻ rộng rãi.
- Nếu mô hình hoặc API thay đổi, cập nhật `GEMINI_MODEL` và phiên bản thư viện trong `requirements.txt`.

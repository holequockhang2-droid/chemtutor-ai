import os
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

SYSTEM_INSTRUCTION = """
# VAI TRÒ VÀ MỤC TIÊU
Bạn là ChemTutor AI – trợ lý dạy và học chuyên sâu về Thuyết acid–base Brønsted–Lowry
dành cho học sinh THPT theo định hướng GDPT 2018. Hỗ trợ học sinh hiểu bản chất cho/nhận
proton (H+), xác định cặp acid–base liên hợp và rèn luyện tư duy tự học.

# NGUYÊN TẮC GIẢNG DẠY
1. Phương pháp Socratic: Với bài tập, không đưa ngay lời giải hoàn chỉnh. Đặt 1–2 câu hỏi
gợi mở ngắn, từng bước; chờ học sinh phản hồi rồi mới xác nhận/sửa và giải thích.
2. Với câu hỏi lý thuyết trực tiếp, trả lời rõ ràng, chính xác, phù hợp trình độ THPT.
3. Dùng thuật ngữ acid, base, proton, H+, donor, acceptor, cặp acid–base liên hợp,
amphoteric (lưỡng tính); giải thích thuật ngữ khi cần.
4. Trình bày phương trình hóa học cân bằng, chỉ rõ chất cho H+ và chất nhận H+.
5. Nếu câu hỏi ngoài phạm vi acid–base Brønsted–Lowry, nói rõ phạm vi hiện tại và
hướng người học quay lại chủ đề; không giả vờ là chuyên gia mọi lĩnh vực.
6. Không bịa dữ kiện. Nếu đề thiếu dữ kiện hoặc có nhiều cách hiểu, hỏi lại một câu cụ thể.
7. Trả lời bằng tiếng Việt, ngắn gọn nhưng đủ ý; dùng định dạng dễ đọc.

# KIẾN THỨC CỐT LÕI
- Acid là chất cho proton (H+); base là chất nhận proton (H+).
- Dạng tổng quát: Acid_1 + Base_2 ⇌ Base_1 + Acid_2.
- Hai cặp liên hợp: Acid_1/Base_1 và Acid_2/Base_2.
- Chất lưỡng tính có thể cho hoặc nhận H+ tùy phản ứng, ví dụ H2O, HCO3−,
HSO4−, H2PO4− và amino acid.

# QUY TRÌNH PHẢN HỒI
- Xác định yêu cầu: lý thuyết, nhận biết, giải thích hiện tượng hay bài tập.
- Nhắc lại ngắn gọn nguyên tắc cho/nhận H+.
- Với bài tập: hỏi gợi mở 1–2 câu để học sinh tự xác định chất cho/nhận H+.
- Khi học sinh trả lời: đánh giá đúng/sai, chỉ ra điểm cần sửa và giải thích ngắn gọn.
- Với câu hỏi khái niệm: không cần gợi hỏi máy móc; trả lời thẳng rồi đưa ví dụ nếu hữu ích.

# VÍ DỤ ĐỊNH HƯỚNG
NH3 + H2O ⇌ NH4+ + OH−:
NH3 nhận H+ nên là base; H2O cho H+ nên là acid.
HCO3− có thể nhận H+ tạo H2CO3 (đóng vai trò base), hoặc cho H+ tạo CO3^2−
(đóng vai trò acid), vì vậy là chất lưỡng tính.
"""

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Máy chủ chưa được cấu hình GEMINI_API_KEY.")
    return genai.Client(api_key=api_key)

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": MODEL})

@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "Bạn hãy nhập câu hỏi trước nhé."}), 400
    if len(message) > 5000:
        return jsonify({"error": "Câu hỏi quá dài. Vui lòng giới hạn dưới 5.000 ký tự."}), 400
    if not isinstance(history, list):
        return jsonify({"error": "Lịch sử trò chuyện không hợp lệ."}), 400

    # Giữ lịch sử ngắn để giới hạn token và chỉ nhận vai trò user/model.
    contents = []
    for item in history[-12:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        text = item.get("text")
        if role in ("user", "model") and isinstance(text, str) and text.strip():
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=text[:5000])]
            ))
    contents.append(types.Content(
        role="user",
        parts=[types.Part.from_text(text=message)]
    ))

    try:
        response = get_client().models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
                temperature=0.5,
                max_output_tokens=1200,
            ),
        )
        answer = (response.text or "").strip()
        if not answer:
            answer = "Mình chưa tạo được câu trả lời. Em hãy thử diễn đạt câu hỏi theo cách khác nhé."
        return jsonify({"answer": answer})
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception:
        app.logger.exception("Gemini request failed")
        return jsonify({"error": "Có lỗi khi kết nối Gemini. Em thử lại sau nhé; nếu lỗi tiếp diễn, hãy kiểm tra API key và hạn mức API."}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)

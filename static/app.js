
const promptBox = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const chatArea = document.getElementById("chatArea");

const acidBaseBtn = document.getElementById("acidBaseBtn");
const equilibriumBtn = document.getElementById("equilibriumBtn");
const chapterName = document.getElementById("chapterName");
const welcomeCopy = document.getElementById("welcomeCopy");
const suggestionGrid = document.getElementById("suggestionGrid");

let history = [];
let busy = false;
let selectedChapter = "acid_base";

// Nội dung của từng chương
const chapterData = {
  acid_base: {
    name: "Acid – Base",
    placeholder: "Đặt câu hỏi về Acid–base...",
    welcome: "Xin chào! Mình là ChemTutor AI. Hãy cùng tìm hiểu thuyết acid–base Brønsted–Lowry nhé.",
    suggestions: [
      {
        icon: "◈",
        color: "violet",
        title: "Kiến thức nền tảng",
        description: "Acid và base là gì?",
        prompt: "Theo Brønsted–Lowry, acid và base được định nghĩa như thế nào?"
      },
      {
        icon: "⌁",
        color: "blue",
        title: "Phân tích phản ứng",
        description: "Vai trò của NH₃ trong nước",
        prompt: "Vì sao NH3 là base theo thuyết Brønsted–Lowry?"
      },
      {
        icon: "⇄",
        color: "orange",
        title: "Chất lưỡng tính",
        description: "Phân tích ion HCO₃⁻",
        prompt: "HCO3− là acid hay base? Hãy giúp em phân tích."
      },
      {
        icon: "✎",
        color: "green",
        title: "Luyện tập tư duy",
        description: "Nhận diện cặp liên hợp",
        prompt: "Hãy cho em một bài tập xác định các cặp acid–base liên hợp và hướng dẫn bằng câu hỏi gợi mở."
      }
    ]
  },

  equilibrium: {
    name: "Cân bằng hóa học",
    placeholder: "Đặt câu hỏi về Cân bằng hóa học...",
    welcome: "Xin chào! Mình là ChemTutor AI. Hãy cùng khám phá phản ứng thuận nghịch và cân bằng hóa học nhé.",
    suggestions: [
      {
        icon: "◈",
        color: "violet",
        title: "Kiến thức nền tảng",
        description: "Cân bằng hóa học là gì?",
        prompt: "Cân bằng hóa học là gì? Vì sao nói cân bằng hóa học là cân bằng động?"
      },
      {
        icon: "⌁",
        color: "blue",
        title: "Hằng số cân bằng",
        description: "Viết biểu thức Kc",
        prompt: "Hãy hướng dẫn cách viết biểu thức hằng số cân bằng Kc và cho ví dụ."
      },
      {
        icon: "⇄",
        color: "orange",
        title: "Nguyên lý Le Chatelier",
        description: "Các yếu tố ảnh hưởng",
        prompt: "Phân tích ảnh hưởng của nồng độ, áp suất và nhiệt độ đến sự chuyển dịch cân bằng."
      },
      {
        icon: "✎",
        color: "green",
        title: "Luyện tập tư duy",
        description: "Bài tập chuyển dịch cân bằng",
        prompt: "Cho phản ứng tổng hợp ammonia N2(g) + 3H2(g) ⇌ 2NH3(g). Hãy hướng dẫn em phân tích chiều chuyển dịch cân bằng khi tăng áp suất."
      }
    ]
  }
};

// Hiển thị công thức và Markdown
function renderMarkdown(element, source) {
  const mathParts = [];

  const protectedText = source.replace(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+\$)/g,
    (match) => {
      const token = `MATHPLACEHOLDER${mathParts.length}TOKEN`;
      mathParts.push({ token, value: match });
      return token;
    }
  );

  let html = marked.parse(protectedText);
  html = DOMPurify.sanitize(html);

  for (const item of mathParts) {
    const safeMath = item.value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    html = html.replaceAll(item.token, safeMath);
  }

  element.innerHTML = html;
}

// Hiển thị công thức bằng MathJax
async function renderMath(element) {
  try {
    if (!window.MathJax || !window.MathJax.startup) return;

    await window.MathJax.startup.promise;
    await window.MathJax.typesetPromise([element]);
  } catch (err) {
    console.error("Lỗi hiển thị công thức:", err);
  }
}

// Thêm tin nhắn vào giao diện
function addMessage(role, text, extraClass = "") {
  welcome.style.display = "none";
  messages.classList.add("visible");

  const row = document.createElement("div");
  row.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "Bạn" : "✧";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${extraClass}`;

  if (role === "assistant") {
    renderMarkdown(bubble, text);

    if (!extraClass) {
      renderMath(bubble);
    }
  } else {
    bubble.textContent = text;
  }

  row.append(avatar, bubble);
  messages.appendChild(row);

  chatArea.scrollTop = chatArea.scrollHeight;

  return bubble;
}

// Cập nhật giao diện theo chương được chọn
function updateChapter(chapter) {
  if (busy || !chapterData[chapter]) return;

  selectedChapter = chapter;

  const data = chapterData[chapter];

  chapterName.textContent = data.name;
  promptBox.placeholder = data.placeholder;
  welcomeCopy.textContent = data.welcome;

  acidBaseBtn.classList.toggle("active", chapter === "acid_base");
  acidBaseBtn.classList.toggle("muted", chapter !== "acid_base");

  equilibriumBtn.classList.toggle("active", chapter === "equilibrium");
  equilibriumBtn.classList.toggle("muted", chapter !== "equilibrium");

  // Cập nhật câu hỏi gợi ý
  suggestionGrid.innerHTML = "";

  data.suggestions.forEach(item => {
    const button = document.createElement("button");
    button.className = "suggestion";
    button.dataset.prompt = item.prompt;

    const icon = document.createElement("span");
    icon.className = `suggestion-icon ${item.color}`;
    icon.textContent = item.icon;

    const content = document.createElement("span");

    const title = document.createElement("b");
    title.textContent = item.title;

    const description = document.createElement("small");
    description.textContent = item.description;

    content.append(title, description);

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "↗";

    button.append(icon, content, arrow);
    suggestionGrid.appendChild(button);
  });

  // Xóa cuộc trò chuyện cũ khi chuyển chương
  history = [];
  messages.innerHTML = "";
  messages.classList.remove("visible");

  welcome.style.display = "";
  promptBox.value = "";
  promptBox.focus();
  loadExercises(chapter);
}

// Xử lý gửi câu hỏi
async function sendMessage(text) {
  text = (text || "").trim();

  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;

  promptBox.value = "";
  promptBox.style.height = "auto";

  addMessage("user", text);

  const pending = addMessage(
    "assistant",
    "ChemTutor đang suy nghĩ…",
    "typing"
  );

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: history,
        chapter: selectedChapter
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không thể gửi câu hỏi.");
    }

    pending.classList.remove("typing");

    renderMarkdown(pending, data.answer);
    await renderMath(pending);

    history.push(
      { role: "user", text: text },
      { role: "model", text: data.answer }
    );

    history = history.slice(-12);

  } catch (err) {
    pending.classList.remove("typing");
    pending.classList.add("error");
    pending.textContent =
      err.message || "Đã xảy ra lỗi. Vui lòng thử lại.";

  } finally {
    busy = false;
    sendBtn.disabled = false;
    promptBox.focus();
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}


// Sự kiện chọn chương
acidBaseBtn.addEventListener("click", () => {
  updateChapter("acid_base");
});

equilibriumBtn.addEventListener("click", () => {
  updateChapter("equilibrium");
});

// ===== CHỨC NĂNG GỢI Ý THEO 3 MỨC ĐỘ =====

const hintLevels = {
  1: `Hãy tiếp tục hướng dẫn em ở mức 1 - GỢI Ý NHẸ.
Chỉ đặt câu hỏi định hướng để em tự suy nghĩ.
Không đưa công thức hoặc đáp án ngay.
Chỉ tập trung vào bước tiếp theo của bài tập hiện tại.`,

  2: `Hãy tiếp tục hướng dẫn em ở mức 2 - GỢI Ý CỤ THỂ.
Nhắc lại kiến thức, công thức hoặc phương trình cần sử dụng.
Giải thích cách nhận biết và vận dụng nhưng chưa tính ra đáp án cuối cùng.`,

  3: `Hãy tiếp tục hướng dẫn em ở mức 3 - HƯỚNG DẪN TỪNG BƯỚC.
Phân tích cụ thể bước tiếp theo cần thực hiện.
Có thể trình bày công thức và phép biến đổi cần thiết.
Giải thích từng bước nhưng vẫn khuyến khích em tự thực hiện
các phép tính và tìm kết quả cuối cùng.`
};

document.querySelectorAll(".hint-btn").forEach(button => {
  button.addEventListener("click", () => {
    const level = button.dataset.level;

    if (!history.length) {
      alert("Em hãy gửi một bài tập hoặc câu hỏi trước nhé!");
      return;
    }

    sendMessage(hintLevels[level]);
  });
});



// Gửi câu hỏi bằng nút gửi
sendBtn.addEventListener("click", () => {
  sendMessage(promptBox.value);
});

// Nhấn Enter để gửi, Shift + Enter để xuống dòng
promptBox.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(promptBox.value);
  }
});

// Tự động điều chỉnh chiều cao ô nhập
promptBox.addEventListener("input", () => {
  promptBox.style.height = "auto";
  promptBox.style.height =
    Math.min(promptBox.scrollHeight, 120) + "px";
});

// Sự kiện câu hỏi gợi ý
suggestionGrid.addEventListener("click", e => {
  const button = e.target.closest(".suggestion");

  if (button && button.dataset.prompt) {
    sendMessage(button.dataset.prompt);
  }
});

// Tạo cuộc trò chuyện mới
document.getElementById("newChat").addEventListener("click", () => {
  history = [];

  messages.innerHTML = "";
  messages.classList.remove("visible");

  welcome.style.display = "";
  promptBox.value = "";
  promptBox.focus();
});


// ===== NGÂN HÀNG BÀI TẬP =====

let allExercises = [];
let selectedLevel = "all";

// Tải bài tập từ Flask API
async function loadExercises(chapter) {
  const exerciseList = document.getElementById("exerciseList");

  exerciseList.innerHTML = "<p>Đang tải bài tập...</p>";

  try {
    const response = await fetch(
      `/api/exercises?chapter=${encodeURIComponent(chapter)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không thể tải bài tập.");
    }

    allExercises = data.exercises;
    selectedLevel = "all";

    document.querySelectorAll(".filter-btn").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.level === "all"
      );
    });

    renderExercises();

  } catch (error) {
    exerciseList.textContent =
      error.message || "Đã xảy ra lỗi khi tải bài tập.";
  }
}

// Hiển thị danh sách bài tập
function renderExercises() {
  const exerciseList = document.getElementById("exerciseList");

  const filteredExercises = selectedLevel === "all"
    ? allExercises
    : allExercises.filter(
        item => item.level === selectedLevel
      );

  exerciseList.innerHTML = "";

  if (!filteredExercises.length) {
    exerciseList.textContent = "Không có bài tập ở mức độ này.";
    return;
  }

  filteredExercises.forEach(item => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const heading = document.createElement("div");
    heading.className = "exercise-card-heading";

    const topic = document.createElement("b");
    topic.textContent = `${item.id} · ${item.topic}`;

    const level = document.createElement("span");
    level.className = "exercise-level";
    level.textContent = item.level;

    heading.append(topic, level);

    const question = document.createElement("p");
    question.textContent = item.question;

    const button = document.createElement("button");
    button.className = "exercise-start";
    button.textContent = "Luyện tập với AI →";

    button.addEventListener("click", () => {
      promptBox.value =
        `Em muốn luyện tập bài ${item.id}:\n${item.question}\n` +
        "Hãy hướng dẫn em bằng câu hỏi gợi mở, chưa đưa đáp án ngay.";

      sendMessage(promptBox.value);
    });

    card.append(heading, question, button);
    exerciseList.appendChild(card);
  });
}

// Lọc bài tập theo mức độ
document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    selectedLevel = button.dataset.level;

    document.querySelectorAll(".filter-btn").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderExercises();
  });
});

// Khởi tạo giao diện
updateChapter("acid_base");
loadExercises("acid_base");

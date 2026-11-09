const promptBox = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const chatArea = document.getElementById("chatArea");
let history = [];
let busy = false;

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
  bubble.textContent = text;
  row.append(avatar, bubble);
  messages.appendChild(row);
  chatArea.scrollTop = chatArea.scrollHeight;
  return bubble;
}

async function sendMessage(text) {
  text = (text || "").trim();
  if (!text || busy) return;
  busy = true;
  sendBtn.disabled = true;
  promptBox.value = "";
  promptBox.style.height = "auto";
  addMessage("user", text);
  const pending = addMessage("assistant", "ChemTutor đang suy nghĩ…", "typing");
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({message: text, history})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể gửi câu hỏi.");
    pending.classList.remove("typing");
    pending.textContent = data.answer;
    history.push({role: "user", text}, {role: "model", text: data.answer});
    history = history.slice(-12);
  } catch (err) {
    pending.classList.remove("typing");
    pending.classList.add("error");
    pending.textContent = err.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
  } finally {
    busy = false;
    sendBtn.disabled = false;
    promptBox.focus();
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

sendBtn.addEventListener("click", () => sendMessage(promptBox.value));
promptBox.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(promptBox.value);
  }
});
promptBox.addEventListener("input", () => {
  promptBox.style.height = "auto";
  promptBox.style.height = Math.min(promptBox.scrollHeight, 120) + "px";
});
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});
document.getElementById("newChat").addEventListener("click", () => {
  history = [];
  messages.innerHTML = "";
  messages.classList.remove("visible");
  welcome.style.display = "";
  promptBox.value = "";
  promptBox.focus();
});

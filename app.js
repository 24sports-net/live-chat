const firebaseConfig = {
  apiKey: "AIzaSyD4-VCUGPN1XyQ1Xr-nsygATasnRrukWr4",
  authDomain: "spn-livechat.firebaseapp.com",
  databaseURL: "https://spn-livechat-default-rtdb.firebaseio.com",
  projectId: "spn-livechat",
  storageBucket: "spn-livechat.appspot.com",
  messagingSenderId: "979619554738",
  appId: "1:979619554738:web:a36c0a793988913d5670ab"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const ADMIN_EMAILS = ["24sports.social@gmail.com"];

const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const loginBtn = document.getElementById("login-btn");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");

let currentUser = null;

loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
  }
});

sendBtn.onclick = sendMessage;
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const isLink = /https?:\/\/\S+/i.test(text);
  if (isLink && !ADMIN_EMAILS.includes(currentUser.email)) {
    alert("Links are not allowed.");
    messageInput.value = "";
    return;
  }

  const message = {
    name: currentUser.displayName,
    email: currentUser.email,
    photo: currentUser.photoURL || "https://www.gravatar.com/avatar/?d=mp",
    text,
    timestamp: Date.now()
  };

  db.ref("messages").push(message);
  messageInput.value = "";
}

db.ref("messages").on("value", (snapshot) => {
  chatMessages.innerHTML = "";
  const now = Date.now();

  snapshot.forEach((child) => {
    const msg = child.val();
    const age = now - msg.timestamp;

    if (age >= 86400000) {
      db.ref("messages/" + child.key).remove();
      return;
    }

    const isSent = msg.email === currentUser?.email;
    const isAdmin = ADMIN_EMAILS.includes(currentUser?.email);

    const msgEl = document.createElement("div");
    msgEl.className = `message ${isSent ? "sent" : "received"}`;
    msgEl.innerHTML = `
      <img src="${msg.photo}" alt="pfp">
      <div class="bubble">
        <div class="name">${msg.name}</div>
        <div>${msg.text}</div>
        <div class="time-delete-wrapper">
          <span>${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          ${isAdmin ? `
          <div class="admin-menu">
            <button class="menu-btn">⋮</button>
            <div class="menu-options">
              <button onclick="deleteMessage('${child.key}')">Delete</button>
            </div>
          </div>` : ""}
        </div>
      </div>
    `;
    chatMessages.appendChild(msgEl);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function deleteMessage(key) {
  db.ref("messages/" + key).remove();
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4-VCUGPN1XyQ1Xr-nsygATasnRrukWr4",
  authDomain: "spn-livechat.firebaseapp.com",
  databaseURL: "https://spn-livechat-default-rtdb.firebaseio.com",
  projectId: "spn-livechat",
  storageBucket: "spn-livechat.appspot.com",
  messagingSenderId: "979619554738",
  appId: "1:979619554738:web:a36c0a793988913d5670ab",
  measurementId: "G-8D9XXZSCR9"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const loginBtn = document.getElementById("login-btn");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");

const ADMIN_EMAILS = ["24sports.social@gmail.com"];
let currentUser = null;

// Login with Google
loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

// On user login
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
  }
});

// Send on click or Enter (Shift+Enter for newline)
sendBtn.onclick = sendMessage;
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send message function
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const isLink = /https?:\/\//i.test(text);
  if (isLink && !ADMIN_EMAILS.includes(currentUser.email)) {
    alert("Links are not allowed");
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

// Display messages
db.ref("messages").on("value", (snapshot) => {
  chatMessages.innerHTML = "";
  const now = Date.now();
  snapshot.forEach((child) => {
    const msg = child.val();
    const isSent = msg.email === currentUser.email;
    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    const age = now - msg.timestamp;

    if (age >= 86400000) {
      db.ref("messages/" + child.key).remove();
      return;
    }

    const msgEl = document.createElement("div");
    msgEl.className = `message ${isSent ? "sent" : "received"}`;
    msgEl.innerHTML = `
      <img src="${msg.photo}" alt="pfp">
      <div class="bubble">
        <div class="name">${msg.name}</div>
        <div class="text">${msg.text}</div>
        <div class="time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        ${isAdmin ? `<button onclick="deleteMessage('${child.key}')" style="background:none;border:none;color:red;font-size:12px;cursor:pointer;">Delete</button>` : ""}
      </div>
    `;
    chatMessages.appendChild(msgEl);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Admin delete
function deleteMessage(key) {
  db.ref("messages/" + key).remove();
}

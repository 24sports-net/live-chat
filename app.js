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

const ADMIN_EMAILS = ["24sports.social@gmail.com"];

const loginBtn = document.getElementById("login-btn");
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");

let currentUser = null;

loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

auth.onAuthStateChanged(user => {
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

  const isLink = /https?:\\/\\//i.test(text);
  if (isLink && !ADMIN_EMAILS.includes(currentUser.email)) {
    alert("Links are not allowed");
    messageInput.value = "";
    return;
  }

  const msg = {
    name: currentUser.displayName,
    email: currentUser.email,
    photo: currentUser.photoURL || "https://www.gravatar.com/avatar/?d=mp",
    text,
    timestamp: Date.now()
  };

  db.ref("messages").push(msg);
  messageInput.value = "";
}

function renderMessage(key, msg) {
  const isSent = msg.email === currentUser.email;
  const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
  const now = Date.now();

  if (now - msg.timestamp > 86400000) {
    db.ref("messages/" + key).remove();
    return;
  }

  const div = document.createElement("div");
  div.className = `message ${isSent ? "sent" : "received"}`;

  const profile = `<img src="${msg.photo}" class="profile" alt="user">`;

  const deleteOption = isAdmin || currentUser.email === msg.email
    ? `<div class="options"><button class="delete-btn" onclick="deleteMessage('${key}')">⋮</button></div>`
    : "";

  div.innerHTML = `
    ${isSent ? "" : profile}
    <div class="bubble">
      <div class="name">${msg.name}</div>
      <div>${msg.text}</div>
      <div class="time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      ${deleteOption}
    </div>
    ${isSent ? profile : ""}
  `;

  chatMessages.appendChild(div);
}

db.ref("messages").on("value", snapshot => {
  chatMessages.innerHTML = "";
  snapshot.forEach(child => renderMessage(child.key, child.val()));
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function deleteMessage(key) {
  db.ref("messages/" + key).remove();
}

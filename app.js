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
const COLORS = ["#7F66FF", "#00C2D1", "#34B7F1", "#25D366", "#C4F800", "#FFD279", "#FF5C9D", "#53BDEB", "#A259FF", "#FF8A3D"];
let userColors = {};
let currentUser = null;
let replyTo = null;
let typingTimeout;

const loginBtn = document.getElementById("login-btn");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const replyPreview = document.getElementById("reply-preview");
const typingIndicator = document.getElementById("typing-indicator");

loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById("login-container").style.display = "none";
    document.getElementById("chat-container").style.display = "flex";

    db.ref("presence/" + user.uid).set({ name: user.displayName });
    db.ref("presence/" + user.uid).onDisconnect().remove();

    db.ref("messages").push({
      type: "system",
      text: `${user.displayName} joined the chat`,
      timestamp: Date.now()
    });
  }
});

messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  showTyping();
});

sendBtn.onclick = sendMessage;

function assignColor(email) {
  if (!userColors[email]) {
    userColors[email] = COLORS[Object.keys(userColors).length % COLORS.length];
  }
  return userColors[email];
}

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
    timestamp: Date.now(),
    replyTo: replyTo || null,
    type: "user"
  };

  db.ref("messages").push(message);
  messageInput.value = "";
  replyTo = null;
  replyPreview.style.display = "none";
  db.ref("typing").remove();
}

function deleteMessage(key) {
  if (confirm("Are you sure you want to delete this message?")) {
    db.ref("messages/" + key).remove();
  }
}

function cancelReply() {
  replyTo = null;
  replyPreview.style.display = "none";
}

function showTyping() {
  db.ref("typing").set(currentUser.displayName);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    db.ref("typing").remove();
  }, 2000);
}

db.ref("typing").on("value", snap => {
  const val = snap.val();
  if (val && currentUser && val !== currentUser.displayName) {
    typingIndicator.style.display = "block";
    typingIndicator.innerText = `${val} is typing...`;
  } else {
    typingIndicator.style.display = "none";
  }
});

db.ref("messages").on("value", snap => {
  chatMessages.innerHTML = "";
  const now = Date.now();
  snap.forEach(child => {
    const msg = child.val();
    const age = now - msg.timestamp;

    if (msg.type === "system") {
      const sysEl = document.createElement("div");
      sysEl.style.textAlign = "center";
      sysEl.style.color = "#aaa";
      sysEl.style.fontSize = "12px";
      sysEl.innerText = msg.text;
      chatMessages.appendChild(sysEl);
      return;
    }

    if (age >= 86400000) {
      db.ref("messages/" + child.key).remove();
      return;
    }

    const isSent = msg.email === currentUser?.email;
    const isAdmin = ADMIN_EMAILS.includes(msg.email);
    const nameColor = isAdmin ? "#FF4C4C" : assignColor(msg.email);

    const msgEl = document.createElement("div");
    msgEl.className = `message ${isSent ? "sent" : "received"}`;

    msgEl.innerHTML = `
      <img class="profile-pic" src="${msg.photo}" alt="pfp" />
      <div class="bubble" ondblclick="setReply('${child.key}', \`${msg.name}\`, \`${msg.text}\`)">
        <div class="name" style="color:${nameColor}">
          ${msg.name}${isAdmin ? ' <span class="material-icons admin-verified">verified</span>' : ""}
        </div>
        ${msg.replyTo ? `<div class="reply-to">Replying to: ${msg.replyTo.text}</div>` : ""}
        <div>${msg.text}</div>
        <div class="time">${new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        ${ADMIN_EMAILS.includes(currentUser.email) ? `<span class="material-icons delete-btn" onclick="deleteMessage('${child.key}')">delete</span>` : ""}
      </div>
    `;
    chatMessages.appendChild(msgEl);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function setReply(key, name, text) {
  replyTo = { name, text };
  document.getElementById("reply-to-name").innerText = name;
  document.getElementById("reply-to-text").innerText = text;
  replyPreview.style.display = "flex";
}

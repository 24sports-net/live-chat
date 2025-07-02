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
const typingIndicator = document.getElementById("typing-indicator");

const ADMIN_EMAILS = ["24sports.social@gmail.com"];
const NAME_COLORS = ["#7F66FF", "#00C2D1", "#34B7F1", "#25D366", "#C4F800", "#FFD279", "#FF5C9D", "#53BDEB", "#A259FF", "#FF8A3D"];

let currentUser = null;
let replyTo = null;
let typingTimeout = null;

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

messageInput.addEventListener("input", () => {
  db.ref("typing/" + currentUser.uid).set({
    name: currentUser.displayName,
    timestamp: Date.now()
  });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    db.ref("typing/" + currentUser.uid).remove();
  }, 2000);
});

function assignColor(name, email) {
  if (ADMIN_EMAILS.includes(email)) return "#FF4C4C";
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return NAME_COLORS[hash % NAME_COLORS.length];
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const isLink = /https?:\/\/|www\./i.test(text);
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
    reply: replyTo || null
  };

  db.ref("messages").push(message);
  messageInput.value = "";
  replyTo = null;
  document.getElementById("reply-box").style.display = "none";
}

db.ref("typing").on("value", (snapshot) => {
  let isTyping = false;
  snapshot.forEach(child => {
    const typer = child.val();
    if (child.key !== currentUser.uid) {
      isTyping = true;
      typingIndicator.textContent = `${typer.name} is typing...`;
    }
  });
  if (!isTyping) typingIndicator.textContent = "";
});

db.ref("messages").on("value", (snapshot) => {
  chatMessages.innerHTML = "";
  const now = Date.now();
  snapshot.forEach((child) => {
    const msg = child.val();
    const isSent = msg.email === currentUser.email;
    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    const isSenderAdmin = ADMIN_EMAILS.includes(msg.email);
    const age = now - msg.timestamp;

    if (age >= 86400000) {
      db.ref("messages/" + child.key).remove();
      return;
    }

    const msgColor = assignColor(msg.name, msg.email);
    const msgEl = document.createElement("div");
    msgEl.className = `message ${isSent ? "sent" : "received"}`;

    const nameWithIcon = `
      <span style="color:${msgColor};">${msg.name}</span>
      ${isSenderAdmin ? '<span class="material-icons" style="font-size:14px;color:#FF4C4C;vertical-align:middle;">verified</span>' : ''}
    `;

    const safeText = msg.text.replace(/(@\w+)/g, `<span style="color:#00A884;">$1</span>`);

    const replyHTML = msg.reply ? `
      <div style="border-left: 3px solid #25D366; padding-left: 8px; margin-bottom: 5px; font-size: 13px; color: #ccc;">
        <b style="color:${assignColor(msg.reply.name, msg.reply.email || "")};">${msg.reply.name}</b>: ${msg.reply.text}
      </div>` : "";

    msgE

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

const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const loginBtn = document.getElementById("login-btn");
const guestBtn = document.getElementById("guest-btn");
const guestName = document.getElementById("guest-name");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");

const ADMIN_EMAILS = ["24sports.social@gmail.com"];
const NAME_COLORS = ["#7F66FF", "#00C2D1", "#34B7F1", "#25D366", "#C4F800", "#FFD279", "#FF5C9D", "#53BDEB", "#A259FF", "#FF8A3D"];

let currentUser = null;
let currentColor = null;

// Google Login
loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

// Guest Login
guestBtn.onclick = () => {
  const name = guestName.value.trim();
  if (!name) return alert("Enter nickname");
  currentUser = {
    displayName: name,
    email: null,
    photoURL: null
  };
  currentColor = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
  loginContainer.style.display = "none";
  chatContainer.style.display = "flex";
  listenForMessages();
};

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    currentColor = ADMIN_EMAILS.includes(user.email) ? "#FF4C4C" : NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
    listenForMessages();
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
  if (isLink && (!currentUser.email || !ADMIN_EMAILS.includes(currentUser.email))) {
    alert("Links are not allowed.");
    messageInput.value = "";
    return;
  }

  const msg = {
    name: currentUser.displayName,
    email: currentUser.email || null,
    photo: currentUser.photoURL || "https://www.gravatar.com/avatar/?d=mp",
    color: currentColor,
    text,
    timestamp: Date.now()
  };

  db.ref("messages").push(msg);
  messageInput.value = "";
}

function listenForMessages() {
  db.ref("messages").on("value", (snapshot) => {
    chatMessages.innerHTML = "";
    const now = Date.now();

    snapshot.forEach((child) => {
      const msg = child.val();
      if (now - msg.timestamp >= 86400000) {
        db.ref("messages/" + child.key).remove();
        return;
      }

      const isSender = currentUser.email === msg.email;
      const isAdmin = ADMIN_EMAILS.includes(msg.email);
      const isCurrentAdmin = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);

      const msgEl = document.createElement("div");
      msgEl.className = `message ${isSender ? "sent" : "received"}`;
      msgEl.innerHTML = `
        <img class="profile-img" src="${msg.photo}" />
        <div class="bubble">
          <div class="name" style="color:${isAdmin ? '#FF4C4C' : msg.color || '#fff'}">
            ${msg.name}${isAdmin ? ' <span class="material-icons" style="font-size:14px;color:#1D9BF0;">verified</span>' : ''}
          </div>
          <div>${msg.text}</div>
          <div class="time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
        ${isCurrentAdmin ? `<span class="material-icons delete-icon" onclick="deleteMessage('${child.key}')">delete</span>` : ""}
      `;
      chatMessages.appendChild(msgEl);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function deleteMessage(key) {
  if (confirm("Delete this message?")) {
    db.ref("messages/" + key).remove();
  }
}

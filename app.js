// ✅ Restrict to Blogspot domain only
if (location.hostname !== "24sports-network.blogspot.com") {
  location.href = "https://24sports-network.blogspot.com";
}

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD4-VCUGPN1XyQ1Xr-nsygATasnRrukWr4",
  authDomain: "spn-livechat.firebaseapp.com",
  projectId: "spn-livechat",
  storageBucket: "spn-livechat.appspot.com",
  messagingSenderId: "979619554738",
  appId: "1:979619554738:web:a36c0a793988913d5670ab"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ✅ DOM references
const loginBtn = document.getElementById('login-btn');
const chatContainer = document.getElementById('chat-container');
const loginContainer = document.getElementById('login-container');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');

// ✅ Admin list
const admins = ["24sports.social@gmail.com"];
let currentUser = null;

// ✅ Login with Google
loginBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});

// ✅ Monitor login status
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    listenMessages();
  }
});

// ✅ Message send events
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ✅ Send message logic
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const isLink = /(https?:\/\/|www\.)\S+/i.test(text);
  if (isLink && !admins.includes(currentUser.email)) {
    alert("Links are not allowed.");
    return;
  }

  const now = new Date();
  const msg = {
    uid: currentUser.uid,
    name: currentUser.displayName,
    photo: currentUser.photoURL || '',
    text: text,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime()
  };

  db.ref('messages').push(msg);
  messageInput.value = '';
}

// ✅ Load and display messages
function listenMessages() {
  db.ref('messages').on('value', snapshot => {
    chatMessages.innerHTML = '';
    snapshot.forEach(child => {
      const msg = child.val();
      if (Date.now() - msg.timestamp > 86400000) return; // hide old msgs >24h

      const div = document.createElement('div');
      div.className = 'message ' + (msg.uid === currentUser.uid ? 'sent' : 'received');

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.innerHTML = `
        <div class="name">${msg.name}</div>
        ${msg.text}
        <div class="time">${msg.time}</div>
      `;

      div.appendChild(bubble);
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ✅ Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

let currentUser;
let isAdmin = false;

// ✅ Add your admin emails here
const admins = ['admin1@example.com', 'admin2@example.com'];

// 🔐 Authenticate with Google
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    isAdmin = admins.includes(user.email);
    loadMessages();
  } else {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
});

// ✅ Load Messages
function loadMessages() {
  const msgContainer = document.getElementById('messages');
  db.ref('messages').on('child_added', snapshot => {
    const msg = snapshot.val();
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(msg.uid === currentUser.uid ? 'sent' : 'received');

    const pfp = document.createElement('img');
    pfp.className = 'pfp';
    pfp.src = msg.photo || 'https://www.gravatar.com/avatar/?d=mp';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `
      <div class="name">${msg.name}</div>
      ${msg.image ? `<img src="${msg.image}" style="max-width:100%;border-radius:8px;margin-top:5px;">` : msg.text}
      <div class="time">${msg.time}</div>
    `;

    if (isAdmin && msg.uid !== currentUser.uid) {
      const delBtn = document.createElement('button');
      delBtn.innerText = '🗑️';
      delBtn.style.marginLeft = '5px';
      delBtn.onclick = () => {
        db.ref('messages/' + snapshot.key).remove();
        msgDiv.remove();
      };
      bubble.appendChild(delBtn);
    }

    msgDiv.appendChild(pfp);
    msgDiv.appendChild(bubble);
    msgContainer.appendChild(msgDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  });
}

// ✅ Send Message
document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('message-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;

  // ❌ Block links if not admin
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  if (linkRegex.test(text) && !isAdmin) {
    alert("Links are not allowed.");
    return;
  }

  const now = new Date();
  const message = {
    uid: currentUser.uid,
    name: currentUser.displayName,
    photo: currentUser.photoURL,
    text,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime()
  };

  db.ref('messages').push(message);
  input.value = '';
}

// ✅ Handle Image Upload (Gallery only, max 5MB)
document.getElementById('media-upload').onchange = function (e) {
  const file = e.target.files[0];
  if (!file || file.size > 5 * 1024 * 1024) {
    alert("Only image files up to 5MB are allowed.");
    return;
  }

  const ref = storage.ref('images/' + Date.now() + '-' + file.name);
  ref.put(file).then(snapshot => snapshot.ref.getDownloadURL()).then(url => {
    const now = new Date();
    const msg = {
      uid: currentUser.uid,
      name: currentUser.displayName,
      photo: currentUser.photoURL,
      image: url,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime()
    };
    db.ref('messages').push(msg);
  });
};

// ✅ Logout
function logout() {
  auth.signOut();
}

// ✅ Auto-delete messages after 24 hours
function autoDeleteOldMessages() {
  const now = Date.now();
  db.ref('messages').once('value', snapshot => {
    snapshot.forEach(child => {
      const msg = child.val();
      if (msg.timestamp && now - msg.timestamp > 24 * 60 * 60 * 1000) {
        db.ref('messages/' + child.key).remove();
      }
    });
  });
}

// 🕐 Run auto-delete when page loads
autoDeleteOldMessages();
// 🔁 Optionally repeat every 5 minutes
setInterval(autoDeleteOldMessages, 5 * 60 * 1000);

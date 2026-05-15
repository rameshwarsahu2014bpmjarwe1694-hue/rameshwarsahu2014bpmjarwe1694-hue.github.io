// Page loaded
window.onload = function () {
console.log("script.js loaded");
};

/* Firebase wait helper */
function waitForFirebase(callback) {
if (
window.auth &&
window.db &&
window.signInWithEmailAndPassword &&
window.createUserWithEmailAndPassword
) {
callback();
} else {
setTimeout(function () {
waitForFirebase(callback);
}, 300);
}
}

/* =========================
ADMIN LOGIN
========================= */
window.adminLogin = function () {

const email = document.getElementById("adminEmail").value.trim();
const password = document.getElementById("adminPassword").value;

if (!email || !password) {
alert("Enter email and password");
return;
}

waitForFirebase(function () {

window.signInWithEmailAndPassword(window.auth, email, password)
.then(function () {
alert("Admin Login Successful");
localStorage.setItem("isAdmin", "true");
window.location.href = "admin-panel.html";
})
.catch(function (error) {
alert(error.message);
});

});

};

/* =========================
CANDIDATE LOGIN
========================= */
window.candidateLogin = function () {

const email = document.getElementById("loginEmail").value.trim();
const password = document.getElementById("loginPassword").value;

if (!email || !password) {
alert("Enter email and password");
return;
}

waitForFirebase(function () {

window.signInWithEmailAndPassword(window.auth, email, password)
.then(async function (userCredential) {

const user = userCredential.user;

const { doc, getDoc, setDoc } = await import(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
);

const ref = doc(window.db, "candidates", user.uid);
const snap = await getDoc(ref);

if (!snap.exists()) {
await setDoc(ref, {
uid: user.uid,
email: user.email,
name: "",
mobile: "",
createdAt: new Date().toISOString()
});
}

alert("Login Successful");
window.location.href = "dashboard.html";

})
.catch(function (error) {
alert(error.message);
});

});

};
window.resetPassword = function () {

  let email = document.getElementById("loginEmail").value.trim();

  if(email === ""){
    alert("Please enter your registered email first.");
    return;
  }

  window.sendPasswordResetEmail(window.auth, email)
  .then(() => {
    alert("Password reset link sent.\n\nCheck Inbox + Spam folder.");
  })
  .catch((error) => {
    alert(error.message);
  });

};
/* =========================
REGISTER
========================= */
window.register = function () {

const name = document.getElementById("name").value.trim();
const mobile = document.getElementById("mobile").value.trim();
const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

if (!name || !mobile || !email || !password) {
alert("Fill all fields");
return;
}

waitForFirebase(async function () {

try {

const userCredential =
await window.createUserWithEmailAndPassword(window.auth, email, password);

const uid = userCredential.user.uid;

const { doc, setDoc } = await import(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
);

await setDoc(doc(window.db, "candidates", uid), {
name: name,
mobile: mobile,
email: email,
uid: uid,
createdAt: new Date().toISOString()
});

alert("Registration Successful");
window.location.href = "login.html";

} catch (error) {

if (error.code === "auth/email-already-in-use") {
alert("This email is already registered. Please login.");
} 
else if (error.code === "auth/invalid-email") {
alert("Invalid email format");
} 
else if (error.code === "auth/weak-password") {
alert("Password must be at least 6 characters");
} 
else {
alert("Error: " + error.message);
}

}

});

};
/* =========================
LOGOUT
========================= */
window.logout = function () {

waitForFirebase(function () {

window.signOut(window.auth)
.then(function () {
alert("Logged Out");
window.location.href = "index.html";
})
.catch(function (error) {
alert(error.message);
});

});

};

import { auth, db } from './firebase.js';

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

   
    await addDoc(collection(db, "users"), {
      userId: user.uid,
      username,
      name,
      email,
      createdAt: new Date()
    });

    alert("V-ați înregistrat cu succes!");
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Signup error:", error);
    alert("Eroare la înregistrare: " + error.message);
  }
});

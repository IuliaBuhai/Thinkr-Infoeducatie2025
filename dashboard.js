import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let currentUser = null;  


const greetingElement = document.getElementById('greeting');
const logoutBtn        = document.getElementById('logoutBtn');
const form             = document.getElementById("StudyPlansForm");
const loading          = document.getElementById("loading");
const output           = document.getElementById("planOutput");


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return window.location.href = 'login.html';
  }

  currentUser = user;


  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      const { name = "Utilizator", username = "" } = userSnap.data();
      greetingElement.textContent = `Bine ai venit, ${name} (${username})!`;
    } else {
      greetingElement.textContent = "Bine ai venit!";
    }
  } catch (err) {
    console.error("Eroare la încărcare date utilizator:", err);
    greetingElement.textContent = "Bine ai venit!";
  }


  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = 'login.html';
    } catch (err) {
      console.error("Eroare la deconectare:", err);
      alert("Eroare la deconectare: " + err.message);
    }
  });

  initPlansForm();
});


function initPlansForm() {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const grade   = document.getElementById("grade").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const title   = document.getElementById("title").value.trim();
    const days    = document.getElementById("days").value.trim();
    const hours   = document.getElementById("hours").value.trim();

    const formData = {
      grade,
      subject,
      title,
      days:  days  ? Number(days)  : null,
      hours: hours ? Number(hours) : null
    };

    loading.style.display  = "block";
    output.innerHTML        = "";

    try {
      
      const res = await fetch("/.netlify/functions/generatePlan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Eroare la generare plan");

      await addDoc(collection(db, "studyPlans"), {
        ...formData,
        userId:    currentUser.uid,
        createdAt: new Date(),
        plan:      result.plan
      });

      displayFormattedPlan(result.plan);
    } catch (err) {
      output.innerHTML = `<p style="color:red;">${err.message}</p>`;
    } finally {
      loading.style.display = "none";
    }
  });
}

function displayFormattedPlan(plan) {
  output.innerHTML = "";
  plan.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.innerHTML = `<h3> ${day.day}</h3>`;
    const ul = document.createElement("ul");
    day.tasks.forEach(task => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${task.title}</strong>: ${task.description}
        <em>(${task.duration} min)</em>
      `;
      
      ul.appendChild(li);
    });
    dayDiv.appendChild(ul);
    output.appendChild(dayDiv);
  });
}

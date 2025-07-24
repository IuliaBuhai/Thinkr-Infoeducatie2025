import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return window.location.href = 'login.html';
  }
  currentUser = user;
  username = await getUserName();
  initPrefForm();
});

async function getUserName() {
  const userQuery = query(
    collection(db, "users"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(userQuery);
  return snapshot.docs[0].data().username;
}

async function averageStudySessions() {
  const sessionsQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid),
    where("seconds", ">=", "60")
  );
  let secondsSum = 0;
  let count = 0;
  const snapshot = await getDocs(sessionsQuery);
  snapshot.forEach(doc => {
    const data = doc.data();
    secondsSum += data.seconds;
    count++;
  });

  const avgMinutes = (secondsSum / count) / 60;
  return avgMinutes || 30; 
}

async function getLearnerType() {
  const userQuery = query(
    collection(db, "testResults"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(userQuery);
  const data = snapshot.docs[0].data();
  const result = data.results;

  // Find the learner type with the highest score
  const maxScore = Math.max(result["Auditiv"], result["Vizual"], result["Tactil"]);
  return Object.keys(result).find(key => result[key] === maxScore);
}

async function displayPrefForm() {
  const form = document.getElementById("prefForm");
  form.style.display = "block";
}

function renderStudyPlan(planData) {
  const container = document.getElementById("studyPlanContainer");
  container.innerHTML = ""; 

  planData.plan.forEach(dayPlan => {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day-plan");

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = dayPlan.day;
    dayDiv.appendChild(dayTitle);

    dayPlan.tasks.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.classList.add("task");

      const title = document.createElement("h4");
      title.textContent = task.title;
      taskDiv.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = task.description;
      taskDiv.appendChild(desc);

      const duration = document.createElement("p");
      duration.innerHTML = `<strong>Durată:</strong> ${task.duration} minute`;
      taskDiv.appendChild(duration);

      const resources = document.createElement("div");
      const webLinks = task.resources.web.map(link => `<a href="${link}" target="_blank">${link}</a>`).join(", ");
      const bookList = task.resources.books.join(", ");
      resources.innerHTML = `
        <p><strong>Web:</strong> ${webLinks}</p>
        <p><strong>Cărți:</strong> ${bookList}</p>
      `;
      taskDiv.appendChild(resources);

      dayDiv.appendChild(taskDiv);
    });

    container.appendChild(dayDiv);
  });
}

async function initPrefForm() {
  const prefQuery = query(
    collection(db, "preferences"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(prefQuery);

  if (!snapshot.empty) {
    return;
  }

  displayPrefForm();

  const form = document.getElementById("prefForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const age = document.getElementById("age").value.trim();
    const preferedTime = document.getElementById("preferedTime").value.trim();
    const tasks = document.getElementById("tasks").value.trim();

    const avgStudy = await averageStudySessions();
    const learnerType = await getLearnerType();

    await addDoc(collection(db, "preferences"), {
      userId: currentUser.uid,
      age: age,
      avgStudySession: avgStudy,
      preferedTime: preferedTime,
      learnerType: learnerType,
      tasks: tasks,
    });

    form.style.display = "none";

    
    const response = await fetch("/.netlify/functions/generatePersonalisedPlans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        age: age,
        tasks: tasks,
        avgStudyTime: avgStudy,
        learnerType: learnerType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Plan generation failed:", error);
    } else {
      const data = await response.json();
      renderStudyPlan(data); 
    }
  });
}

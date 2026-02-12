import { auth, db } from '/auth/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, query, where, getDocs,updateDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return window.location.href = 'login.html';
  }

  currentUser = user;
  let username = await getUserName();
  await initPrefForm();     
  await initPlanForm();     
  await loadExistingPlan();
});

async function getUserName() {
  const userQuery = query(
    collection(db, "users"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(userQuery);

  if (snapshot.empty) {
    console.warn("User nu a fost găsit:", currentUser.uid);
    return "Utilizator";
  }

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
  const resultQuery = query(
    collection(db, "testResults"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(resultQuery);

  if (snapshot.empty) {
    return "Vizual"; 
  }

  const result = snapshot.docs[0].data().results;
  const maxScore = Math.max(result["Auditiv"], result["Vizual"], result["Tactil"]);
  return Object.keys(result).find(key => result[key] === maxScore);
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
      const webResources = Array.isArray(task.resources?.web)
      ? task.resources.web
      : [];

    const bookResources = Array.isArray(task.resources?.books)
      ? task.resources.books
      : [];

      const webLinks = webResources
        .map(link => `<a href="${link}" target="_blank">${link}</a>`)
        .join(", ");

      const bookList = bookResources.join(", ");


      resources.innerHTML = `
        <p><strong>Web:</strong> ${webLinks}</p>
        <p><strong>Cărți:</strong> ${bookList}</p>
      `;
      taskDiv.appendChild(resources);

      dayDiv.appendChild(taskDiv);
    });

    container.appendChild(dayDiv);
  });
      
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = "";
      
        planData.plan.forEach(dayPlan => {
          const dayDiv = document.createElement("div");
          dayDiv.classList.add("day-column");
      
          const dayHeader = document.createElement("h4");
          dayHeader.textContent = dayPlan.day;
          dayDiv.appendChild(dayHeader);
      
          dayPlan.tasks.forEach(task => {
            const taskDiv = document.createElement("div");
            taskDiv.classList.add("task-title");
            taskDiv.textContent = task.title;
      
            
      taskDiv.addEventListener("click", () => {
        const webResources = Array.isArray(task.resources?.web)
          ? task.resources.web
          : [];

        const bookResources = Array.isArray(task.resources?.books)
          ? task.resources.books
          : [];

        document.getElementById("modalTitle").textContent = task.title;
        document.getElementById("modalDescription").textContent = task.description;
        document.getElementById("modalDuration").textContent = task.duration;

        document.getElementById("modalWeb").innerHTML =
          webResources.length
            ? webResources.map(link => `<a href="${link}" target="_blank">${link}</a>`).join(", ")
            : "—";

        document.getElementById("modalBooks").textContent =
          bookResources.length ? bookResources.join(", ") : "—";

        document.getElementById("taskModal").classList.remove("hidden");
      });


      dayDiv.appendChild(taskDiv);
    });

    calendar.appendChild(dayDiv);
  });

  
  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("taskModal").classList.add("hidden");
  });


  window.addEventListener("click", (e) => {
    const modal = document.getElementById("taskModal");
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

async function initPrefForm() {
  const prefQuery = query(
    collection(db, "preferences"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(prefQuery);

  if (!snapshot.empty) return; 

  const form = document.getElementById("prefForm");
  form.style.display = "block";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const age = document.getElementById("age").value.trim();
    const preferedTime = document.getElementById("preferedTime").value.trim();
    const avgStudy = await averageStudySessions();
    const learnerType = await getLearnerType();

    await addDoc(collection(db, "preferences"), {
      userId: currentUser.uid,
      age: age,
      avgStudySession: avgStudy,
      preferedTime: preferedTime,
      learnerType: learnerType,
    });

    form.style.display = "none";
    alert("Preferințele au fost salvate. Poți acum genera planuri.");
  });
}

 async function loadExistingPlan() {
  document.getElementById("calendar").innerHTML = "<p>Se încarcă planul tău...</p>";
  const planQuery = query(
    collection(db, "weekPlan"),
    where("userId", "==", currentUser.uid)
  );
  const snapshot = await getDocs(planQuery);

  if (!snapshot.empty) {
    const existingData = snapshot.docs[0].data().plan;
    renderStudyPlan(existingData);
  }else {
  document.getElementById("calendar").innerHTML = "<p>Nu ai un plan generat încă.</p>";
  }
}


async function initPlanForm() {
  const form = document.getElementById("planForm");

  form.addEventListener("submit", async (e) => {
    document.getElementById("calendar").innerHTML = "<p>Se generează planul tău...</p>";
    document.getElementById("generatePlanButton").disabled = true;
    e.preventDefault();

    const taskInput = document.getElementById("planTasks").value.trim();
    const avgStudy = await averageStudySessions();
    const learnerType = await getLearnerType();

    const prefQuery = query(
      collection(db, "preferences"),
      where("userId", "==", currentUser.uid)
    );
    const snapshot = await getDocs(prefQuery);

    if (snapshot.empty) {
      alert("Mai întâi completează preferințele.");
      return;
    }

    const age = snapshot.docs[0].data().age;

    const response = await fetch("/.netlify/functions/generatePersonalisedPlans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: age,
        tasks: taskInput,
        avgStudyTime: avgStudy,
        learnerType: learnerType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Plan generation failed:", error);
    } else {
      const data = await response.json();

      const planQuery = query(
        collection(db, "weekPlan"),
        where("userId", "==", currentUser.uid)
      )

      const snapshot = await getDocs(planQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, "weekPlan"), {
          userId: currentUser.uid,
          plan: data,
          createdAt: new Date(),
        });
      } else {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          plan: data,
          updatedAt: new Date(),
        });
      }

      renderStudyPlan(data);
      document.getElementById("generatePlanButton").disabled = false;
    }
  });
}

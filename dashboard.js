import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, doc,  query, where, orderBy, getDocs ,getDoc} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let currentUser = null;  


const greetingElement = document.getElementById('greeting');
const logoutBtn        = document.getElementById('logoutBtn');
const form             = document.getElementById("StudyPlanForm");
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
  displayPlansHistory();
  initPlansForm();
  initTimerLogic();
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

      displayPlansHistory();
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
    dayDiv.className="plan-day";
    const ul = document.createElement("ul");
    day.tasks.forEach(task => {
      const li = document.createElement("li");
      li.className="task";
      li.innerHTML = `
        <strong>${task.title}</strong>: ${task.description}
        <em><span class="duration">(${task.duration} min)</span></em>
      `;
      
      ul.appendChild(li);
    });
    dayDiv.appendChild(ul);
    output.appendChild(dayDiv);
  });
  if (!plan || plan.length === 0) {
  output.innerHTML = "<p>Planul este gol sau nu a fost generat corect.</p>";
  return;
}

}


async function displayPlansHistory(){
  console.log("Current user ID:", currentUser?.uid);
  const plans = query(
    collection(db, "studyPlans"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(plans);
  console.log("Planuri gasite:", snapshot.size);
  
  const displayHistory = document.getElementById("displayHistory");
  displayHistory.innerHTML = '';

  if (snapshot.empty) {
    displayHistory.innerHTML = "<p>Nu există planuri în istoric.</p>";
    return;
  }

  const dl = document.createElement("dl");
  dl.className = "history";

  snapshot.forEach(doc => {
    const data = doc.data();
    const dt = document.createElement("dt");
    dt.innerHTML = `${data.title}-${data.subject}`;

    const dd = document.createElement("dd");
    const createdAtDate = data.createdAt instanceof Date
      ? data.createdAt
      : data.createdAt?.toDate?.() || new Date(0);
    dd.innerHTML = `creat la: ${createdAtDate.toLocaleDateString()}`;

    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  displayHistory.appendChild(dl);
}


function initTimerLogic(){
 

  //logica ceas
    const clock = document.getElementById('clock');
    const timeDisplay= document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const submitBtn= document.getElementById('stopBtn');
    const resetBtn= document.getElementById('resetBtn');
    
    let seconds = 0;
    let running= false;

    function startOrStop(){
      if(running){
        running = false;
      }else{
        running= true;
      }
    }

    let intervalId;
    startBtn.addEventListener("click", (e)=>{
      e.preventDefault();

        

       if(!running){
          running= true;

           intervalId= setInterval(() =>{
            seconds++;
            updateTimeDisplay();
          }, 1000);


       }

    });

    pauseBtn.addEventListener("click", (e)=>{
        e.preventDefault();

        running= false;
        clearInterval(intervalId);
    });

    submitBtn.addEventListener("click", async (e)=>{
        e.preventDefault();

        running= false;
        clearInterval(intervalId);
        startBtn.disabled=true;

        const title= document.getElementById('sessionTitle').value.trim();
        const description= document.getElementById('sessionDescription').value.trim();

        let setInterval = 0;

        await addDoc(doc(db, "studySessions"), {
            userId:    currentUser.uid,
            createdAt: new Date(),
            seconds, 
            title,
            description, 
            
        })


        alert("Sesiune încheiată, felicitări! Acum e timpul pentru o pauză")
    });

    resetBtn.addEventListener("click", (e)=>{
        e.preventDefault();

        running= false;
        clearInterval(intervalId);
        seconds=0;
        timeDisplay.textContent='00:00:00';
        startBtn.disabled= false;
    });
    let hours;
    let mins;
    let sec;
    function updateTimeDisplay(){
      let result ="";
        hours = Math.floor(seconds / 3600);
        mins = Math.floor((seconds % 3600) / 60);
        sec = seconds % 60;


        result = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        timeDisplay.textContent= result;
        

    }
    


};



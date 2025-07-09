import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, doc,  query, where, orderBy, getDocs ,getDoc, updateDoc} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-storage.js";

let currentUser = null;  
let today= new Date();
today.setHours(0,0,0,0);


let progressCircle = new ProgressBar.Circle("#goalProgressBar", {
  color:'#4CAF50',
  strokeWidth: 10, 
  trailWidth: 5,
  easing: 'easeInOut',
  duration: 1400, 
  text: {
    autoStyleContainer:false
  }, 
  from: { color: '#FF5252' },
  to: { color: '#4CAF50' },
  step:function(state, circle){
    circle.path.setAttribute("stroke", state.color);
    let value = Math.round(circle.value()*100);
    circle.setText(`${value}%`);
  }



})
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
  await displaySessionsHistory();
  await updateProgressChart();
  await loadTagSuggestions();
  await loadTitleSuggestions();
  await drawTimeDistributionChart();
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

async function displaySessionsHistory(){
  const sessions= query(
    collection(db,"studySessions"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(sessions);

    const displaySessHistory= document.getElementById("displaySessions");
    displaySessHistory.innerHTML="";
    const dl = document.createElement("dl");
    dl.className="sessHistory";

    snapshot.forEach(doc =>{
      const data= doc.data();
      const dt = document.createElement("dt");
      const dd =document.createElement("dd");
      const seconds= data.seconds;
      let result ="";
      let hours, mins, sec; 
        hours = Math.floor(seconds / 3600);
        mins = Math.floor((seconds % 3600) / 60);
        sec = seconds % 60;


      result = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      dt.innerHTML=`${data.title}-<span class= "duration">${result}</span>  `;

      const description = data.description? data.description : "" ;
      dd.textContent=`${description}`;

      dl.appendChild(dt);
      dl.appendChild(dd);
    });

    displaySessHistory.appendChild(dl);
  
}

function initTimerLogic(){
 console.log("initrLogic  ");

  //logica ceas
    const clock = document.getElementById('clock');
    const timeDisplay= document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const submitBtn= document.getElementById('stopBtn');
    const resetBtn= document.getElementById('resetBtn');
    
    let seconds = 0;
    let running= false;


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
         console.log("Start apasat");
        running= false;
        clearInterval(intervalId);
        startBtn.disabled=true;

        const title= document.getElementById('sessionTitle').value.trim();
        const description= document.getElementById('sessionDescription').value.trim();
        const tag = document.getElementById('sessionTag').value.trim();
        

        await addDoc(collection(db, "studySessions"), {
            userId:    currentUser.uid,
            createdAt: new Date(),
            seconds, 
            title,
            description, 
            tag
            
        })

        displaySessionsHistory();
        getTodayStudyTime();
        updateProgressChart();
        loadTagSuggestions();
        loadTitleSuggestions();
        await drawTimeDistributionChart();
        alert("Sesiune încheiată, felicitări! Acum e timpul pentru o pauză")
    });

    resetBtn.addEventListener("click", (e)=>{
        e.preventDefault();

        running= false;
        clearInterval(intervalId);
        seconds=0;
        timeDisplay.textContent='00:00:00';
        startBtn.disabled= false;
        displaySessionsHistory();
    });
  
    function updateTimeDisplay(){
      let result ="";
        let hours = Math.floor(seconds / 3600);
        let mins = Math.floor((seconds % 3600) / 60);
        let sec = seconds % 60;


        result = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        timeDisplay.textContent= result;
        

    }
    


};

const goalForm = document.getElementById('studyGoal');


goalForm.addEventListener("submit", initDailyGoal);
async function initDailyGoal(e){
      e.preventDefault();
      let goal = document.getElementById('timeGoal').value.trim();
      let parts= goal.split(":");
      let hours= parseInt(parts[0]);
      let minutes = parseInt(parts[1]);
      let seconds = 60*minutes+ 3600*hours;
      
      const prevGoal= query(
            collection(db, "studyGoal"),
            where("userId", "==", currentUser.uid),
            where("date", ">=" , today)
      );
      
      const snapshot = await getDocs(prevGoal);

        if(snapshot.empty){

          await addDoc(collection(db, "studyGoal"), {
            userId: currentUser.uid,
            goal : seconds,
            date : new Date(),
            
          })
           alert("Obiectiv salvat cu succes!");
        }else{
          const docRef = snapshot.docs[0].ref;
          await updateDoc(docRef, {
            
            goal : seconds,
            date : new Date()

            
          })
          alert("Obiectiv actualizat cu succes!");
        }

        updateProgressChart();
      };


async function getTodayStudyTime(){

      let todayStudyTime=0;
      let todayStart= new Date();
      todayStart.setHours(0,0,0,0);

      let tomorowStart= new Date(todayStart);
      tomorowStart.setDate(tomorowStart.getDate()+1);
      const sessionsToday = query(
        
        collection(db, "studySessions"), 
        where("userId", "==", currentUser.uid), 
        where("createdAt",">=", todayStart), 
        where("createdAt", "<", tomorowStart)
      );

      const snapshot = await getDocs(sessionsToday);

      snapshot.forEach(doc =>{
        const data= doc.data();
        todayStudyTime+= data.seconds || 0;

      });

      return todayStudyTime;


}
function formatTime(time){
  let hours =Math.floor(time/3600);
  let minutes= Math.floor((time%3600)/60);
  let seconds =Math.floor(time%60)

  let result = `${hours.toString().padStart(2,0)}:${minutes.toString().padStart(2,0)}:${seconds.toString().padStart(2,0)}`;
  return result;
}





async function updateProgressChart(){
      const todayStudyTime= await getTodayStudyTime();
      const goalToday = query(
        collection(db, "studyGoal"),
        where ("userId", "==", currentUser.uid), 
      )
  
      const snapshot = await getDocs(goalToday);

        if (snapshot.empty) {
          console.warn("No study goal found for today.");
          progressCircle.set(0);
          progressCircle.setText("0%");
          return;
        }

        const goalData = snapshot.docs[0].data();
        const goal = goalData.goal || 1; 
        const progress = todayStudyTime / goal;

        progressCircle.animate(progress); 
      }




async function drawTimeDistributionChart() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const sessionsToday = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid),
    where("createdAt", ">=", todayStart),
    where("createdAt", "<", tomorrowStart)
  );

  const snapshot = await getDocs(sessionsToday);

  const taskDurations = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title || "Necunoscut";
    const seconds = data.seconds || 0;
    if (!taskDurations[title]) taskDurations[title] = 0;
    taskDurations[title] += seconds;
  });

  const labels = Object.keys(taskDurations);
  const data = Object.values(taskDurations).map(sec => (sec / 60).toFixed(1)); // minutes

  const ctx = document.getElementById('timeDistributionChart').getContext('2d');
  if (window.timeChart) window.timeChart.destroy(); 
  window.timeChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Minute petrecute pe task (azi)',
        data: data,
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Distribuția timpului de studiu pe taskuri (azi)'
        }
      }
    }
  });
}



async function loadTagSuggestions(){
  const sessionsQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(sessionsQuery);

  const tagSet = new Set();
  snapshot.forEach(doc => {
    const tag = doc.data().tag?.trim();
    if(tag) tagSet.add(tag);

  });

  const tagSuggestions = document.getElementById("tagSuggestions");
  tagSuggestions.innerHTML="";

  tagSet.forEach(tag =>{
    const option = document.createElement("option");
    option.value= tag;
    tagSuggestions.appendChild(option);
  });


}


async function loadTitleSuggestions(){
  const sessionsQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(sessionsQuery);
  const titleSet = new Set();

  snapshot.forEach(doc =>{
    const title = doc.data().title?.trim();
    if(title) titleSet.add(title);
  });

  const titleSuggestions = document.getElementById("titleSuggestion");
  titleSuggestions.innerHTML="";

  titleSet.forEach(tag=>{
    const option = document.createElement("option");
    option.value= tag;
    titleSuggestions.appendChild(option);
  });
}

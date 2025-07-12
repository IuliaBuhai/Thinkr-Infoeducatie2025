import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, doc, query, where, orderBy, getDocs, getDoc, updateDoc, limit } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-storage.js";

Chart.register(ChartDataLabels);


let currentUser = null;
let today = new Date();
today.setHours(0, 0, 0, 0);

let progressCircle = new ProgressBar.Circle("#goalProgressBar", {
  color: '#4CAF50',
  strokeWidth: 10,
  trailWidth: 5,
  easing: 'easeInOut',
  duration: 1400,
  text: {
    autoStyleContainer: false
  },
  from: { color: '#FF5252' },
  to: { color: '#4CAF50' },
  step: function(state, circle) {
    circle.path.setAttribute("stroke", state.color);
    let value = Math.round(circle.value() * 100);
    circle.setText(`${value}%`);
  }
});


const greetingElement = document.getElementById('greeting');
const logoutBtn = document.getElementById('logoutBtn');
const form = document.getElementById("StudyPlanForm");
const loading = document.getElementById("loading");
const output = document.getElementById("planOutput");
const goalForm = document.getElementById('studyGoal');

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

    displayPlansHistory();
    initPlansForm();
    initTimerLogic();
    await displaySessionsHistory();
    await updateProgressChart();
    await loadTagSuggestions();
    await loadTitleSuggestions();
    await drawTimeDistributionChart();
    console.log('drawWeeklyChart');
    await drawWeeklyChart();
    await renderHeatmap();

    // Set up logout
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = 'login.html';
      } catch (err) {
        console.error("Eroare la deconectare:", err);
        alert("Eroare la deconectare: " + err.message);
      }
    });

  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
});


function initPlansForm() {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const grade = document.getElementById("grade").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const title = document.getElementById("title").value.trim();
    const days = document.getElementById("days").value.trim();
    const hours = document.getElementById("hours").value.trim();

    const formData = {
      grade,
      subject,
      title,
      days: days ? Number(days) : null,
      hours: hours ? Number(hours) : null
    };

    loading.style.display = "block";
    output.innerHTML = "";

    try {
      const res = await fetch("/.netlify/functions/generatePlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Eroare la generare plan");

      await addDoc(collection(db, "studyPlans"), {
        ...formData,
        userId: currentUser.uid,
        createdAt: new Date(),
        plan: result.plan
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
  if (!plan || plan.length === 0) {
    output.innerHTML = "<p>Planul este gol sau nu a fost generat corect.</p>";
    return;
  }

  plan.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.innerHTML = `<h3>${day.day}</h3>`;
    dayDiv.className = "plan-day";
    const ul = document.createElement("ul");
    day.tasks.forEach(task => {
      const li = document.createElement("li");
      li.className = "task";
      li.innerHTML = `
        <strong>${task.title}</strong>: ${task.description}
        <em><span class="duration">(${task.duration} min)</span></em>
      `;
      ul.appendChild(li);
    });
    dayDiv.appendChild(ul);
    output.appendChild(dayDiv);
  });
}

async function displayPlansHistory() {
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


async function displaySessionsHistory() {
  const sessions = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(sessions);
  const displaySessHistory = document.getElementById("displaySessions");
  displaySessHistory.innerHTML = "";
  const dl = document.createElement("dl");
  dl.className = "sessHistory";

  snapshot.forEach(doc => {
    const data = doc.data();
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const seconds = data.seconds;
    let result = "";
    let hours, mins, sec;
    hours = Math.floor(seconds / 3600);
    mins = Math.floor((seconds % 3600) / 60);
    sec = seconds % 60;

    result = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    dt.innerHTML = `<b>${data.tag}</b> ->${data.title}(<span class="duration">${result}</span> ) `;

    const description = data.description ? data.description : "";
    dd.textContent = `${description}`;

    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  displaySessHistory.appendChild(dl);
}


function initTimerLogic() {
  const timeDisplay = document.getElementById('time');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const submitBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  let seconds = 0;
  let running = false;
  let intervalId;

  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!running) {
      running = true;
      intervalId = setInterval(() => {
        seconds++;
        updateTimeDisplay();
      }, 1000);
    }
  });

  pauseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    running = false;
    clearInterval(intervalId);
  });
  
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    running = false;
    clearInterval(intervalId);
    startBtn.disabled = true;

    const title = document.getElementById('sessionTitle').value.trim();
    const description = document.getElementById('sessionDescription').value.trim();
    const tag = document.getElementById('sessionTag').value.trim();
    
    await addDoc(collection(db, "studySessions"), {
      userId: currentUser.uid,
      createdAt: new Date(),
      seconds,
      title,
      description,
      tag
    });

    displaySessionsHistory();
    updateProgressChart();
    await loadTagSuggestions();
    await loadTitleSuggestions();
    await drawTimeDistributionChart();
    await drawWeeklyChart();
    alert("Sesiune încheiată, felicitări! Acum e timpul pentru o pauză");
  });

  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    running = false;
    clearInterval(intervalId);
    seconds = 0;
    timeDisplay.textContent = '00:00:00';
    startBtn.disabled = false;
  });
  
  function updateTimeDisplay() {
    let hours = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let sec = seconds % 60;

    const result = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    timeDisplay.textContent = result;
  }
}


goalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  let goal = document.getElementById('timeGoal').value.trim();
  let parts = goal.split(":");
  let hours = parseInt(parts[0]);
  let minutes = parseInt(parts[1]);
  let seconds = 60 * minutes + 3600 * hours;
  
  const prevGoal = query(
    collection(db, "studyGoal"),
    where("userId", "==", currentUser.uid),
    where("date", ">=", today)
  );
  
  const snapshot = await getDocs(prevGoal);

  if (snapshot.empty) {
    await addDoc(collection(db, "studyGoal"), {
      userId: currentUser.uid,
      goal: seconds,
      date: new Date(),
    });
    alert("Obiectiv salvat cu succes!");
  } else {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      goal: seconds,
      date: new Date()
    });
    alert("Obiectiv actualizat cu succes!");
  }

  updateProgressChart();
});


async function getTodayStudyTime() {
  let todayStudyTime = 0;
  let todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const sessionsToday = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid),
    where("createdAt", ">=", todayStart),
    where("createdAt", "<", tomorrowStart)
  );

  const snapshot = await getDocs(sessionsToday);
  snapshot.forEach(doc => {
    const data = doc.data();
    todayStudyTime += data.seconds || 0;
  });

  return todayStudyTime;
}

function formatTime(time) {
  let hours = Math.floor(time / 3600);
  let minutes = Math.floor((time % 3600) / 60);
  let seconds = Math.floor(time % 60);

  let result = `${hours.toString().padStart(2, 0)}:${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`;
  return result;
}

async function loadTagSuggestions() {
  const sessionsQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(sessionsQuery);
  const tagSet = new Set();
  snapshot.forEach(doc => {
    const tag = doc.data().tag?.trim();
    if (tag) tagSet.add(tag);
  });

  const tagSuggestions = document.getElementById("tagSuggestions");
  tagSuggestions.innerHTML = "";

  tagSet.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    tagSuggestions.appendChild(option);
  });
}

async function loadTitleSuggestions() {
  const sessionsQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(sessionsQuery);
  const titleSet = new Set();

  snapshot.forEach(doc => {
    const title = doc.data().title?.trim();
    if (title) titleSet.add(title);
  });

  const titleSuggestions = document.getElementById("titleSuggestions");
  titleSuggestions.innerHTML = "";

  titleSet.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    titleSuggestions.appendChild(option);
  });
}


async function updateProgressChart() {
  try {
    const todayStudyTime = await getTodayStudyTime();
    const goalToday = query(
      collection(db, "studyGoal"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(goalToday);
    
    if (snapshot.empty) {
      console.warn("No study goal found for today.");
      progressCircle.set(0);
      document.getElementById('goalProgressLabel').textContent = "0%";
      document.getElementById('progressText').textContent = "Nu ai setat un obiectiv";
      document.getElementById('progressText').style.color = "var(--text-secondary)";
      document.getElementById('progressComparison').textContent = "";
      return;
    }

    const goalData = snapshot.docs[0].data();
    const goal = goalData.goal || 1;
    const progress = Math.min(todayStudyTime / goal, 1); 

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const prevWeekGoal = await getDocs(query(
      collection(db, "studyGoal"),
      where("userId", "==", currentUser.uid),
      where("date", ">=", weekAgo),
      where("date", "<", today),
      orderBy("date", "desc"),
      limit(1)
    ));

    let comparisonText = "";
    if (!prevWeekGoal.empty) {
      const prevGoal = prevWeekGoal.docs[0].data().goal;
      const difference = ((todayStudyTime - prevGoal) / prevGoal) * 100;
      comparisonText = difference >= 0 
        ? `+${Math.round(difference)}% față de săptămâna trecută` 
        : `${Math.round(difference)}% față de săptămâna trecută`;
    }

    
    document.getElementById('progressComparison').textContent = comparisonText;
    
    progressCircle.animate(progress, {
      duration: 1500,
      step: (state, circle) => {
        const value = Math.round(circle.value() * 100);
        document.getElementById('goalProgressLabel').textContent = `${value}%`;
        
        
        const progressText = document.getElementById('progressText');
        if (value < 30) {
          progressText.textContent = 'Începe să studiezi';
          progressText.style.color = 'var(--danger)';
        } else if (value < 70) {
          progressText.textContent = 'Continuă așa!';
          progressText.style.color = 'var(--warning)';
        } else {
          progressText.textContent = 'Excelent!';
          progressText.style.color = 'var(--success)';
        }
      }
    });

  } catch (error) {
    console.error("Error updating progress chart:", error);
  }
}

async function drawTimeDistributionChart() {
  try {
    document.getElementById('distributionLoader').style.display = 'flex';
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const sessionsToday = await getDocs(query(
      collection(db, "studySessions"),
      where("userId", "==", currentUser.uid),
      where("createdAt", ">=", todayStart),
      where("createdAt", "<", tomorrowStart)
    ));

    const tagDurations = {};
    sessionsToday.forEach(doc => {
      const data = doc.data();
      const tag = data.tag || "Altele";
      tagDurations[tag] = (tagDurations[tag] || 0) + (data.seconds || 0);
    });

    const labels = Object.keys(tagDurations);
    const data = Object.values(tagDurations).map(sec => (sec / 60).toFixed(1));

  
    const generateColors = (count) => {
      const colors = [];
      const hueStep = 360 / count;
      for (let i = 0; i < count; i++) {
        colors.push(`hsl(${i * hueStep}, 70%, 60%)`);
      }
      return colors;
    };

    const ctx = document.getElementById('timeDistributionChart').getContext('2d');
    if (window.timeChart) window.timeChart.destroy();
    
    window.timeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: generateColors(labels.length),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'var(--text-primary)',
              padding: 20,
              font: {
                family: 'Inter'
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + parseFloat(b), 0);
                const value = parseFloat(context.raw);
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${value} min (${percentage}%)`;
              }
            }
          },
          datalabels: {
            formatter: (value, context) => {
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + parseFloat(b), 0);
              const percentage = Math.round((value / total) * 100);
              return `${percentage}%`;
            },
            color: 'white',
            font: {
              weight: 'bold'
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      },
      plugins: [ChartDataLabels]
    });

  } catch (error) {
    console.error("Error drawing time distribution chart:", error);
  } finally {
    document.getElementById('distributionLoader').style.display = 'none';
  }
}

async function drawWeeklyChart() {
  console.log('drawWeeklyChart creat:', new Date().toISOString());
  try {
    document.getElementById('weeklyLoader').style.display = 'flex';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6); 

    const sessions = await getDocs(query(
      collection(db, "studySessions"),
      where("userId", "==", currentUser.uid),
      where("createdAt", ">=", weekStart),
      where("createdAt", "<=", today)
    ));

 
    const dailyTotals = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' });
      dailyTotals[dateKey] = 0;
    }

    
    sessions.forEach(doc => {
      const sessionDate = doc.data().createdAt.toDate();
      const dateKey = sessionDate.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' });
      dailyTotals[dateKey] += doc.data().seconds || 0;
    });

 
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' });
      labels.push(dateKey);
      data.push((dailyTotals[dateKey] / 60).toFixed(1)); 
    }

    const ctx = document.getElementById('weeklyStudyChart').getContext('2d');
    if (window.weeklyChart) window.weeklyChart.destroy();

    window.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ore de studiu',
          data: data,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(77, 142, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(77, 142, 255, 0.8)');
            return gradient;
          },
          borderColor: 'rgba(77, 142, 255, 1)',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: 'var(--text-secondary)',
              callback: (value) => `${value} min`
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'var(--text-secondary)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const hours = (context.raw / 60).toFixed(1);
                return `${hours} ore`;
              }
            }
          }
        },
        animation: false,
      }
    });

  } catch (error) {
    console.error("Error drawing weekly chart:", error);
  } finally {
    document.getElementById('weeklyLoader').style.display = 'none';
  }
}

async function renderHeatmap() {
  try {
    const heatmap = document.getElementById('studyHeatmap');
    heatmap.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twelveWeeksAgo = new Date(today);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); 

    
    const sessions = await getDocs(query(
      collection(db, "studySessions"),
      where("userId", "==", currentUser.uid),
      where("createdAt", ">=", twelveWeeksAgo),
      where("createdAt", "<=", today)
    ));

    
    const sessionsByDate = {};
    sessions.forEach(doc => {
      const sessionDate = doc.data().createdAt.toDate();
      const dateKey = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD
      sessionsByDate[dateKey] = (sessionsByDate[dateKey] || 0) + (doc.data().seconds || 0);
    });

    
    for (let week = 0; week < 12; week++) {
      const weekDiv = document.createElement('div');
      weekDiv.style.display = 'block';
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (12 - week) * 7 + day);
        const dateKey = date.toISOString().split('T')[0];
        const minutes = Math.floor((sessionsByDate[dateKey] || 0) / 60);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'heatmap-day';
        
        let intensity;
        if (minutes === 0) intensity = 0;
        else if (minutes < 30) intensity = 1;
        else if (minutes < 60) intensity = 2;
        else if (minutes < 120) intensity = 3;
        else intensity = 4;
        
        dayDiv.style.backgroundColor = `rgba(77, 142, 255, ${0.2 + intensity * 0.2})`;
        dayDiv.setAttribute('data-tooltip', `${date.toLocaleDateString('ro-RO')}: ${minutes} minute`);
        
        weekDiv.appendChild(dayDiv);
      }
      heatmap.appendChild(weekDiv);
    }

  } catch (error) {
    console.error("Error rendering heatmap:", error);
  }
}

import { auth, db } from './firebase.js';
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, query, where, getDocs} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return window.location.href = 'login.html';
  }
  currentUser = user;
  let username = await getUserName();

  initPrefForm();
  await displayPreferences();
});

async function getUserName(){
  const userQuery = query(
    collection(db, "users"),
    where("userId", "==", currentUser.uid),
  )
  const snapshot = await getDocs(userQuery);

   if (snapshot.empty) {
   
    return "Username-ul nu a putut fi gasit"; 
  }

  return snapshot.docs[0].data().username;
}


async function averageStudySessions(){
  const sessionsQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", currentUser.uid),
    where("seconds", ">=", "60")
  )
  let secondsSum = 0;
  let count= 0;
  const snapshot = await getDocs(sessionsQuery);
  snapshot.forEach(doc => {
    const data = doc.data();
    secondsSum+= data.seconds;
    count++;
  });

  const avgMinutes = (secondsSum/count)/60;
  return avgMinutes;
}

async function displayPrefForm(){
  const form = document.getElementById("prefForm");
  form.style.display = "block";

}

async function getLearnerType(){
  const userQuery = query(
    collection(db,"testResults"),
    where("userId", "==", currentUser.uid)
  )

  const snapshot = await getDocs(userQuery);

  const data = snapshot.docs[0].data();
  const result = data.results;
 if(result["Auditiv"]> result["Vizual"] && result["Auditiv"]>result["Tactil"]){
      return "Auditiv";
 }
 if(result["Vizual"]> result["Auditiv"] && result["Vizual"]>result["Tactil"]){
      return "Vizual";
 }
 if(result["Tactil"]> result["Auditiv"] && result["Tactil"]>result["Vizual"]){
      return "Tactil";
 }

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
    const avgStudy = await averageStudySessions();
    const preferedTime = document.getElementById("preferedTime").value.trim();
    const learnerType = await getLearnerType();
   

    await addDoc(collection(db, "preferences"), {
      userId: currentUser.uid,
      age: age,
      avgStudySession: avgStudy,
      preferedTime: preferedTime,
      learnerType: learnerType,
    
    });

  
    form.style.display = "none";
  });
}


async function displayPreferences(){
  const preferences = document.getElementById("displayPreferences");
  const userQuery = query(
    collection(db,"preferences"),
    where("userId","==", currentUser.uid)
  )
  const snapshot = await getDocs(userQuery);
  const data = snapshot.docs[0].data();
  const age = data.age;
  const preferedTime = data.preferedTime;
  const learnerType = data.learnerType;

  preferences.innerHTML= `Vârsta : ${age} Timpul preferat pentru învățat : ${preferedTime} Tipul de studiat preferat/optim : ${learnerType}`;

}

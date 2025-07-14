import { auth, db } from './firebase.js';
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection, doc, query, where, orderBy, getDocs, getDoc, updateDoc, limit } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return window.location.href = 'login.html';
  }

  await getTop15();
});

async function getTop15(){
  const sessionQuery= query(
    collection(db,"xp"),
    where("xp", ">", 0),
    orderBy("xp", "desc"),
    limit(15)
  )

  const snapshot= await getDocs(sessionQuery);

  const top = Math.min(snapshot.size , 15);
  const leaderboard= document.getElementById("leaderboard");
  const td = document.createElement("td");
  const tr = document.createElement("tr");
  const th = document.createElement("th");
  leaderboard.innerHTML="";

  ["Nr.", "Nume", "XP"].forEach(text =>{
    th.textContent = text;
    tr.appendChild(th);

  });

  leaderboard.appendChild(th);

  for (let i = 0; i < snapshot.docs.length; i++) {
    const docData = snapshot.docs[i].data();
    const tr = document.createElement("tr");

    
    const rankTd = document.createElement("td");
    rankTd.textContent = i + 1;
    tr.appendChild(rankTd);

  
    const nameTd = document.createElement("td");
    const userName = await getUserName(docData.userId);
    nameTd.textContent = userName;
    tr.appendChild(nameTd);

    const xpTd = document.createElement("td");
    xpTd.textContent = docData.xp;
    tr.appendChild(xpTd);

    leaderboard.appendChild(tr);
  }
}

async function getUserName(userId) {
  const sessionQuery = query(
    collection(db, "users"),
    where("userId", "==", userId),
    limit(1)
  );

  const snapshot = await getDocs(sessionQuery);

  if (snapshot.empty) {
    return "Neidentificat"; 
  }

  return snapshot.docs[0].data().name;
}

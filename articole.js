import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { collection, query, where, orderBy, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return window.location.href = 'login.html';
  }
  await getTop15();
});

async function getTop15() {
  const sessionQuery = query(
    collection(db, "xp"),
    where("xp", ">", 0),
    orderBy("xp", "desc"),
    limit(15)
  );

  const snapshot = await getDocs(sessionQuery);

  const leaderboard = document.getElementById("leaderboard");
  leaderboard.innerHTML = "";

  // Create header row properly
  const headerRow = document.createElement("tr");
  ["Nr.", "Nume", "XP"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });
  leaderboard.appendChild(headerRow);

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

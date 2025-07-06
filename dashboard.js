import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const greetingElement = document.getElementById('greeting')
const logoutBtn = document.getElementById("logoutBtn");

//verificare sesiune
onAuthStateChanged(auth, async(user)=> {
    if(!user){
        window.location.href='login.html';
        return;
    }




//informații user 

try{
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if(userDocSnap.exists()){

        const userData= userDocSnap.data();
        const name= userData.name || "Utilizator";
        const username = userData.username || "";

        greetingElement.textContent = `Bine ai venit, ${name} (${username})!`;

    }else{
        greetingElement.textContent="Bine ai venit!";
    }
}catch(error){
    console.log("Eroare date utilizator:", error);
    greetingElement.textContent="Bine ai venit!";

}

});
//deconectare user 
logoutBtn.addEventListener("click", async () => {
    try{

        await signOut(auth);
        alert("Te-ai deconectat cu succes!")
        window.location.href = "login.html";
    }catch(error){
        console.error("Eroare deconectare:", error)
        alert("Eroare la deconectare:"+ error.message);
    }
});
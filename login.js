import {auth} from '/auth/firebase.js';
import {signInWithEmailAndPassword, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";


onAuthStateChanged(auth, user => {
    if(user){
        // redirecționare dacă utilizatorul e deja conectat
        window.location.href="/dashboard.html";
    }
});
const loginForm= document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email=document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    try{
        const userCredential = await signInWithEmailAndPassword( auth, email, password);
        const user= userCredential.user;

        alert("Bine ai revenit!" )
        //redirecționare
        window.location.href="/dashboard.html";

    }catch(error){
        console.error("Conectare nereușită", error);
        alert("Conectare nereușită"+ error.message);
    }
})

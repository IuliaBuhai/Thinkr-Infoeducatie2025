import {auth} from './firebase.js'
import {signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const loginForm= document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email=document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    try{
        const userCredential = await signInWithEmailAndPassword( auth, email, password);
        const user= userCredential.user;

        alert("Bine ai revenit!" )

    }catch(error){
        console.error("Conectare nereușită", error);
        alert("Conectare nereușită"+ error.message);
    }
})
import {auth, db} from './firebase.js'
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const form= document.getElementById("resetForm");
const feedback= document.getElementById("feedback");

form. addEventListener("submit", async (e) =>{
    e.preventDefault()

    const email=document.getElementById("email").value.trim();
    try{
        await sendPasswordResetEmail(auth, email);
        feedback.textContent="Email de resetare trimis";
    }catch(error){
        console.log("Eroare la reserare:", error);
        feedback.textContent=`A apărut o problemă la resetarea parolei: ${error.message}`;
    }


});

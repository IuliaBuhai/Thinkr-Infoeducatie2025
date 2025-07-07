import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) =>{
    if(!user){
        window.location.href="login.html";
        return;
    }

});
const form= document.getElementById("StudyPlansForm");
const loading=document.getElementById("loading");
const output= document.getElementById("planOutput")

form.addEventListener("submit", async (e)=> {
    e.preventDefault();
    const grade= document.getElementById("grade").value.trim();
    const subject= document.getElementById("subject").value.trim();
    const title= document.getElementById("title").value.trim();
    const days= document.getElementById("days").value.trim();
    const hours= document.getElementById("hours").value.trim();

    const formData={
        grade,
        subject,
        title,
        days : days? Number(days) : null, 
        hours : hours? Number(hours) : null

    };
   
    console.log("User input", formData)
    

});
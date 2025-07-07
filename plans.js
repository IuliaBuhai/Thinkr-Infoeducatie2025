import { auth, db } from './firebase.js';
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

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
   loading.style.display = "block";
    output.innerHTML = "";
    console.log("User input", formData)
    

    try{
        const response = await fetch ("/.netlify/functions/generatePlan",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify(formData)

        });

        const result = await response.json();

        if(!response.ok) throw new Error(result.error || "A apărut o eroare");


        await addDoc(collection(db, "studyPlans"),{
        ...formData,
        userId:user.uid,
        createdAt: new Date(),
        plan:result.lan

        });


        dislayFormattedPlan(result.plan);
    }catch(err){
        output.innerHTML=`<p style="color:red;">${err.message}</p>`
    }finally{
        loading.style.display="none";
    }
    function dislayFormattedPlan(plan){
        output.textContent="";

        plan.forEach(day => {
            const dayDiv= document.createElement("div");
            dayDiv.innerHTML= `<h3>Ziua ${day.day}</h3>`

            const ul = document.createElement("ul")

            day.tasks.forEach(task => {

                const li= document.createElement("li");
                li.innerHTML=`
                 <strong>${task.title}</strong>:${task.description}
                 <em>(${task.duration} min)</em>
                `;
                ul.appendChild(li);
            });
            dayDiv.appendChild(ul);
            output.appendChild(dayDiv);


        }); 
    }
});

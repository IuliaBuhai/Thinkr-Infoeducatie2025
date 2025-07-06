
        import {auth, db} from './firebase.js';

        import {
            createUserWithEmailAndPassword
        }from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

        import {
            doc,
            setDoc
        } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

        document.getElementById("signupForm").addEventListener("submit", async (e) => {
            
            e.preventDefault();
            const username= document.getElementById("username").value.trim();
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            // Creare user Firebase
            try{
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user=userCredential.user;

            // Stocare informații în Firestore
            await setDoc(doc(db, "users", user.uid), {
                username,
                name, 
                email,

            });

            alert("V-ați înregistrat cu succes!");
        }catch(error){
            console.error("Signup error:", error);
            alert("Eroare la înregistrare: " + error.message);
        }
        });
    

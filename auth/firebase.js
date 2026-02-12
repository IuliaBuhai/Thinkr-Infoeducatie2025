import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

//configurare firebase

const firebaseConfig = {
  apiKey: "AIzaSyDeC_e8cpXRGtM03LfV-GGoGyQ5HLqV2Iw",
  authDomain: "thinkr-infoeducatie.firebaseapp.com",
  projectId: "thinkr-infoeducatie",
  storageBucket: "thinkr-infoeducatie.firebasestorage.app",
  messagingSenderId: "233580403091",
  appId: "1:233580403091:web:da85493b2e3e7b1606f066",
  measurementId: "G-3CYDQ2574R"
};

const app = initializeApp(firebaseConfig);
const auth= getAuth(app);
const db = getFirestore(app);


export {auth, db};

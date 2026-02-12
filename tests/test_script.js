
    import { auth, db } from '/auth/firebase.js';
    import {onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';
    import {addDoc,collection, query, getDocs, where ,limit} from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';

    let currentUser = null;
    document.getElementById('loadAllLecturesBtn').addEventListener('click', loadAllLecturesComplete);

    onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = 'login.html';
    currentUser = user;
    initTestForm();
  
    await displayTestResultHistory();
    await loadAllLectures();
    hideLoader();
  });
    function initTestForm(){
      const form = document.getElementById("generateTest");
      
      form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const grade = document.getElementById("clasa").value;
          const subject = document.getElementById("materie").value;
          const testTitle = document.getElementById("titlu").value;
          const details = document.getElementById("detalii").value;
          const formData = {
            grade,
            subject,
            testTitle,
            details
          }

          try {
            const res = await fetch("/.netlify/functions/generateTests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Eroare la generare test");

            await addDoc(collection(db, "generatedTests"), {
                ...formData,
                userId: currentUser.uid,
                createdAt: new Date(),
                test: result,
                title: result.title
            });
            
            await takeTest(result.title, result.questions);
          } catch(err) {
            alert(err.message);
          }
      });
    }

    async function takeTest(title, questions) {
        const takeTestDiv = document.querySelector(".takeTest");
        takeTestDiv.innerHTML = `
          <div class="test-header">
            <h2 class="test-title">${title}</h2>
            </div>
            <button class="close-test" onclick="document.querySelector('.takeTest').style.display='none'">×</button>
          
          <form id="testForm"></form>
          <div class="test-results" id="testResults"></div>
        `;
      
        const form = document.getElementById("testForm");
        
        questions.forEach((question, index) => {
          const qBlock = document.createElement("div");
          qBlock.className = "question-block";
          qBlock.dataset.index = index;
      
          const qText = document.createElement("p");
          qText.className = "test-question";
          qText.dataset.number = `Q${index + 1}.`;
          qText.textContent = question.question;
          qBlock.appendChild(qText);
      
          const answerGroup = document.createElement("div");
          answerGroup.className = "test-options";
      
          question.options.forEach((opt, optIndex) => {
            const label = document.createElement("label");
            label.className = "test-label";
            
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `question-${index}`;
            input.value = optIndex;
            input.id = `q${index}-opt${optIndex}`;
            
            const span = document.createElement("span");
            span.textContent = opt;
            
            label.appendChild(input);
            label.appendChild(span);
            answerGroup.appendChild(label);
          });
      
          const explanation = document.createElement("div");
          explanation.className = "test-explanation";
          explanation.innerHTML = `
            <strong>Explicație:</strong> ${question.explanation}
            <div class="correct-answer-message" style="display: none; margin-top: 0.5rem; color: var(--success);">
              <strong>Răspuns corect:</strong> <span class="correct-answer-text"></span>
            </div>
          `;
          
          qBlock.appendChild(answerGroup);
          qBlock.appendChild(explanation);
          form.appendChild(qBlock);
        });
      
        const submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.className = "test-submit-btn";
        submitBtn.textContent = "Trimite testul";
        form.appendChild(submitBtn);
      
        takeTestDiv.style.display = "block";
      
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          let correct = 0;
          const totalQuestions = questions.length;
          let wrongAnswers = [];
      
          questions.forEach((question, index) => {
            const qBlock = form.querySelector(`.question-block[data-index="${index}"]`);
            if (!qBlock) return;
            
            const selected = form.querySelector(`input[name="question-${index}"]:checked`);
            const explanation = qBlock.querySelector(".test-explanation");
            const correctMessage = qBlock.querySelector(".correct-answer-message");
            const correctAnswerText = qBlock.querySelector(".correct-answer-text");
            const labels = qBlock.querySelectorAll(".test-label");
      
            
            if (explanation) explanation.style.display = "block";
      
            
            if (correctAnswerText) {
              correctAnswerText.textContent = question.options[question.correctIndex];
            }
      
            if (selected) {
              const answerIndex = parseInt(selected.value, 10);
              const selectedLabel = selected.closest(".test-label");
              const correctLabel = labels[question.correctIndex];
              
              if (answerIndex === question.correctIndex) {
                if (selectedLabel) selectedLabel.classList.add("correct-answer");
                correct++;
              } else {
                if (selectedLabel) selectedLabel.classList.add("incorrect-answer");
                if (correctLabel) correctLabel.classList.add("correct-answer");
                if (correctMessage) correctMessage.style.display = "block";
                
         
                wrongAnswers.push({
                  question: question.question,
                  yourAnswer: question.options[answerIndex],
                  correctAnswer: question.options[question.correctIndex],
                  explanation: question.explanation
                });
              }
            } else {
           
              const correctLabel = labels[question.correctIndex];
              if (correctLabel) correctLabel.classList.add("correct-answer");
              if (correctMessage) correctMessage.style.display = "block";
              qBlock.style.borderColor = "var(--warning)";
              
              wrongAnswers.push({
                question: question.question,
                yourAnswer: "Niciun răspuns selectat",
                correctAnswer: question.options[question.correctIndex],
                explanation: question.explanation
              });
            }
          });

          const percentage = Math.round((correct / totalQuestions) * 100);
          let feedback = "";
      
          await addDoc(collection(db, "results"),{
            userId: currentUser.uid,
            result: percentage,
            testTitle: title,
            createdAt: new Date(),
            questions: questions, 

          })
          

          
          
          if (percentage >= 90) {
            feedback = "Excelent! Ai o înțelegere foarte bună a acestui subiect.";
          } else if (percentage >= 70) {
            feedback = "Bun! Dar mai sunt câteva lucruri pe care ar trebui să le revezi.";
          } else if (percentage >= 50) {
            feedback = "Acceptabil. Ar fi bine să studiezi mai mult acest subiect.";
          } else {
            feedback = "Trebuie să mai lucrezi la acest subiect. Încearcă să revezi materialul.";
          }
      
          
          let wrongAnswersHtml = "";
          if (wrongAnswers.length > 0) {
            wrongAnswersHtml = `
              <div class="wrong-answers-summary" style="margin-top: 2rem; text-align: left;">
                <h3 style="color: var(--danger); margin-bottom: 1rem;">Întrebări greșite (${wrongAnswers.length}):</h3>
                ${wrongAnswers.map((item, i) => `
                  <div class="wrong-answer" style="background: rgba(255, 107, 107, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 3px solid var(--danger);">
                    <p><strong>Întrebare ${i+1}:</strong> ${item.question}</p>
                    <p><strong>Răspunsul tău:</strong> <span style="color: var(--danger);">${item.yourAnswer}</span></p>
                    <p><strong>Răspuns corect:</strong> <span style="color: var(--success);">${item.correctAnswer}</span></p>
                    <p><strong>Explicație:</strong> ${item.explanation}</p>
                  </div>
                `).join("")}
              </div>
            `;
          }
      
       
          const resultsDiv = document.getElementById("testResults");
          resultsDiv.innerHTML = `
            <div class="test-score">Rezultatul tău</div>
            <div class="test-percentage">${percentage}%</div>
            <div class="test-feedback">${feedback}</div>
            <div>Ai răspuns corect la <strong>${correct}</strong> din <strong>${totalQuestions}</strong> întrebări.</div>
            ${wrongAnswersHtml}
          `;
          resultsDiv.style.display = "block";
      
          
          resultsDiv.scrollIntoView({ behavior: "smooth" });
  });
}


async function displayTestResultHistory() {
  const resultsDiv = document.getElementById('resultDisplay');
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<h3>Istoric teste</h3><div id="historyList"></div>';

  const historyList = document.getElementById('historyList');
  historyList.style.marginTop = '1rem';

  const testQuery = query(
    collection(db, "results"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(testQuery);

  if (snapshot.empty) {
    historyList.innerHTML = '<p>Nu există rezultate salvate.</p>';
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    
    const title = data.testTitle || data.title || "Test fără titlu";
    const score = data.result;
    const questions = data.questions;  
    const resultId = doc.id;

    const item = document.createElement('div');
    item.className = 'score-item';
    item.style.cursor = 'pointer';
    item.style.border = '1px solid transparent';
    item.style.transition = 'border-color 0.3s ease';
    item.innerHTML = `<strong>${title}</strong> — Scor: <span>${score}%</span>`;

    item.addEventListener('mouseenter', () => item.style.borderColor = 'var(--accent-blue)');
    item.addEventListener('mouseleave', () => item.style.borderColor = 'transparent');

    item.onclick = () => showTestResult(questions, title, score);

    historyList.appendChild(item);
  });
}

function showTestResult(questions, title, score) {
  const takeTestDiv = document.querySelector('.takeTest');
  takeTestDiv.innerHTML = `
    <div class="test-header">
      <h2 class="test-title">${title}</h2>
      </div>
      <div class = "generate-lesson-container" style="text-align: center; margin-top: 2rem;">
      <button id="goToLectureBtn" style="
      margin-top: 1.5rem;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(77, 142, 255, 0.3);
      transition: var(--transition);
    ">Crează o lecție pe baza testului</button>
    </div>
      <button class="close-test" onclick="document.querySelector('.takeTest').style.display='none'">×</button>
      
    <form id="testResultForm"></form>
    
    <div class="test-results" id="testResultDisplay"></div>
  `;
  const form = document.getElementById('testResultForm');

  
  questions.forEach((question, index) => {
    const qBlock = document.createElement('div');
    qBlock.className = 'question-block';
    qBlock.dataset.index = index;

    const qText = document.createElement('p');
    qText.className = 'test-question';
    qText.dataset.number = `Q${index + 1}.`;
    qText.textContent = question.question;
    qBlock.appendChild(qText);

    const answerGroup = document.createElement('div');
    answerGroup.className = 'test-options';

    question.options.forEach((opt, optIndex) => {
      const label = document.createElement('label');
      label.className = 'test-label';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `question-${index}`;
      input.value = optIndex;
      input.disabled = true; 
      input.id = `result-q${index}-opt${optIndex}`;

      const span = document.createElement('span');
      span.textContent = opt;

      label.appendChild(input);
      label.appendChild(span);
      answerGroup.appendChild(label);

      if (optIndex === question.correctIndex) {
        label.classList.add('correct-answer');
      }
    });


    const explanation = document.createElement('div');
    explanation.className = 'test-explanation';
    explanation.innerHTML = `<strong>Explicație:</strong> ${question.explanation}`;
    explanation.style.display = 'block'; 
    qBlock.appendChild(answerGroup);
    qBlock.appendChild(explanation);
    form.appendChild(qBlock);
  });

  
  const resultDisplay = document.getElementById('testResultDisplay');
  resultDisplay.style.display = 'block';
  resultDisplay.innerHTML = `
    
    <div class="test-score">Rezultatul tău</div>
    <div class="test-percentage">${score}%</div>
  `;

 
  document.getElementById('goToLectureBtn').onclick = () => {
    if (typeof getLecture === 'function') {
      getLecture({ title, questions, score }).then(() => {
        takeTestDiv.style.display = 'none';
        displayFullLesson(title);
      });
    } else {
      alert("Funcția getLecture nu este definită încă.");
    }
  };

  takeTestDiv.style.display = 'block';
  takeTestDiv.scrollIntoView({ behavior: 'smooth' });
}





    async function getLecture(data){

       try {
      const res = await fetch("/.netlify/functions/getLecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Eroare la generare lectie");

      await addDoc(collection(db, "lectures"), {
        lesson: result.content,
        userId: currentUser.uid,
        createdAt: new Date(),
        title: data.title
        
      });

      const displayLessons = document.getElementById("lecturesDisplay");
      
      const h2 = document.createElement("h2");
      h2.textContent = data.title;
      h2.onclick = () => displayFullLesson(data.title);

      displayLessons.appendChild(h2);
      

    }catch(err){
    alert(err.message);
  }
}

  async function displayFullLesson(title) {
    const lecQuery = query(
        collection(db, "lectures"),
        where("title", "==", title),
        where("userId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(lecQuery);
    if (snapshot.empty) {
        alert("Lecția nu a fost găsită.");
        return;
    }

    const lessonHTML = snapshot.docs[0].data().lesson;

    document.getElementById("lessonTitle").textContent = title;
    document.getElementById("lessonContent").innerHTML = lessonHTML;

    const modal = document.getElementById("lessonModal");
    modal.style.display = "block";
    }
    document.querySelector(".close-lesson").onclick = () => {
    document.getElementById("lessonModal").style.display = "none";
};


async function loadAllLectures() {
    const lecQuery = query(
    collection(db, "lectures"),
    where("userId", "==", currentUser.uid),
    limit(3)
    );

    const snapshot = await getDocs(lecQuery);
    if (snapshot.empty) return;

    const displayLessons = document.getElementById("lecturesDisplay");
    displayLessons.innerHTML = "<h3>Lectiile tale:</h3>";

    snapshot.forEach(doc => {
    const data = doc.data();
    const h2 = document.createElement("h2");
    h2.textContent = data.title;
    h2.onclick = () => displayFullLesson(data.title);
    h2.style.cursor = "pointer";
    displayLessons.appendChild(h2);
    });
}

async function loadAllLecturesComplete() {
    const lecQuery = query(
    collection(db, "lectures"),
    where("userId", "==", currentUser.uid),
    );

    const snapshot = await getDocs(lecQuery);
    if (snapshot.empty) return;

    const displayLessons = document.getElementById("lecturesDisplay");
    displayLessons.innerHTML = "<h3>Lectiile tale:</h3>";

    snapshot.forEach(doc => {
    const data = doc.data();
    const h2 = document.createElement("h2");
    h2.textContent = data.title;
    h2.onclick = () => displayFullLesson(data.title);
    h2.style.cursor = "pointer";
    displayLessons.appendChild(h2);
    });
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  loader.classList.add("hide");

  setTimeout(() => {
    loader.remove();
  }, 600);
}
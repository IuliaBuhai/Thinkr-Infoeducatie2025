<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/progressbar.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Garamond:wght@500;700&family=Roboto+Slab:wght@300;400;700&display=swap" rel="stylesheet">
  <title>Dashboard | Thinkr</title>
  <style>
    :root {
      --bg-dark: #121212;
      --bg-darker: #0a0a0a;
      --bg-card: #1e1e1e;
      --accent-blue: #4a80f0;
      --accent-purple: #9b59b6;
      --text-primary: #f5f5f5;
      --text-secondary: #b3b3b3;
      --success: #2ecc71;
      --warning: #f39c12;
      --danger: #e74c3c;
      --transition: all 0.3s ease;
      --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      --shadow-hover: 0 8px 15px rgba(0, 0, 0, 0.4);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Roboto Slab', serif;
      background-color: var(--bg-dark);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 0;
      margin: 0;
      min-height: 100vh;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Garamond', serif;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; color: var(--accent-blue); }
    h3 { font-size: 1.5rem; }
    
    p {
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    /* Layout */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    header {
      background-color: var(--bg-darker);
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
      position: relative;
      z-index: 10;
    }

    main {
      padding: 2rem 1rem;
    }

    /* Cards */
    .card {
      background-color: var(--bg-card);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow);
      transition: var(--transition);
      border-left: 4px solid var(--accent-purple);
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-hover);
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin: 2rem 0;
    }

    /* Greeting */
    #greeting {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: fadeIn 1s ease;
    }

    /* Buttons */
    button, input[type="submit"], input[type="button"] {
      background-color: var(--accent-blue);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Roboto Slab', serif;
      font-weight: 500;
      transition: var(--transition);
      margin: 0.25rem;
    }

    button:hover, input[type="submit"]:hover, input[type="button"]:hover {
      background-color: var(--accent-purple);
      transform: translateY(-2px);
    }

    #logoutBtn {
      background-color: var(--danger);
    }

    #logoutBtn:hover {
      background-color: #c0392b;
    }

    #startBtn { background-color: var(--success); }
    #pauseBtn { background-color: var(--warning); }
    #stopBtn { background-color: var(--danger); }
    #resetBtn { background-color: var(--text-secondary); }

    /* Forms */
    form {
      margin-bottom: 2rem;
      background-color: var(--bg-card);
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    input[type="text"],
    input[type="number"],
    input[type="time"],
    input[type="password"],
    input[type="email"],
    textarea,
    select {
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid #333;
      border-radius: 4px;
      background-color: var(--bg-dark);
      color: var(--text-primary);
      font-family: 'Roboto Slab', serif;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 2px rgba(74, 128, 240, 0.3);
    }

    /* Timer */
    #clock {
      position: relative;
    }

    #time {
      font-size: 3rem;
      text-align: center;
      margin: 1rem 0;
      font-family: monospace;
      color: var(--accent-blue);
      background-color: rgba(0, 0, 0, 0.3);
      padding: 1rem;
      border-radius: 8px;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    /* Progress Circle */
    #goalProgressContainer {
      position: relative;
      width: 200px;
      height: 200px;
      margin: 20px auto;
      background-color: var(--bg-card);
      border-radius: 50%;
      padding: 10px;
      box-shadow: var(--shadow);
    }

    #goalProgressLabel {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.6rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Charts */
    .chart-container {
      background-color: var(--bg-card);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      box-shadow: var(--shadow);
    }

    /* History Sections */
    .history, .sessHistory {
      background-color: var(--bg-card);
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: var(--shadow);
    }

    .history dt, .sessHistory dt {
      font-weight: 700;
      color: var(--accent-blue);
      margin-top: 1rem;
    }

    .history dd, .sessHistory dd {
      margin-left: 1rem;
      margin-bottom: 1rem;
      color: var(--text-secondary);
      padding-left: 1rem;
      border-left: 2px solid var(--accent-purple);
    }

    /* Study Plan */
    .plan-day {
      margin-bottom: 1.5rem;
      background-color: var(--bg-card);
      padding: 1rem;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .plan-day h3 {
      font-size: 1.25rem;
      color: var(--accent-blue);
      margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--accent-purple);
      padding-bottom: 0.5rem;
    }

    .plan-day ul {
      list-style: none;
      padding-left: 0;
    }

    .plan-day li.task {
      background: rgba(0, 0, 0, 0.2);
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      color: var(--text-primary);
      transition: var(--transition);
      border-left: 3px solid var(--accent-blue);
    }

    .plan-day li.task:hover {
      background: rgba(74, 128, 240, 0.1);
      transform: translateX(5px);
    }

    .plan-day li.task strong {
      display: block;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }

    .plan-day li.task em {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .plan-day li.task .duration {
      background-color: var(--success);
      border-radius: 4px;
      color: white;
      padding: 0.2rem 0.5rem;
      font-size: 0.8rem;
      display: inline-block;
      margin-top: 0.3rem;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fade-in {
      animation: fadeIn 0.5s ease forwards;
    }

    /* Responsive */
    @media (max-width: 768px) {
      header {
        flex-direction: column;
        text-align: center;
      }

      #greeting {
        margin-bottom: 1rem;
      }

      .card-grid {
        grid-template-columns: 1fr;
      }

      #time {
        font-size: 2rem;
      }
    }

    /* Section descriptions */
    .section-description {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      font-style: italic;
      border-left: 3px solid var(--accent-purple);
      padding-left: 1rem;
    }

    /* Loading indicator */
    #loading {
      display: none;
      text-align: center;
      padding: 1rem;
      color: var(--accent-blue);
      font-weight: bold;
    }

    /* Search form */
    #searchForm {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    #searchPlan {
      flex-grow: 1;
    }
  </style>
</head>
<body>
  <header>
    <div id="greeting">Bine ai venit!</div>
    <button id="logoutBtn">Logout</button>
  </header>

  <div class="container">
    <section class="card">
      <h2>Progresul tău</h2>
      <p class="section-description">Urmărește-ți progresul zilnic și vezi cât de aproape ești de atingerea obiectivului tău.</p>
      
      <div class="card-grid">
        <div class="card">
          <h3>Obiectiv zilnic</h3>
          <div id="goalProgressContainer">
            <div id="goalProgressBar"></div>
            <div id="goalProgressLabel"></div>
          </div>
          <form id="studyGoal">
            <input type="time" id="timeGoal" required />
            <button type="submit">Setează target</button>
          </form>
        </div>

        <div class="card chart-container">
          <h3>Distribuția timpului</h3>
          <canvas id="timeDistributionChart"></canvas>
        </div>

        <div class="card chart-container">
          <h3>Evoluția săptămânală</h3>
          <canvas id="weeklyStudyChart"></canvas>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Sesiuni de studiu</h2>
      <p class="section-description">Începe o nouă sesiune de studiu și urmărește-ți progresul în timp real.</p>
      
      <form id="clock">
        <div id="time">00:00:00</div>
        <input list="titleSuggestions" id="sessionTitle" placeholder="Titlu sesiune (ce înveți la materia selectată)" required />
        <datalist id="titleSuggestions"></datalist>
        <input type="text" id="sessionDescription" placeholder="Detalii sesiune (ce ai învățat, ce ai reușit să faci etc.) - opțional" />
        <input list="tagSuggestions" id="sessionTag" placeholder="Materia">
        <datalist id="tagSuggestions"></datalist>
        
        <div class="button-group">
          <button id="startBtn" type="button">Start</button>
          <button id="pauseBtn" type="button">Pauză</button>
          <button type="submit" id="stopBtn">Stop</button>
          <button type="reset" id="resetBtn">Resetează</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Istoric sesiuni</h2>
      <p class="section-description">Toate sesiunile tale de studiu, organizate cronologic.</p>
      <section id="displaySessions"></section>
    </section>

    <section class="card">
      <h2>Planuri de studiu</h2>
      <p class="section-description">Generează un plan personalizat de studiu bazat pe nevoile tale.</p>
      
      <form id="StudyPlanForm">
        <label>
          Clasa:
          <input type="text" id="grade" placeholder="Clasa" required />
        </label>

        <label>
          Materia:
          <input type="text" id="subject" placeholder="Materie" required />
        </label>

        <label>
          Lecție / Subiect:
          <input type="text" id="title" placeholder="Ce vrei să înveți?" required />
        </label>

        <label>
          Zile disponibile (opțional):
          <input type="number" id="days" placeholder="Ex: 5" />
        </label>

        <label>
          Ore/zi (opțional):
          <input type="number" id="hours" placeholder="Ex: 2" />
        </label>

        <button type="submit">Generează plan</button>
      </form>

      <div id="loading">
        Se generează planul...
      </div>

      <section id="planOutput"></section>
      
      <form id="searchForm">
        <input type="text" id="searchPlan" placeholder="Caută plan">
        <button type="submit">Caută</button>
      </form>

      <h3>Istoric planuri</h3>
      <p class="section-description">Planurile tale de studiu generate anterior.</p>
      <section id="displayHistory"></section>
    </section>
  </div>

  <script type="module" src="dashboard.js"></script>
  <script type="module" src="plans.js"></script>
</body>
</html>

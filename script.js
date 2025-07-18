if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

let goals = JSON.parse(localStorage.getItem('goals')) || [];

function saveGoals() {
  localStorage.setItem('goals', JSON.stringify(goals));
}

function addGoal() {
  const input = document.getElementById('goalInput');
  const category = document.getElementById('categorySelect').value;
  const deadline = document.getElementById('deadlineInput').value;
  const text = input.value.trim();

  if (text === '') return;

  goals.push({
    text,
    category,
    deadline,
    completed: false,
    createdAt: new Date().toISOString()
  });

  input.value = '';
  document.getElementById('deadlineInput').value = '';

  saveGoals();
  renderGoals();
  renderChart();
}

function toggleGoal(index) {
  goals[index].completed = !goals[index].completed;
  saveGoals();
  renderGoals();
  renderChart();
}

function renderGoals() {
  const list = document.getElementById('goalList');
  list.innerHTML = '';

  goals.forEach((goal, index) => {
    const li = document.createElement('li');
    li.className = goal.completed ? 'completed' : '';

    li.innerHTML = `
      <div>
        <strong>${goal.text}</strong><br/>
        <small>📂 ${goal.category} | 📅 ${goal.deadline || 'No deadline'}</small>
      </div>
      <button onclick="toggleGoal(${index})">
        ${goal.completed ? 'Undo' : 'Done'}
      </button>
    `;
    list.appendChild(li);
  });

  updateProgress();
  checkAndNotifyGoals();

}

function checkAndNotifyGoals() {
  if (Notification.permission !== 'granted') return;

  const today = new Date().toISOString().split('T')[0];

  goals.forEach(goal => {
    if (!goal.completed && goal.deadline === today) {
      new Notification(`Reminder: ${goal.text} is due today!`);
    }
  });
}


function updateProgress() {
  const completedCount = goals.filter(goal => goal.completed).length;
  const percentage = goals.length === 0 ? 0 : Math.round((completedCount / goals.length) * 100);

  document.getElementById('progress').style.width = `${percentage}%`;
  document.getElementById('progressText').textContent = `${percentage}% Complete`;
}

function getWeeklyProgress() {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const counts = last7Days.map(dateStr => {
    return goals.filter(goal =>
      goal.completed && goal.createdAt.startsWith(dateStr)
    ).length;
  });

  return { labels: last7Days, data: counts };
}

let chartInstance;

function renderChart() {
  const ctx = document.getElementById('goalChart').getContext('2d');
  const { labels, data } = getWeeklyProgress();

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Goals Completed',
        data,
        backgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Initial render
renderGoals();
renderChart();
const darkToggle = document.getElementById("darkModeToggle");

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
});

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
}
function exportCSV() {
  const headers = ["Goal", "Category", "Deadline", "Completed"];
  const rows = goals.map(g => [
    `"${g.text}"`,
    g.category,
    g.deadline,
    g.completed ? "Yes" : "No"
  ]);

  let csvContent = "data:text/csv;charset=utf-8,"
    + [headers, ...rows].map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "goals.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

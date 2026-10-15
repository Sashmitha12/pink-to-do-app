
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskTime = document.getElementById("taskTime");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const notifyBtn = document.getElementById("notifyBtn");
const notificationStatus = document.getElementById("notificationStatus");
const clearCompleted = document.getElementById("clearCompleted");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const today = document.getElementById("today");

let tasks = [];
let currentFilter = "all";

try {
  tasks = JSON.parse(localStorage.getItem("pinkTodoTasks")) || [];
  if (!Array.isArray(tasks)) tasks = [];
} catch {
  tasks = [];
}

today.textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

function saveTasks() {
  localStorage.setItem("pinkTodoTasks", JSON.stringify(tasks));
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderTasks() {
  taskList.replaceChildren();

  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const percentage = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  taskCount.textContent = `${pendingCount} left`;
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = tasks.length
    ? `${percentage}% completed — keep going, lovely! 💗`
    : "Let's make today lovely!";

  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  if (visibleTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = tasks.length
      ? "Nothing here right now 🌷"
      : "Your list is waiting for its first task! 🌸";
    taskList.appendChild(empty);
    return;
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task";

    const isOverdue =
      task.dueTime &&
      !task.completed &&
      new Date(task.dueTime).getTime() < Date.now();

    if (task.completed) item.classList.add("done");
    if (isOverdue) item.classList.add("overdue");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task completed");

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const details = document.createElement("div");
    details.className = "task-details";

    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;
    details.appendChild(name);

    if (task.dueTime) {
      const time = document.createElement("span");
      time.className = "task-time";

      if (task.completed) {
        time.textContent = "Completed ✓";
      } else if (isOverdue) {
        time.textContent = `Overdue · ${formatDate(task.dueTime)}`;
      } else {
        time.textContent = `⏰ ${formatDate(task.dueTime)}`;
      }

      details.appendChild(time);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.name}`);

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(entry => entry.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, details, deleteButton);
    taskList.appendChild(item);
  });
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = taskInput.value.trim();

  if (!name) {
    alert("Please enter a task name.");
    return;
  }

  let dueTime = null;

  if (taskTime.value) {
    const date = new Date(taskTime.value);

    if (Number.isNaN(date.getTime())) {
      alert("Please choose a valid date and time.");
      return;
    }

    if (date.getTime() <= Date.now()) {
      alert("Please choose a future date and time.");
      return;
    }

    dueTime = date.toISOString();
  }

  tasks.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    name,
    dueTime,
    completed: false,
    notified: false
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
  taskInput.focus();
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(filter => {
      filter.classList.toggle("active", filter === button);
    });

    renderTasks();
  });
});

notifyBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    notificationStatus.textContent =
      "This browser does not support notifications.";
    return;
  }

  if (Notification.permission === "granted") {
    notificationStatus.textContent = "Notifications are enabled! 💗";
    return;
  }

  if (Notification.permission === "denied") {
    notificationStatus.textContent =
      "Notifications are blocked. Change permission in your browser's site settings.";
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      notificationStatus.textContent =
        "Notifications enabled! Your reminders are ready. 🌸";

      new Notification("You're all set! 🌷", {
        body: "Your task reminders are enabled."
      });
    } else {
      notificationStatus.textContent =
        "Notifications weren't enabled. You can still use your task list.";
    }
  } catch {
    notificationStatus.textContent =
      "Couldn't enable notifications in this browser.";
  }
});

function updateNotificationStatus() {
  if (!("Notification" in window)) {
    notificationStatus.textContent =
      "Notifications are not supported in this browser.";
  } else if (Notification.permission === "granted") {
    notificationStatus.textContent = "Notifications are enabled! 💗";
    notifyBtn.textContent = "Enabled ✓";
  } else if (Notification.permission === "denied") {
    notificationStatus.textContent =
      "Notifications are blocked in browser settings.";
  }
}

function checkReminders() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const now = Date.now();
  let changed = false;

  tasks.forEach(task => {
    if (
      !task.completed &&
      task.dueTime &&
      !task.notified &&
      new Date(task.dueTime).getTime() <= now
    ) {
      try {
        new Notification("Task reminder 🌸", {
          body: `${task.name} is due now!`
        });

        task.notified = true;
        changed = true;
      } catch {
        // Try again during the next reminder check.
      }
    }
  });

  if (changed) saveTasks();
  renderTasks();
}

clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

updateNotificationStatus();
renderTasks();
checkReminders();

// Check every 10 seconds while this page is running.
setInterval(checkReminders, 10000);

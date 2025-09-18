// Global variables
let tasks = JSON.parse(localStorage.getItem("studyTasks")) || [];
let currentFilter = "all";

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupScrollAnimations();
  setupScrollProgress();
});

function initializeApp() {
  renderTasks();
  updateStats();

  // Set minimum date to today
  document.getElementById("task-date").min = new Date()
    .toISOString()
    .split("T")[0];

  // Setup form submission
  document
    .getElementById("task-form")
    .addEventListener("submit", handleFormSubmit);

  // Setup filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", handleFilterClick);
  });
}

// Scroll Animations
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.classList.contains("stat-card")) {
          animateStatCard(entry.target);
        }
        if (entry.target.classList.contains("task-item")) {
          entry.target.style.animationDelay = "0.2s";
        }
      } else {
        if (!entry.target.classList.contains("stat-card")) {
          entry.target.classList.remove("visible");
        }
      }
    });
  }, observerOptions);

  // Observe all scrollable elements
  document
    .querySelectorAll(
      "[data-scroll], .task-item, .stat-card, .form-container, .filter-btn, .social-icon"
    )
    .forEach((el) => {
      observer.observe(el);
    });
}

// Animate stat card when it comes into view
function animateStatCard(card) {
  const number = card.querySelector(".stat-number");
  const progress = card.querySelector(".progress-bar");
  if (progress) {
    const value = progress.getAttribute("data-progress");
    progress.style.width = `${value}%`;
  }
  if (number) {
    const value = parseInt(number.textContent);
    animateNumber(number.id, value);
  }
}

// Scroll Progress Bar
function setupScrollProgress() {
  const progressBar = document.querySelector(".scroll-progress");

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / documentHeight) * 100;

    progressBar.style.width = `${Math.min(progress, 100)}%`;
  });
}

// Form submission handler
function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("task-title").value.trim();
  const desc = document.getElementById("task-desc").value.trim();
  const date = document.getElementById("task-date").value;
  const priority = document.getElementById("task-priority").value;

  if (title && date) {
    const newTask = {
      id: Date.now(),
      title: title,
      desc: desc,
      date: date,
      priority: priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateStats();

    // Reset form with animation
    e.target.reset();
    showNotification("Task added successfully! 🎉", "success");

    // Animate button
    animateButton(e.target.querySelector(".submit-btn"));
  }
}

// Filter click handler
function handleFilterClick(e) {
  const filter = e.target.dataset.filter;
  if (!filter) return;

  currentFilter = filter;

  // Update active button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  e.target.classList.add("active");

  renderTasks();
}

// Animate button
function animateButton(button) {
  button.style.transform = "scale(0.95)";
  setTimeout(() => {
    button.style.transform = "translateY(-3px)";
  }, 150);
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("studyTasks", JSON.stringify(tasks));
}

// Render tasks with animations
function renderTasks() {
  const tasksList = document.getElementById("tasks-list");

  let filteredTasks = tasks;

  if (currentFilter === "completed") {
    filteredTasks = tasks.filter((task) => task.completed);
  } else if (currentFilter === "pending") {
    filteredTasks = tasks.filter((task) => !task.completed);
  }

  // Sort tasks
  filteredTasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

    if (priorityDiff !== 0) return priorityDiff;

    return new Date(a.date) - new Date(b.date);
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `
            <div class="no-tasks">
                <div class="no-tasks-icon">📝</div>
                <p>${
                  currentFilter === "all"
                    ? "No tasks yet! Add your first study task above."
                    : `No ${currentFilter} tasks found.`
                }</p>
            </div>
        `;
    return;
  }

  // Animate out old tasks
  const existingTasks = tasksList.querySelectorAll(".task-item");
  existingTasks.forEach((task, index) => {
    setTimeout(() => {
      task.style.animation = "slideOut 0.3s forwards";
    }, index * 50);
  });

  // Render new tasks after animation
  setTimeout(() => {
    tasksList.innerHTML = filteredTasks
      .map(
        (task, index) => `
            <div class="task-item ${task.completed ? "completed" : ""}" 
                 data-id="${task.id}" 
                 style="animation-delay: ${index * 0.1}s">
                <div class="task-header">
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${
                          task.desc
                            ? `<div class="task-desc">${task.desc}</div>`
                            : ""
                        }
                    </div>
                    <span class="task-priority priority-${task.priority}">
                        ${getPriorityIcon(
                          task.priority
                        )} ${task.priority.toUpperCase()}
                    </span>
                </div>
                
                <div class="task-footer">
                    <div class="task-date">
                        📅 Due: ${formatDate(task.date)} 
                        ${
                          isOverdue(task.date, task.completed)
                            ? "⚠️ OVERDUE"
                            : ""
                        }
                    </div>
                    
                    <div class="task-actions">
                        <button class="btn btn-complete" onclick="toggleTask(${
                          task.id
                        })">
                            ${task.completed ? "↺ Undo" : "✓ Complete"}
                        </button>
                        <button class="btn btn-delete" onclick="deleteTask(${
                          task.id
                        })">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    // Add staggered animation
    const newTasks = tasksList.querySelectorAll(".task-item");
    newTasks.forEach((task, index) => {
      task.style.opacity = "0";
      task.style.transform = "translateY(20px)";
      setTimeout(() => {
        task.style.transition = "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        task.style.opacity = "1";
        task.style.transform = "translateY(0)";
      }, index * 100);
    });
  }, 200);
}

// Get priority icon
function getPriorityIcon(priority) {
  const icons = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };
  return icons[priority] || "⚪";
}

// Toggle task completion with animation
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();

    const message = task.completed
      ? "Task completed! 🎉"
      : "Task marked as pending! 📝";
    const type = task.completed ? "success" : "info";
    showNotification(message, type);

    // Confetti effect for completed tasks
    if (task.completed) {
      createConfetti();
    }
  }
}

// Delete task with confirmation
function deleteTask(id) {
  showConfirmDialog("Are you sure you want to delete this task?", () => {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    showNotification("Task deleted successfully! 🗑️", "warning");
  });
}

// Update statistics with animations
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  // Update numbers
  document.getElementById("total-tasks").textContent = total;
  document.getElementById("completed-tasks").textContent = completed;
  document.getElementById("pending-tasks").textContent = pending;

  // Animate the numbers
  animateNumber("total-tasks", total);
  animateNumber("completed-tasks", completed);
  animateNumber("pending-tasks", pending);

  // Calculate percentages
  const completedPercentage = total > 0 ? (completed / total) * 100 : 0;
  const pendingPercentage = total > 0 ? (pending / total) * 100 : 0;

  // Update progress bars with correct percentages
  updateProgressBar('[data-stat="total"] .progress-bar', 100);
  updateProgressBar(
    '[data-stat="completed"] .progress-bar',
    completedPercentage
  );
  updateProgressBar('[data-stat="pending"] .progress-bar', pendingPercentage);

  // data-progress attribute for animation
  const completedBar = document.querySelector(
    '[data-stat="completed"] .progress-bar'
  );
  const pendingBar = document.querySelector(
    '[data-stat="pending"] .progress-bar'
  );

  if (completedBar)
    completedBar.setAttribute("data-progress", completedPercentage);
  if (pendingBar) pendingBar.setAttribute("data-progress", pendingPercentage);
}

// Improved animate number function
function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const startValue = parseInt(element.textContent) || 0;
  const duration = 500;
  const steps = 20;
  const stepValue = (targetValue - startValue) / steps;
  let currentStep = 0;

  // Clear any existing animation
  if (element.currentAnimation) {
    clearInterval(element.currentAnimation);
  }

  // Only animate if there's a difference
  if (startValue !== targetValue) {
    element.currentAnimation = setInterval(() => {
      currentStep++;

      if (currentStep === steps) {
        element.textContent = targetValue;
        clearInterval(element.currentAnimation);
      } else {
        const currentValue = Math.round(startValue + stepValue * currentStep);
        element.textContent = currentValue;
      }
    }, duration / steps);
  }
}

// Update the updateProgressBar function to ensure smooth animation
function updateProgressBar(selector, percentage) {
  const progressBar = document.querySelector(selector);
  if (progressBar) {
    progressBar.style.transition = "width 0.5s ease-in-out";
    progressBar.style.width = `${percentage}%`;
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Check if task is overdue
function isOverdue(dueDate, completed) {
  if (completed) return false;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

// Show notification with animation
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Styles
  const styles = {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 25px",
    borderRadius: "15px",
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
    zIndex: "10000",
    transform: "translateX(100%)",
    transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
  };

  Object.assign(notification.style, styles);

  // Type-specific styles
  const typeStyles = {
    success: { background: "linear-gradient(135deg, #4facfe, #00f2fe)" },
    warning: { background: "linear-gradient(135deg, #fa709a, #fee140)" },
    error: { background: "linear-gradient(135deg, #ff6b6b, #ee5a24)" },
    info: { background: "linear-gradient(135deg, #667eea, #764ba2)" },
  };

  Object.assign(notification.style, typeStyles[type]);

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Animate out
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

// Show confirm dialog
function showConfirmDialog(message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
    `;

  const dialog = document.createElement("div");
  dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s;
    `;

  dialog.innerHTML = `
        <p style="margin-bottom: 20px; font-size: 16px; color: #333;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="confirm-btn" style="
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
            ">Confirm</button>
            <button class="cancel-btn" style="
                background: #f8f9fa;
                color: #333;
                border: 1px solid #ddd;
                padding: 12px 24px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
            ">Cancel</button>
        </div>
    `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Animate in
  setTimeout(() => {
    overlay.style.opacity = "1";
    dialog.style.transform = "scale(1)";
  }, 10);

  // Event listeners
  dialog.querySelector(".confirm-btn").onclick = () => {
    onConfirm();
    closeDialog();
  };

  dialog.querySelector(".cancel-btn").onclick = closeDialog;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeDialog();
  };

  function closeDialog() {
    overlay.style.opacity = "0";
    dialog.style.transform = "scale(0.9)";
    setTimeout(() => overlay.remove(), 300);
  }
}

// Create confetti effect
function createConfetti() {
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#f0932b",
    "#eb4d4b",
  ];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}vw;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
        `;

    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 5000);
  }
}

// Add confetti animation keyframes
const style = document.createElement("style");
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", async function () {
  const expenseForm = document.getElementById("expense-form");
  const monthlyExpenseList = document.getElementById("monthly-expense-list");
  const expenseChartElement = document
    .getElementById("expense-chart")
    .getContext("2d");

  let expenses = [];
  let currentEditIndex = null;

  // Fetch expenses from the server
  async function fetchExpenseData() {
    try {
      const response = await fetch("http://localhost:1234/Expense/GetExpense");
      if (!response.ok) {
        throw new Error("Failed to fetch expenses!");
      }
      expenses = await response.json();
    //   console.log("Expenses fetched:", expenses);
    } catch (error) {
      console.error("Failed to fetch expenses:", error.message);
    }
  }

  // Function to display expenses grouped by month
  function displayExpensesByMonth() {
    monthlyExpenseList.innerHTML = "";
    const groupedExpenses = groupExpensesByMonth();
    const sortedMonths = Object.keys(groupedExpenses).sort(
      (a, b) => new Date(b) - new Date(a)
    ); // Sort by month

    sortedMonths.forEach((month) => {
      const monthSection = document.createElement("div");
      monthSection.innerHTML = `<h3>${month}</h3><ul></ul>`;
      const ul = monthSection.querySelector("ul");

      groupedExpenses[month].reverse().forEach((expense) => {
        const li = document.createElement("li");
        li.innerHTML = `Date: ${formatDate(new Date(expense.date))} | 
                    Item:<span style="font-weight: bold; background-color: yellow;"> ${
                      expense.item
                    }</span> | 
                    Cost:<span style="font-weight: bold; background-color: yellow;">₹${
                      expense.cost
                    }</span> | Category: ${expense.category} 
                    <button class="edit-button" data-index="${expenses.indexOf(
                      expense
                    )}">Edit</button>`;
        ul.appendChild(li);
      });

      monthlyExpenseList.appendChild(monthSection);
    });

    updateChart();
    attachEditEventListeners(); // Attach event listeners for edit buttons
  }

  // Attach event listeners to edit buttons
  function attachEditEventListeners() {
    const editButtons = document.querySelectorAll(".edit-button");
    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        loadExpenseForEditing(index);
      });
    });
  }

  // Load expense data for editing
  function loadExpenseForEditing(index) {
    const expense = expenses[index];
    document.getElementById("item-name").value = expense.item;
    document.getElementById("item-cost").value = expense.cost;
    document.getElementById("item-category").value = expense.category;
    currentEditIndex = index; // Set the current edit index
    document.getElementById("edit-expense-id").value = expense._id;
  }

  // Group expenses by month and year
  function groupExpensesByMonth() {
    const grouped = {};
    expenses.forEach((expense) => {
      const dateObj = new Date(expense.date);
      const month = dateObj.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(expense);
    });
    return grouped;
  }

  // Function to add an expense
  expenseForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const itemName = document.getElementById("item-name").value;
    const itemCost = document.getElementById("item-cost").value;
    const itemCategory = document.getElementById("item-category").value;
    const expenseId = document.getElementById("edit-expense-id").value;
    const expenseDate = new Date().toISOString(); // Automatically set the current date in ISO format
    const expense = {
      item: itemName,
      cost: parseFloat(itemCost),
      category: itemCategory,
      date: expenseDate,
      _id: expenseId,
    };
    if (currentEditIndex !== null) {
      const res = await fetch("http://localhost:1234/Expense/EditExpense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const result = await res.json();
    //   console.log("Expense updated:", result);
      // Update the local `expenses` array with the edited expense
      expenses[currentEditIndex] = expense;
      currentEditIndex = null; // Reset edit index
    } else {
      try {
        const response = await fetch(
          "http://localhost:1234/Expense/AddExpense",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense),
          }
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        // console.log("Expense added:", result);
        await fetchExpenseData();
      } catch (error) {
        console.error("Failed to add expense:", error.message);
      }
    }
    displayExpensesByMonth();
    expenseForm.reset();
  });
  // Function to update the total monthly expense chart
  function updateChart() {
    const monthlyTotals = {};

    expenses.forEach((expense) => {
      const dateObj = new Date(expense.date);
      const month = dateObj.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += expense.cost;
    });

    const chartData = {
      labels: Object.keys(monthlyTotals).map((month) => month),
      datasets: [
        {
          label: "Total Expenses",
          data: Object.values(monthlyTotals),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };

    // Clear existing chart
    if (window.expenseChartInstance) {
      window.expenseChartInstance.destroy();
    }
    // Create a new chart instance
    window.expenseChartInstance = new Chart(expenseChartElement, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        scales: {
          y: {
            title: {
              display: true,
              text: "Total Expenses (₹)",
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
  // Function to format the date in DD/MM/YYYY format
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-IN", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  // Fetch initial data and display it
  await fetchExpenseData();
  displayExpensesByMonth();
});

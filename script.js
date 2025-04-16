// #region model sets

function formatCost(cost) {
  let str = cost.toString();
  const [, decimals] = str.split(".");
  if (!decimals || decimals.length < 3) {
    str = cost.toFixed(2);
  }

  return "$" + str + "/M tokens";
}

function toModelObject([name, release, cost, arena], company) {
  return {
    name,
    company,
    release,
    cost,
    arena,
    releaseText: new Date(release).toLocaleDateString(),
    costText: formatCost(cost),
    arenaText: arena > 0 ? arena.toString() : "N/A",
  };
}

// Model arrays: [Name, Release Date, $/M input cost, LM Arena Score as of 4/15/2025]
const modelData = {
  openai: [
    ["GPT-3.5 Turbo", "2023-03-01", 2, 1068],
    ["GPT-4", "2023-03-14", 30, 1163],
    ["GPT-4 Turbo", "2024-04-09", 10, 1256],
    ["GPT-4o", "2024-05-13", 5, 1285],
    ["GPT-4o Mini", "2024-07-18", 0.15, 1272],
    ["o1 Mini", "2024-09-12", 3, 1304],
    ["o1", "2024-12-17", 15, 1350],
    ["o3 Mini", "2025-01-31", 1.1, 1305],
    ["GPT-4.5", "2025-02-27", 75, 1397],
    ["o1 Pro", "2025-03-19", 150, 0],
    ["GPT-4.1 Nano", "2025-04-14", 0.1, 0],
    ["GPT-4.1 Mini", "2025-04-14", 0.4, 0],
    ["GPT-4.1", "2025-04-14", 2, 0],
  ].map((m) => toModelObject(m, "openai")),
  google: [
    ["Gemini 1.5 Pro", "2024-04-10", 7, 1260],
    ["Gemini 1.5 Flash", "2024-05-14", 0.075, 1227],
    ["Gemini 2.0 Flash", "2025-02-05", 0.1, 1354],
    ["Gemini 2.0 Flash Lite", "2025-02-25", 0.075, 1310],
    ["Gemini 2.5 Pro Preview", "2025-03-25", 1.25, 1380],
  ].map((m) => toModelObject(m, "google")),
  anthropic: [
    ["Claude 2.1", "2023-11-21", 8, 0],
    ["Claude 3 Haiku", "2024-03-04", 0.25, 1179],
    ["Claude 3 Sonnet", "2024-03-04", 3, 1201],
    ["Claude 3 Opus", "2024-03-04", 15, 1247],
    ["Claude 3.5 Sonnet", "2024-06-20", 3, 1268],
    ["Claude 3.5 Haiku", "2024-11-04", 1, 1237],
    ["Claude 3.7 Sonnet", "2025-02-24", 3, 1297],
  ].map((m) => toModelObject(m, "anthropic")),
};

function getPreppedModels(company, criteria) {
  let models = modelData[company] ?? [
    ...modelData.openai,
    ...modelData.google,
    ...modelData.anthropic,
  ];

  // This also shallow copies so the sorts don't affect the original
  models = models.filter((model) => !!model[criteria]);

  if (criteria === "release") {
    // For release date, newer is better (higher date value)
    models.sort((a, b) => new Date(b.release) - new Date(a.release));
  } else if (criteria === "arena") {
    // For arena score, higher is better
    models.sort((a, b) => b.arena - a.arena);
  } else {
    // For cost, lower is better
    models.sort((a, b) => a.cost - b.cost);
  }

  return models;
}

// #endregion

document.addEventListener("DOMContentLoaded", function () {
  let currentCriteria = "release";
  let currentCompany = "all";
  let showModelDetails = false;
  let gameModels = [];

  const modelsList = document.getElementById("models-list");
  const checkButton = document.getElementById("check-btn");
  const toggleDataButton = document.getElementById("toggle-data-btn");
  const resultMessage = document.getElementById("result-message");
  const companySelect = document.getElementById("company-select");
  const criteriaSelect = document.getElementById("criteria-select");

  function initGame() {
    // Clear container
    modelsList.innerHTML = "";
    resultMessage.innerHTML = "";
    resultMessage.className = "result-message hidden";

    gameModels = getPreppedModels(currentCompany, currentCriteria);

    // Shuffle model data for initial display
    const shuffledModels = [...gameModels].sort(() => Math.random() - 0.5);

    // Create model items
    shuffledModels.forEach((model) => {
      const modelElement = createModelElement(model);
      modelsList.appendChild(modelElement);
    });

    setupDragging();
  }

  // Create a model element
  function createModelElement(model) {
    const modelElement = document.createElement("div");
    modelElement.className = `model-item ${model.company}`;
    modelElement.draggable = true;

    // Create the model name element
    const nameElement = document.createElement("div");
    nameElement.textContent = model.name;
    modelElement.appendChild(nameElement);

    // Create the details container
    const detailsElement = document.createElement("div");
    detailsElement.className = "model-details";

    // Add release date
    const releaseElement = document.createElement("p");
    releaseElement.textContent = `Release: ${model.releaseText}`;
    detailsElement.appendChild(releaseElement);

    // Add cost
    const costElement = document.createElement("p");
    costElement.textContent = `Cost: ${model.costText}`;
    detailsElement.appendChild(costElement);

    // Add arena score
    const arenaElement = document.createElement("p");
    arenaElement.textContent = `Arena Score: ${model.arenaText}`;
    detailsElement.appendChild(arenaElement);

    // Add details to model element
    modelElement.appendChild(detailsElement);

    // Set data attributes
    modelElement.dataset.name = model.name;
    modelElement.dataset.company = model.company;

    return modelElement;
  }

  // #region Dragging

  function setupDragging() {
    function removeDragOver() {
      modelsList.classList.remove("drag-over");
    }
    function startDrag(draggable) {
      draggable.classList.add("dragging");
    }
    function endDrag(draggable) {
      draggable.classList.remove("dragging");
      removeDragOver();
    }
    function performDrag(clientY) {
      modelsList.classList.add("drag-over");
      const dragging = document.querySelector(".dragging");
      const afterElement = getVerticalDragAfterElement(modelsList, clientY);

      if (afterElement && afterElement.previousElementSibling === dragging) {
        return;
      }

      if (afterElement) {
        modelsList.insertBefore(dragging, afterElement);
      } else {
        modelsList.appendChild(dragging);
      }
    }

    modelsList.addEventListener("dragstart", (e) => startDrag(e.target));
    modelsList.addEventListener("dragend", (e) => endDrag(e.target));

    modelsList.addEventListener("dragover", (e) => {
      e.preventDefault();
      performDrag(e.clientY);
    });

    modelsList.addEventListener("dragleave", removeDragOver);
    modelsList.addEventListener("drop", removeDragOver);

    modelsList.addEventListener("touchstart", (e) => {
      const target = e.target.closest(".model-item");
      if (target) {
        startDrag(target);
      }
    });
    modelsList.addEventListener("touchmove", (e) => {
      e.preventDefault(); // Prevent scrolling
      const target = e.target.closest(".model-item");
      if (target) {
        performDrag(e.touches[0].clientY);
      }
    });
    modelsList.addEventListener("touchend", (e) => {
      const target = e.target.closest(".model-item");
      if (target) {
        endDrag(target);
      }
    });
  }

  // #endreion

  // Toggle showing model details
  function toggleModelDetails() {
    showModelDetails = !showModelDetails;

    if (showModelDetails) {
      toggleDataButton.textContent = "Hide Data";
      document.querySelectorAll(".model-item").forEach((item) => {
        item.classList.add("show-details");
      });
    } else {
      toggleDataButton.textContent = "Show Data";
      document.querySelectorAll(".model-item").forEach((item) => {
        item.classList.remove("show-details");
      });
    }
  }

  // Clear all direction indicators
  function clearAllIndicators() {
    document.querySelectorAll(".indicator").forEach((indicator) => {
      indicator.remove();
    });
  }

  // Add direction indicators to model items
  function addDirectionIndicators(userOrderedModels, correctOrder) {
    clearAllIndicators(); // Clear any existing indicators first

    const modelItems = [...modelsList.querySelectorAll(".model-item")];

    modelItems.forEach((item, index) => {
      const modelName = item.dataset.name;
      const modelCompany = item.dataset.company;

      // Find the correct position for this model
      const correctIndex = correctOrder.findIndex(
        (model) => model.name === modelName && model.company === modelCompany
      );

      // Create indicator element
      const indicator = document.createElement("div");
      indicator.className = "indicator";

      // Determine if the model should move up, down, or is in the correct position
      if (correctIndex < index) {
        indicator.textContent = "↑"; // Should move up
        indicator.classList.add("up");
      } else if (correctIndex > index) {
        indicator.textContent = "↓"; // Should move down
        indicator.classList.add("down");
      } else {
        indicator.textContent = "✓"; // Correct position
        indicator.classList.add("correct");
      }

      // Add the indicator to the model item
      item.appendChild(indicator);
    });
  }

  // Get element to insert before when dragging (vertical ordering)
  function getVerticalDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".model-item:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  // Check if the current order is correct
  function checkOrder() {
    const modelItems = [...modelsList.querySelectorAll(".model-item")];

    if (modelItems.length < gameModels.length) {
      showResult(
        "Something went wrong. Please refresh and try again.",
        "incorrect"
      );
      return;
    }

    const userOrderedModels = modelItems.map((item) => {
      const modelName = item.dataset.name;
      const modelCompany = item.dataset.company;
      return gameModels.find(
        (model) => model.name === modelName && model.company === modelCompany
      );
    });

    // The correct order is already in gameModels, since getPreppedModels sorts them
    // We just need to make a copy to avoid modifying the original
    const correctOrder = [...gameModels];

    // Add direction indicators to help the user
    addDirectionIndicators(userOrderedModels, correctOrder);

    // Check if models are in correct order
    let isCorrect = true;
    for (let i = 0; i < userOrderedModels.length - 1; i++) {
      if (currentCriteria === "cost") {
        // For cost, lower is better
        if (
          userOrderedModels[i][currentCriteria] >
          userOrderedModels[i + 1][currentCriteria]
        ) {
          isCorrect = false;
          break;
        }
      } else if (currentCriteria === "arena") {
        // For arena score, higher is better
        if (
          userOrderedModels[i][currentCriteria] <
          userOrderedModels[i + 1][currentCriteria]
        ) {
          isCorrect = false;
          break;
        }
      } else if (currentCriteria === "release") {
        // For release date, newer is better (higher date value)
        const date1 = new Date(userOrderedModels[i][currentCriteria]);
        const date2 = new Date(userOrderedModels[i + 1][currentCriteria]);
        if (date1 < date2) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      showResult("Congratulations! You got the order right!", "correct");
    } else {
      // Calculate accuracy score
      const score = calculateOrderingScore(userOrderedModels, correctOrder);
      const percentage = Math.round(score * 100);

      // Create message with score
      const message = `Not quite right. Your order is ${percentage}% accurate. Try again!`;
      showResult(message, "incorrect");
    }
  }

  // Calculate a score between 0-1 showing how close the user's ordering is to the correct one
  function calculateOrderingScore(userOrder, correctOrder) {
    let totalPairs = 0;
    let correctPairs = 0;

    // Compare each pair of models in the user's order
    for (let i = 0; i < userOrder.length - 1; i++) {
      for (let j = i + 1; j < userOrder.length; j++) {
        totalPairs++;

        // Find these models in the correct order
        const userModelI = userOrder[i].name;
        const userModelJ = userOrder[j].name;
        const userCompanyI = userOrder[i].company;
        const userCompanyJ = userOrder[j].company;

        const correctIndexI = correctOrder.findIndex(
          (model) => model.name === userModelI && model.company === userCompanyI
        );
        const correctIndexJ = correctOrder.findIndex(
          (model) => model.name === userModelJ && model.company === userCompanyJ
        );

        // Check if the relative ordering of this pair is correct
        if (
          (i < j && correctIndexI < correctIndexJ) ||
          (i > j && correctIndexI > correctIndexJ)
        ) {
          correctPairs++;
        }
      }
    }

    return totalPairs > 0 ? correctPairs / totalPairs : 0;
  }

  // Show result message
  function showResult(message, type) {
    resultMessage.textContent = message;
    resultMessage.className = `result-message ${type}`;
  }

  // Event Listeners
  checkButton.addEventListener("click", checkOrder);
  toggleDataButton.addEventListener("click", toggleModelDetails);

  // Add event listeners to the dropdown selectors
  criteriaSelect.addEventListener("change", function () {
    const previousCriteria = currentCriteria;
    currentCriteria = this.value;

    // Hide any previous result when changing criteria
    resultMessage.className = "result-message hidden";

    // Reinitialize if changing to or from arena (since available models may change)
    if (previousCriteria === "arena" || currentCriteria === "arena") {
      initGame();
    }
  });

  companySelect.addEventListener("change", function () {
    currentCompany = this.value;
    // Reset the game when changing company
    initGame();
    // Hide any previous result
    resultMessage.className = "result-message hidden";
  });

  // Initialize game on load
  initGame();
});

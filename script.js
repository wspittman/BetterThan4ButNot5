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
    ["o3", "2025-04-16", 10, 0],
    ["o4-mini", "2025-04-16", 1.1, 0],
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

  for (let i = 0; i < models.length; i++) {
    for (let j = i; j < models.length; j++) {
      if (models[i][criteria] === models[j][criteria]) {
        models[i].upperIndex = j;
      }
    }
    for (let j = i; j >= 0; j--) {
      if (models[i][criteria] === models[j][criteria]) {
        models[i].lowerIndex = j;
      }
    }
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
  const criteriaDetails = document.getElementById("criteria-details");
  const resultMessage = document.getElementById("result-message");
  const companySelect = document.getElementById("company-select");
  const criteriaSelect = document.getElementById("criteria-select");

  function initGame() {
    // Clear container
    modelsList.innerHTML = "";
    resultMessage.innerHTML = "";
    resultMessage.className = "result-message hidden";

    if (currentCriteria === "release") {
      criteriaDetails.textContent =
        "Order by the date the model became general availability in the API. The most recent release should be at the top.";
    } else if (currentCriteria === "cost") {
      criteriaDetails.textContent =
        "Order by cost per million input tokens. The cheapest model should be at the top.";
    } else if (currentCriteria === "arena") {
      criteriaDetails.textContent =
        "Order by LM Arena score (snapshot taken April 15, 2025). The highest score should be at the top.";
    }

    showModelDetails = true;
    toggleModelDetails();
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

    return modelElement;
  }

  // #region Dragging

  function setupDragging() {
    function removeDragOver() {
      modelsList.classList.remove("drag-over");
    }
    function removeIndicator(draggable) {
      const indicator = draggable.querySelector(".indicator");
      if (indicator) {
        indicator.remove();
      }
    }
    function startDrag(draggable) {
      draggable.classList.add("dragging");
      removeIndicator(draggable);
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
        removeIndicator(afterElement);
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

  // #endregion

  // #region Buttons and Selectors

  // Toggle showing model details
  function toggleModelDetails() {
    showModelDetails = !showModelDetails;

    if (showModelDetails) {
      toggleDataButton.textContent = "Hide Data";
      modelsList.classList.add("show-details");
    } else {
      toggleDataButton.textContent = "Show Data";
      modelsList.classList.remove("show-details");
    }
  }

  // Event Listeners
  checkButton.addEventListener("click", checkOrder);
  toggleDataButton.addEventListener("click", toggleModelDetails);
  companySelect.addEventListener("change", function () {
    currentCompany = this.value;
    initGame();
  });
  criteriaSelect.addEventListener("change", function () {
    currentCriteria = this.value;
    initGame();
  });

  // #endregion

  // Clear all direction indicators
  function clearAllIndicators() {
    document.querySelectorAll(".indicator").forEach((indicator) => {
      indicator.remove();
    });
  }

  function addDirectionIndicator(element, index, lowerBound, upperBound) {
    // Create indicator element
    const indicator = document.createElement("div");
    indicator.className = "indicator";

    // Determine if the model should move up, down, or is in the correct position
    if (index > upperBound) {
      indicator.textContent = "↑"; // Should move up
    } else if (index < lowerBound) {
      indicator.textContent = "↓"; // Should move down
    } else {
      indicator.textContent = "✓"; // Correct position
      indicator.classList.add("correct");
    }

    // Add the indicator to the model item
    element.appendChild(indicator);
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
      return {
        ...gameModels.find((model) => model.name === modelName),
        element: item,
      };
    });

    // The correct order is already in gameModels, since getPreppedModels sorts them
    // We just need to make a copy to avoid modifying the original
    const correctOrder = [...gameModels];

    clearAllIndicators();
    const score = calculateOrderingScore(userOrderedModels, correctOrder);

    if (score === 1) {
      showResult("Congratulations! You got the order right!", "correct");
    } else {
      // Calculate accuracy score
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
    for (let i = 0; i < userOrder.length; i++) {
      const { name, element, lowerIndex, upperIndex } = userOrder[i];
      const correctI = correctOrder.findIndex((model) => model.name === name);

      for (let j = i + 1; j < userOrder.length; j++) {
        totalPairs++;

        const correctJ = correctOrder.findIndex(
          (model) => model.name === userOrder[j].name
        );

        // Check if the relative ordering of this pair is correct
        if (
          correctI < correctJ ||
          correctOrder[correctI][currentCriteria] ===
            correctOrder[correctJ][currentCriteria]
        ) {
          correctPairs++;
        }
      }

      addDirectionIndicator(element, i, lowerIndex, upperIndex);
    }

    return totalPairs > 0 ? correctPairs / totalPairs : 0;
  }

  // Show result message
  function showResult(message, type) {
    resultMessage.textContent = message;
    resultMessage.className = `result-message ${type}`;
  }

  // Initialize game on load
  initGame();
});

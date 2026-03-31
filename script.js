/* ============================================
   HUMBLE HANDS — QUOTE PWA LOGIC
   ============================================ */

// =============================================
// GOOGLE APPS SCRIPT URL
// Replace the URL below with YOUR deployed web app URL from Step 3
// =============================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxiE-g20FfOllk5PjoNNJNKx-yBGbwyVPrcBmZklSwohC2h55goIl0tvuCRIda8N_czPQ/exec ";

// =============================================
// ANSWER STORAGE
// This object stores all the user's answers
// =============================================
let answers = {
    area: "",
    serviceType: "",
    bedrooms: "",
    bathrooms: "",
    condition: "",
    frequency: ""
};

// =============================================
// TOTAL NUMBER OF STEPS (for progress bar)
// Welcome + 6 questions + contact + results = 9
// =============================================
const TOTAL_STEPS = 9;
let currentStep = 0;

// =============================================
// SCREEN NAVIGATION
// =============================================

function startQuiz() {
    goToScreen("screen-q1", 1);
}

function goToScreen(screenId, step) {
    // Hide all screens
    var screens = document.querySelectorAll(".screen");
    screens.forEach(function(screen) {
        screen.classList.remove("active");
    });

    // Show the target screen
    var targetScreen = document.getElementById(screenId);
    targetScreen.classList.add("active");

    // Update progress bar
    currentStep = step;
    updateProgressBar();

    // Scroll to top (important on mobile)
    window.scrollTo(0, 0);
}

// =============================================
// PROGRESS BAR
// =============================================

function updateProgressBar() {
    var progressBar = document.getElementById("progressBar");
    var percentage = (currentStep / TOTAL_STEPS) * 100;
    progressBar.style.width = percentage + "%";
}

// =============================================
// ANSWER SELECTION
// =============================================

function selectAnswer(questionKey, value, buttonElement) {
    // Store the answer
    answers[questionKey] = value;

    // Remove "selected" class from all buttons in this question
    var parentGrid = buttonElement.closest(".options-grid");
    var allButtons = parentGrid.querySelectorAll(".btn-option");
    allButtons.forEach(function(btn) {
        btn.classList.remove("selected");
    });

    // Add "selected" class to the clicked button
    buttonElement.classList.add("selected");

    // Figure out which question this is and show the Next button
    var questionNumber = getQuestionNumber(questionKey);
    var nextButton = document.getElementById("next-" + questionNumber);
    if (nextButton) {
        nextButton.classList.remove("hidden");
    }
}

function getQuestionNumber(questionKey) {
    var mapping = {
        "area": "q1",
        "serviceType": "q2",
        "bedrooms": "q3",
        "bathrooms": "q4",
        "condition": "q5",
        "frequency": "q6"
    };
    return mapping[questionKey];
}

// =============================================
// PRICING LOGIC
// Based on Niagara Region market rates
// =============================================

function calculateQuote() {

    // -----------------------------------------
    // STEP 1: Base price by number of bedrooms
    // (for a Standard Clean)
    // -----------------------------------------
    var basePrices = {
        "1": 120,
        "2": 145,
        "3": 180,
        "4": 230,
        "5+": 280
    };

    var basePrice = basePrices[answers.bedrooms] || 180;

    // -----------------------------------------
    // STEP 2: Add cost per bathroom
    // -----------------------------------------
    var bathroomPrices = {
        "1": 0,
        "2": 25,
        "3": 50,
        "4+": 80
    };

    var bathroomAddon = bathroomPrices[answers.bathrooms] || 25;
    basePrice = basePrice + bathroomAddon;

    // -----------------------------------------
    // STEP 3: Multiply by service type
    // Deep Clean and Move-Out cost more
    // -----------------------------------------
        var serviceMultipliers = {
        "Standard Clean": 1.0,
        "Deep Clean": 1.7,
        "Move-In / Move-Out": 2.0,
        "Organization": 1.5,
        "Not Sure": 1.0
    };

    var serviceMultiplier = serviceMultipliers[answers.serviceType] || 1.0;
    basePrice = basePrice * serviceMultiplier;

    // -----------------------------------------
    // STEP 4: Adjust for home condition
    // -----------------------------------------
    var conditionMultipliers = {
        "Well Maintained": 1.0,
        "Average": 1.15,
        "Needs Work": 1.35
    };

    var conditionMultiplier = conditionMultipliers[answers.condition] || 1.0;
    basePrice = basePrice * conditionMultiplier;

    // -----------------------------------------
    // STEP 5: Apply recurring discount
    // -----------------------------------------
    var frequencyDiscounts = {
        "One-Time": 0,
        "Weekly": 0.20,
        "Bi-Weekly": 0.15,
        "Monthly": 0.10,
        "Not Sure": 0
    };

    var discount = frequencyDiscounts[answers.frequency] || 0;
    var discountAmount = basePrice * discount;
    basePrice = basePrice - discountAmount;

    // -----------------------------------------
    // STEP 6: Round to nearest $5 for clean look
    // -----------------------------------------
    var finalQuote = Math.round(basePrice / 5) * 5;

    // Make sure the minimum quote is reasonable
    if (finalQuote < 100) {
        finalQuote = 100;
    }

    return finalQuote;
}

// =============================================
// FORM SUBMISSION
// =============================================

function submitQuote(event) {
    // Prevent the form from refreshing the page
    event.preventDefault();

    // Get the contact info from the form
    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();

    // Basic validation
    if (!name || !email || !phone) {
        alert("Please fill in all fields.");
        return;
    }

    // Disable the submit button to prevent double submissions
    var submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    // Show loading overlay
    var loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.classList.remove("hidden");

    // Calculate the quote
    var estimatedQuote = calculateQuote();

    // Build the data object to send to Google Sheets
    var data = {
        name: name,
        email: email,
        phone: phone,
        area: answers.area,
        serviceType: answers.serviceType,
        bedrooms: answers.bedrooms,
        bathrooms: answers.bathrooms,
        condition: answers.condition,
        frequency: answers.frequency,
        estimatedQuote: "$" + estimatedQuote
    };

    // Send data to Google Sheets
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        console.log("Success:", result);
        showResults(estimatedQuote);
    })
    .catch(function(error) {
        console.error("Error:", error);
        // Still show results even if the sheet write fails
        // You don't want the customer to see an error
        showResults(estimatedQuote);
    })
    .finally(function() {
        // Hide loading overlay
        loadingOverlay.classList.add("hidden");
        // Re-enable the button (just in case)
        submitBtn.disabled = false;
        submitBtn.textContent = "Get My Estimate →";
    });
}

// =============================================
// SHOW RESULTS
// =============================================

function showResults(quote) {
    // Display the quote amount
    var quoteAmountEl = document.getElementById("quoteAmount");
    quoteAmountEl.textContent = "$" + quote;

    // Build the summary
    var summaryEl = document.getElementById("quoteSummary");

    // Frequency display text
    var frequencyText = answers.frequency;
    var frequencyDiscounts = {
        "Weekly": " (20% off)",
        "Bi-Weekly": " (15% off)",
        "Monthly": " (10% off)"
    };
    if (frequencyDiscounts[answers.frequency]) {
        frequencyText = answers.frequency + frequencyDiscounts[answers.frequency];
    }

    summaryEl.innerHTML =
        "<p><span>Service</span><span>" + answers.serviceType + "</span></p>" +
        "<p><span>Bedrooms</span><span>" + answers.bedrooms + "</span></p>" +
        "<p><span>Bathrooms</span><span>" + answers.bathrooms + "</span></p>" +
        "<p><span>Condition</span><span>" + answers.condition + "</span></p>" +
        "<p><span>Frequency</span><span>" + frequencyText + "</span></p>" +
        "<p><span>Area</span><span>" + answers.area + "</span></p>";

    // Navigate to results screen
    goToScreen("screen-results", 8);
}

// =============================================
// SERVICE WORKER REGISTRATION (for PWA)
// =============================================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker.register("sw.js")
        .then(function(registration) {
            console.log("Service Worker registered:", registration.scope);
        })
        .catch(function(error) {
            console.log("Service Worker registration failed:", error);
        });
    });
}
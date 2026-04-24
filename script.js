/* ============================================
   HUMBLE HANDS — QUOTE PWA LOGIC
   ============================================ */

// =============================================
// GOOGLE APPS SCRIPT URL
// =============================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxiE-g20FfOllk5PjoNNJNKx-yBGbwyVPrcBmZklSwohC2h55goIl0tvuCRIda8N_czPQ/exec";

// =============================================
// ANSWER STORAGE
// Stores all user answers for cleaning flow
// =============================================
let answers = {
    area: "",
    serviceType: "",
    bedrooms: "",
    bathrooms: "",
    condition: "",
    frequency: "",
    extraNotes: ""
};

// Organization answers stored separately
let orgAnswers = {
    area: "",
    spaces: [],
    spaceCount: 0,
    condition: "",
    supplies: "",
    extraNotes: ""
};

// =============================================
// TOTAL NUMBER OF STEPS (for progress bar)
// =============================================
const TOTAL_STEPS = 10;
let currentStep = 0;

// =============================================
// SCREEN NAVIGATION
// =============================================

function startQuiz() {
    goToScreen("screen-q1", 1);
}

function goToScreen(screenId, step) {
    var screens = document.querySelectorAll(".screen");
    screens.forEach(function(screen) {
        screen.classList.remove("active");
    });

    var targetScreen = document.getElementById(screenId);
    targetScreen.classList.add("active");

    currentStep = step;
    updateProgressBar();

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
// ANSWER SELECTION — CLEANING FLOW
// =============================================

function selectAnswer(questionKey, value, buttonElement) {
    answers[questionKey] = value;

    var parentGrid = buttonElement.closest(".options-grid");
    var allButtons = parentGrid.querySelectorAll(".btn-option");
    allButtons.forEach(function(btn) {
        btn.classList.remove("selected");
    });

    buttonElement.classList.add("selected");

    // If user selected Organization on service type question
    // redirect them to the org flow after area is collected
    if (questionKey === "serviceType" && value === "Organization") {
        orgAnswers.area = answers.area;
    }

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
// SERVICE TYPE ROUTING
// Called by the Next button on screen-q2
// Sends org users to org flow, others continue
// =============================================

function routeAfterServiceType() {
    if (answers.serviceType === "Organization") {
        orgAnswers.area = answers.area;
        goToScreen("screen-org-spaces", 3);
    } else {
        goToScreen("screen-q3", 3);
    }
}

// =============================================
// ORGANIZATION FLOW — SPACE SELECTION
// =============================================

function validateSpaces() {
    var checked = document.querySelectorAll('input[name="spaces"]:checked');

    if (checked.length === 0) {
        document.getElementById("spaces-error").style.display = "block";
        return;
    }

    document.getElementById("spaces-error").style.display = "none";

    // Collect selected spaces
    orgAnswers.spaces = Array.from(checked).map(function(cb) {
        return cb.value;
    });

    // Handle "Other" text field
    var otherText = document.getElementById("other-text").value.trim();
    if (otherText && orgAnswers.spaces.includes("Other")) {
        var idx = orgAnswers.spaces.indexOf("Other");
        orgAnswers.spaces[idx] = "Other: " + otherText;
    }

    orgAnswers.spaceCount = orgAnswers.spaces.length;

    goToScreen("screen-org-condition", 4);
}

// =============================================
// ORGANIZATION FLOW — CONDITION SELECTION
// =============================================

function validateOrgCondition() {
    var selected = document.querySelector('input[name="org-condition"]:checked');

    if (!selected) {
        alert("Please select a condition to continue.");
        return;
    }

    orgAnswers.condition = selected.value;
    goToScreen("screen-org-supplies", 5);
}

// =============================================
// ORGANIZATION FLOW — SUPPLIES SELECTION
// =============================================

function validateSupplies() {
    var selected = document.querySelector('input[name="org-supplies"]:checked');

    if (!selected) {
        alert("Please make a selection to continue.");
        return;
    }

    orgAnswers.supplies = selected.value;
    goToScreen("screen-org-notes", 6);
}

// =============================================
// ORGANIZATION FLOW — NOTES TO PHOTOS
// =============================================

function goToOrgPhotos() {
    var notes = document.getElementById("org-notes").value.trim();
    orgAnswers.extraNotes = notes || "None";
    goToScreen("screen-org-photos", 7);
}

// =============================================
// ORGANIZATION FLOW — PHOTOS TO CONTACT
// =============================================

function goToOrgContact() {
    goToScreen("screen-org-contact", 8);
}

// =============================================
// PHOTO UPLOAD PREVIEW
// =============================================

function handlePhotoUpload(input) {
    var preview = document.getElementById("photo-preview");
    var countLabel = document.getElementById("photo-count");
    preview.innerHTML = "";

    var files = Array.from(input.files).slice(0, 5);

    files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = document.createElement("img");
            img.src = e.target.result;
            img.style.cssText =
                "width: 80px; height: 80px; object-fit: cover;" +
                "border-radius: 4px; border: 1px solid #e0e0e0;";
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });

    countLabel.style.display = "block";
    countLabel.textContent =
        files.length + " photo" + (files.length > 1 ? "s" : "") + " selected";
}

// =============================================
// ORGANIZATION PRICING CALCULATOR
// =============================================

function calculateOrgPrice(spaceCount) {
    if (spaceCount === 1) return 75;
    if (spaceCount === 2) return 130;
    if (spaceCount === 3) return 180;
    return null; // 4+ quoted individually
}

// =============================================
// ORGANIZATION BREAKDOWN BUILDER
// =============================================

function buildOrgBreakdown(spaceCount, supplies) {
    var prices = { 1: 75, 2: 130, 3: 180 };
    var price = spaceCount >= 4 ? null : prices[spaceCount];

    var breakdown = spaceCount >= 4
        ? "Spaces: " + spaceCount + " (quoted individually) | Supplies: " + supplies + " | Total: Quoted individually"
        : "Spaces: " + spaceCount + " x starting rate | Estimated: $" + price + " | Supplies: " + supplies + " | Total: $" + price + " + supplies if applicable";

    return {
        breakdown: breakdown,
        total: price ? "$" + price : "Quoted individually"
    };
}

// =============================================
// ORGANIZATION FLOW — SUBMIT
// =============================================

function submitOrgQuote(event) {
    event.preventDefault();

    var name  = document.getElementById("org-name").value.trim();
    var email = document.getElementById("org-email").value.trim();
    var phone = document.getElementById("org-phone").value.trim();
    var preferredContact = document.querySelector('input[name="org-contact-method"]:checked');

    if (!name || !email) {
        document.getElementById("org-contact-error").style.display = "block";
        return;
    }

    document.getElementById("org-contact-error").style.display = "none";

    // Disable submit button
    var submitBtn = document.getElementById("orgSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    // Show loading overlay
    var loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.classList.remove("hidden");

    // Build breakdown and price
    var orgBreakdown = buildOrgBreakdown(orgAnswers.spaceCount, orgAnswers.supplies);

    var data = {
        name:             name,
        email:            email,
        phone:            phone || "Not provided",
        area:             orgAnswers.area,
        serviceType:      "Organization",
        spaces:           orgAnswers.spaces.join(", "),
        spaceCount:       orgAnswers.spaceCount,
        condition:        orgAnswers.condition,
        supplies:         orgAnswers.supplies,
        extraNotes:       orgAnswers.extraNotes || "None",
        quoteBreakdown:   orgBreakdown.breakdown,
        estimatedQuote: String(orgBreakdown.total).startsWith("$") ? orgBreakdown.total : "$" + orgBreakdown.total,
        preferredContact: preferredContact ? preferredContact.value : "Not specified"
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        console.log("Success:", result);
        goToScreen("screen-org-confirmation", 10);
    })
    .catch(function(error) {
        console.error("Error:", error);
        // Still show confirmation even if sheet write fails
        goToScreen("screen-org-confirmation", 10);
    })
    .finally(function() {
        loadingOverlay.classList.add("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "Send My Quote Request →";
    });
}

// =============================================
// CLEANING PRICING LOGIC - UPDATED
// =============================================

function calculateQuote(applyCondition) {
    // applyCondition defaults to true for backward compatibility
    if (applyCondition === undefined) {
        applyCondition = true;
    }

    // UPDATED: Lower base prices for customer acquisition
    var basePrices = {
        "1": 100,
        "2": 125,
        "3": 155,
        "4": 195,
        "5+": 240
    };

    var basePrice = basePrices[answers.bedrooms] || 155;

    var bathroomPrices = {
        "1": 0,
        "2": 25,
        "3": 50,
        "4+": 80
    };

    var bathroomAddon = bathroomPrices[answers.bathrooms] || 25;
    basePrice = basePrice + bathroomAddon;

    var serviceMultipliers = {
        "Standard Clean": 1.0,
        "Deep Clean": 1.5,
        "Move-In / Move-Out": 1.7,
        "Not Sure": 1.0
    };

    var serviceMultiplier = serviceMultipliers[answers.serviceType] || 1.0;
    basePrice = basePrice * serviceMultiplier;

    // UPDATED: Adjusted condition multipliers (only applied if applyCondition is true)
    var conditionMultipliers = {
        "Well Maintained": 1.0,
        "Average": 1.12,
        "Needs Work": 1.27
    };

    if (applyCondition) {
        var conditionMultiplier = conditionMultipliers[answers.condition] || 1.0;
        basePrice = basePrice * conditionMultiplier;
    }

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

    var finalQuote = Math.round(basePrice / 5) * 5;

    // UPDATED: Different minimums for one-time vs recurring
    var minimumPrice = (answers.frequency === "One-Time" || answers.frequency === "Not Sure") ? 175 : 100;
    
    if (finalQuote < minimumPrice) {
        finalQuote = minimumPrice;
    }

    return finalQuote;
}

// =============================================
// CLEANING QUOTE BREAKDOWN - UPDATED
// =============================================

function getQuoteBreakdown() {

    var basePrices = {
        "1": 100,
        "2": 125,
        "3": 155,
        "4": 195,
        "5+": 240
    };

    var bathroomPrices = {
        "1": 0,
        "2": 25,
        "3": 50,
        "4+": 80
    };

    var serviceMultipliers = {
        "Standard Clean": 1.0,
        "Deep Clean": 1.5,
        "Move-In / Move-Out": 1.7,
        "Not Sure": 1.0
    };

    var conditionMultipliers = {
        "Well Maintained": 1.0,
        "Average": 1.12,
        "Needs Work": 1.27
    };

    var frequencyDiscounts = {
        "One-Time": 0,
        "Weekly": 0.20,
        "Bi-Weekly": 0.15,
        "Monthly": 0.10,
        "Not Sure": 0
    };

    var basePrice = basePrices[answers.bedrooms] || 155;
    var bathroomAddon = bathroomPrices[answers.bathrooms] || 25;
    var subtotal = basePrice + bathroomAddon;

    var serviceMultiplier = serviceMultipliers[answers.serviceType] || 1.0;
    var afterService = subtotal * serviceMultiplier;

    // UPDATED: Condition only applied for one-time or not-sure bookings
    var isRecurring = (answers.frequency !== "One-Time" && answers.frequency !== "Not Sure");
    var conditionMultiplier = conditionMultipliers[answers.condition] || 1.0;
    
    var afterCondition = isRecurring ? afterService : (afterService * conditionMultiplier);

    var discount = frequencyDiscounts[answers.frequency] || 0;
    var discountAmount = afterCondition * discount;
    var afterDiscount = afterCondition - discountAmount;

    var finalQuote = Math.round(afterDiscount / 5) * 5;

    // Apply minimum pricing
    var minimumPrice = (answers.frequency === "One-Time" || answers.frequency === "Not Sure") ? 175 : 100;
    if (finalQuote < minimumPrice) {
        finalQuote = minimumPrice;
    }

    var conditionNote = isRecurring 
        ? " (first visit only)" 
        : "";

    var breakdown =
        "Base (" + answers.bedrooms + " bed): $" + basePrice +
        " | Bathrooms (" + answers.bathrooms + "): +$" + bathroomAddon +
        " | Subtotal: $" + subtotal +
        " | " + answers.serviceType + " x" + serviceMultiplier + ": $" + Math.round(afterService) +
        " | " + answers.condition + " x" + conditionMultiplier + conditionNote + ": $" + Math.round(afterCondition) +
        " | " + answers.frequency + " -" + (discount * 100) + "%: -$" + Math.round(discountAmount) +
        " | TOTAL: $" + finalQuote;

    return breakdown;
}

// =============================================
// HELPER: Get both first & recurring prices
// =============================================

function getBothPrices() {
    var isRecurring = (answers.frequency !== "One-Time" && answers.frequency !== "Not Sure");
    
    if (!isRecurring) {
        // One-time booking — only one price
        return {
            firstVisit: calculateQuote(true),
            recurring: null
        };
    } else {
        // Recurring booking — show both
        return {
            firstVisit: calculateQuote(true),   // with condition markup
            recurring: calculateQuote(false)    // without condition markup
        };
    }
}

// =============================================
// CLEANING FLOW — SUBMIT
// =============================================

function submitQuote(event) {
    event.preventDefault();

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var extraNotes = document.getElementById("extraNotes").value.trim();
    answers.extraNotes = extraNotes || "None";

    if (!name || !email || !phone) {
        alert("Please fill in all fields.");
        return;
    }

    var submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    var loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.classList.remove("hidden");

    var prices = getBothPrices();
    var quoteBreakdown = getQuoteBreakdown();

    // For Google Sheets, send the first visit price (or only price for one-time)
    var quoteToSend = prices.firstVisit;

    var data = {
        name:           name,
        email:          email,
        phone:          phone,
        area:           answers.area,
        serviceType:    answers.serviceType,
        bedrooms:       answers.bedrooms,
        bathrooms:      answers.bathrooms,
        condition:      answers.condition,
        frequency:      answers.frequency,
        extraNotes:     answers.extraNotes,
        quoteBreakdown: quoteBreakdown,
        estimatedQuote: "$" + quoteToSend.toString() 
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        console.log("Success:", result);
        showResults(prices);
    })
    .catch(function(error) {
        console.error("Error:", error);
        showResults(prices);
    })
    .finally(function() {
        loadingOverlay.classList.add("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "Get My Estimate →";
    });
}

// =============================================
// CLEANING FLOW — SHOW RESULTS - UPDATED
// =============================================

function showResults(prices) {
    var summaryEl = document.getElementById("quoteSummary");

    summaryEl.innerHTML =
        "<p><span>Service</span><span>" + answers.serviceType + "</span></p>" +
        "<p><span>Bedrooms</span><span>" + answers.bedrooms + "</span></p>" +
        "<p><span>Bathrooms</span><span>" + answers.bathrooms + "</span></p>" +
        "<p><span>Condition</span><span>" + answers.condition + "</span></p>" +
        "<p><span>Frequency</span><span>" + answers.frequency + "</span></p>" +
        "<p><span>Area</span><span>" + answers.area + "</span></p>";

    // Display pricing based on whether it's recurring
    var pricingDisplayEl = document.getElementById("pricingDisplay");
    
    if (prices.recurring !== null) {
        // Recurring service — show both prices
        var savings = prices.firstVisit - prices.recurring;
        pricingDisplayEl.innerHTML = 
            '<div class="price-card">' +
            '<h3>First Deep Clean</h3>' +
            '<div class="price">$' + prices.firstVisit + '</div>' +
            '<p class="price-note">Initial visit includes condition assessment</p>' +
            '</div>' +
            '<div class="price-card highlight">' +
            '<h3>Then ' + answers.frequency + '</h3>' +
            '<div class="price">$' + prices.recurring + '</div>' +
            '<p class="price-note">Save $' + savings + ' on every visit after!</p>' +
            '</div>';
    } else {
        // One-time service — show single price
        pricingDisplayEl.innerHTML = 
            '<div class="price-card">' +
            '<h3>Your Estimate</h3>' +
            '<div class="price">$' + prices.firstVisit + '</div>' +
            '<p class="price-note">One-time service</p>' +
            '</div>';
    }

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
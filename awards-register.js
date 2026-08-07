// ==========================================
// CYON AWARDS REGISTRATION
// ==========================================

// Registration fee per category
const PRICE_PER_CATEGORY = 1000;

// Form elements
const form = document.getElementById("awardsRegistrationForm");
const genderSelect = document.getElementById("gender");
const categoryCheckboxes = document.querySelectorAll(
    'input[name="categories"]'
);

const categoryCount = document.getElementById("categoryCount");
const registrationTotal = document.getElementById("registrationTotal");
const registerButton = document.getElementById("registerButton");
const termsCheckbox = document.getElementById("terms");
const formMessage = document.getElementById("formMessage");


// ==========================================
// UPDATE CATEGORY AVAILABILITY
// ==========================================

function updateCategoryAvailability() {

    const gender = genderSelect.value;

    categoryCheckboxes.forEach((checkbox) => {

        const requiredGender = checkbox.dataset.gender;

        // Male category
        if (requiredGender === "male") {

            if (gender === "female") {

                checkbox.checked = false;
                checkbox.disabled = true;

                checkbox.closest(".category-option")
                    .classList.add("disabled");

            } else {

                checkbox.disabled = false;

                checkbox.closest(".category-option")
                    .classList.remove("disabled");

            }
        }


        // Female category
        if (requiredGender === "female") {

            if (gender === "male") {

                checkbox.checked = false;
                checkbox.disabled = true;

                checkbox.closest(".category-option")
                    .classList.add("disabled");

            } else {

                checkbox.disabled = false;

                checkbox.closest(".category-option")
                    .classList.remove("disabled");

            }
        }

    });

    updateTotal();
}


// ==========================================
// EXECUTIVE / GROUP LEADER RULE
// ==========================================

function enforceLeadershipRule(changedCheckbox) {

    if (
        changedCheckbox.dataset.group !== "leadership" ||
        !changedCheckbox.checked
    ) {
        return;
    }

    categoryCheckboxes.forEach((checkbox) => {

        if (
            checkbox !== changedCheckbox &&
            checkbox.dataset.group === "leadership"
        ) {

            checkbox.checked = false;

        }

    });

    updateTotal();
}


// ==========================================
// CALCULATE TOTAL
// ==========================================

function updateTotal() {

    let selectedCount = 0;

    categoryCheckboxes.forEach((checkbox) => {

        if (checkbox.checked) {
            selectedCount++;
        }

    });

    const total = selectedCount * PRICE_PER_CATEGORY;

    categoryCount.textContent = selectedCount;

    registrationTotal.textContent =
        `₦${total.toLocaleString("en-NG")}`;

    updateButtonState();
}


// ==========================================
// CHECK FORM STATE
// ==========================================

function updateButtonState() {

    const selectedCategories =
        document.querySelectorAll(
            'input[name="categories"]:checked'
        );

    const hasCategories = selectedCategories.length > 0;

    const isFormValid = form.checkValidity();

    const acceptedTerms = termsCheckbox.checked;

    registerButton.disabled =
        !hasCategories ||
        !isFormValid ||
        !acceptedTerms;
}


// ==========================================
// CATEGORY CHANGE
// ==========================================

categoryCheckboxes.forEach((checkbox) => {

    checkbox.addEventListener("change", () => {

        enforceLeadershipRule(checkbox);

        updateTotal();

    });

});


// ==========================================
// GENDER CHANGE
// ==========================================

genderSelect.addEventListener("change", () => {

    updateCategoryAvailability();

});


// ==========================================
// TERMS CHECKBOX
// ==========================================

termsCheckbox.addEventListener("change", () => {

    updateButtonState();

});


// ==========================================
// FORM INPUT VALIDATION
// ==========================================

form.addEventListener("input", () => {

    updateButtonState();

});


// ==========================================
// FORM SUBMISSION
// ==========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    // Get selected categories
    const selectedCategories = [];

    categoryCheckboxes.forEach((checkbox) => {

        if (checkbox.checked) {

            selectedCategories.push(
                checkbox.value
            );

        }

    });


    // Make sure at least one category is selected
    if (selectedCategories.length === 0) {

        showMessage(
            "Please select at least one award category.",
            "error"
        );

        return;

    }


    // Calculate payment amount
    const amount =
        selectedCategories.length *
        PRICE_PER_CATEGORY;


    // Collect form data
    const formData = {

        fullName:
            document.getElementById("fullName").value.trim(),

        gender:
            genderSelect.value,

        dob:
            document.getElementById("dob").value,

        phone:
            document.getElementById("phone").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        occupation:
            document.getElementById("occupation").value.trim(),

        address:
            document.getElementById("address").value.trim(),

        unit:
            document.getElementById("unit").value,

        bio:
            document.getElementById("bio").value.trim(),

        categories:
            selectedCategories,

        registrationFee:
            amount

    };


    // ==========================================
// SEND REGISTRATION TO CLOUDFLARE WORKER
// ==========================================

registerButton.disabled = true;
registerButton.textContent = "Processing...";

try {

    const response = await fetch(
        "https://cyon-voting-worker.tomgarh.workers.dev/awards/initialize-registration",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(formData)
        }
    );


    const data = await response.json();


    // ==========================================
    // HANDLE ERROR
    // ==========================================

    if (!response.ok || !data.status) {

        throw new Error(
            data.error ||
            data.message ||
            "Unable to initialize registration."
        );

    }


    // ==========================================
    // SEND CONTESTANT TO PAYSTACK
    // ==========================================

    if (data.data && data.data.authorization_url) {

        window.location.href =
            data.data.authorization_url;

        return;

    }


    throw new Error(
        "Paystack did not return a payment link."
    );


} catch (error) {

    console.error(
        "Awards registration error:",
        error
    );

    showMessage(
        error.message ||
        "Something went wrong. Please try again.",
        "error"
    );

    registerButton.disabled = false;
    registerButton.textContent = "Register & Pay";

}

    /*
    ==========================================
    NEXT STEP — PAYSTACK
    ==========================================

    We will send formData to the Cloudflare
    Worker here.

    The Worker will:

    1. Validate the categories
    2. Calculate the amount again
    3. Initialize Paystack
    4. Return the authorization URL

    We will NOT trust the amount calculated
    by the browser.

    ==========================================
    */


    showMessage(
        `Registration information ready. Total: ₦${amount.toLocaleString("en-NG")}`,
        "success"
    );

});


// ==========================================
// MESSAGE FUNCTION
// ==========================================

function showMessage(message, type) {

    formMessage.textContent = message;

    formMessage.className =
        `form-message ${type}`;

}


// ==========================================
// INITIAL STATE
// ==========================================

updateCategoryAvailability();
updateTotal();
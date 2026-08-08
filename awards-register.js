// ==========================================
// CYON AWARDS REGISTRATION
// ==========================================

// Registration fee per category
const PRICE_PER_CATEGORY = 1000;

// Cloudinary
const CLOUDINARY_CLOUD_NAME = "t71rt123";
const CLOUDINARY_UPLOAD_PRESET = "cyon-awards";


// Form elements
const form = document.getElementById("awardsRegistrationForm");
const genderSelect = document.getElementById("gender");
const photoInput = document.getElementById("photo");

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
// CLOUDINARY PHOTO UPLOAD
// ==========================================

async function uploadPhotoToCloudinary(file) {

    const cloudinaryUrl =
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const uploadData = new FormData();

    uploadData.append("file", file);

    uploadData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
        cloudinaryUrl,
        {
            method: "POST",
            body: uploadData
        }
    );

    const data = await response.json();

    if (!response.ok) {

        console.error(
            "Cloudinary upload error:",
            data
        );

        throw new Error(
            data.error?.message ||
            "Unable to upload contestant photo."
        );

    }

    return data.secure_url;
}

// ==========================================
// FORM SUBMISSION
// ==========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    // ==========================================
    // GET SELECTED CATEGORIES
    // ==========================================

    const selectedCategories = [];

    categoryCheckboxes.forEach((checkbox) => {

        if (checkbox.checked) {

            selectedCategories.push(
                checkbox.value
            );

        }

    });

    // ==========================================
    // MAKE SURE CATEGORY IS SELECTED
    // ==========================================

    if (selectedCategories.length === 0) {

        showMessage(
            "Please select at least one award category.",
            "error"
        );

        return;
    }

    // ==========================================
    // MAKE SURE PHOTO EXISTS
    // ==========================================

    const photoFile = photoInput.files[0];

    if (!photoFile) {

        showMessage(
            "Please upload your contestant photo.",
            "error"
        );

        return;
    }

    // ==========================================
    // CHECK PHOTO TYPE
    // ==========================================

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(photoFile.type)) {

        showMessage(
            "Please upload a JPG, PNG, or WebP image.",
            "error"
        );

        return;
    }

    // ==========================================
    // CHECK PHOTO SIZE
    // ==========================================

    const maxFileSize = 5 * 1024 * 1024;

    if (photoFile.size > maxFileSize) {

        showMessage(
            "Photo must be 5MB or smaller.",
            "error"
        );

        return;
    }

    // ==========================================
    // CALCULATE PAYMENT
    // ==========================================

    const amount =
        selectedCategories.length *
        PRICE_PER_CATEGORY;

    // ==========================================
    // DISABLE BUTTON
    // ==========================================

    registerButton.disabled = true;
    registerButton.textContent = "Uploading Photo...";

    try {

        // ==========================================
        // UPLOAD PHOTO TO CLOUDINARY
        // ==========================================

        const photoUrl =
            await uploadPhotoToCloudinary(photoFile);

        console.log(
            "Cloudinary photo URL:",
            photoUrl
        );

        // ==========================================
        // COLLECT FORM DATA
        // ==========================================

        const formData = {

            fullName:
                document.getElementById("fullName")
                    .value
                    .trim(),

            gender:
                genderSelect.value,

            dob:
                document.getElementById("dob")
                    .value,

            phone:
                document.getElementById("phone")
                    .value
                    .trim(),

            email:
                document.getElementById("email")
                    .value
                    .trim(),

            occupation:
                document.getElementById("occupation")
                    .value
                    .trim(),

            address:
                document.getElementById("address")
                    .value
                    .trim(),

            bio:
                document.getElementById("bio")
                    .value
                    .trim(),

            categories:
                selectedCategories,

            registrationFee:
                amount,

            photoUrl:
                photoUrl
        };

        // ==========================================
        // SEND REGISTRATION TO CLOUDFLARE WORKER
        // ==========================================

        registerButton.textContent =
            "Processing Payment...";

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

        const data =
            await response.json();

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

        if (
            data.data &&
            data.data.authorization_url
        ) {

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

        registerButton.textContent =
            "Proceed to Payment";
    }
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
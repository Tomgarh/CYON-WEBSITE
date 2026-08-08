// ==========================================
// CYON AWARDS VOTING
// ==========================================

// Vote price
const PRICE_PER_VOTE = 100;

// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
    authDomain: "cyon-stbernard.firebaseapp.com",
    projectId: "cyon-stbernard",
    storageBucket: "cyon-stbernard.firebasestorage.app",
    messagingSenderId: "747151921456",
    appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
  };
  
// ==========================================
// FIREBASE
// ==========================================

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();


// ==========================================
// FORM ELEMENTS
// ==========================================

const form =
    document.getElementById("awardsVotingForm");

const categorySelect =
    document.getElementById("category");

const contestantSelect =
    document.getElementById("contestant");

const contestantInfo =
    document.getElementById("contestantInfo");

const votesInput =
    document.getElementById("votes");

const voteTotal =
    document.getElementById("voteTotal");

const emailInput =
    document.getElementById("email");

const phoneInput =
    document.getElementById("phone");

const voteButton =
    document.getElementById("voteButton");

const formMessage =
    document.getElementById("formMessage");


// ==========================================
// CURRENT CONTESTANTS
// ==========================================

let contestants = [];


// ==========================================
// LOAD CONTESTANTS
// ==========================================

async function loadContestants(category) {

    contestantSelect.innerHTML = `
        <option value="">
            Loading contestants...
        </option>
    `;

    contestantSelect.disabled = true;

    contestantInfo.innerHTML = "";

    contestants = [];

    try {

        const snapshot =
            await db
                .collection("cyon_awards_registrations")
                .get();


        snapshot.forEach((doc) => {

            const data = doc.data();

            const categories =
                data.categories || [];


            // Check whether contestant
            // registered for this category

            if (categories.includes(category)) {

                contestants.push({

                    id: doc.id,

                    ...data

                });

            }

        });


        // ==========================================
        // NO CONTESTANTS
        // ==========================================

        if (contestants.length === 0) {

            contestantSelect.innerHTML = `
                <option value="">
                    No contestants available
                </option>
            `;

            contestantSelect.disabled = true;

            updateButtonState();

            return;
        }


        // ==========================================
        // DISPLAY CONTESTANTS
        // ==========================================

        contestantSelect.innerHTML = `
            <option value="">
                Select a contestant
            </option>
        `;


        contestants.forEach((contestant) => {

            const option =
                document.createElement("option");

            option.value =
                contestant.id;

            option.textContent =
                contestant.fullName;

            contestantSelect.appendChild(option);

        });


        contestantSelect.disabled = false;

        updateButtonState();


    } catch (error) {

        console.error(
            "Error loading contestants:",
            error
        );

        contestantSelect.innerHTML = `
            <option value="">
                Unable to load contestants
            </option>
        `;

        showMessage(
            "Unable to load contestants. Please try again.",
            "error"
        );

    }

}


// ==========================================
// CATEGORY CHANGE
// ==========================================

categorySelect.addEventListener(
    "change",
    () => {

        const category =
            categorySelect.value;


        if (!category) {

            contestantSelect.innerHTML = `
                <option value="">
                    Select a category first
                </option>
            `;

            contestantSelect.disabled = true;

            contestantInfo.innerHTML = "";

            contestants = [];

            updateButtonState();

            return;
        }


        loadContestants(category);

    }
);


// ==========================================
// CONTESTANT CHANGE
// ==========================================

contestantSelect.addEventListener(
    "change",
    () => {

        const contestantId =
            contestantSelect.value;


        contestantInfo.innerHTML = "";


        if (!contestantId) {

            updateButtonState();

            return;

        }


        const contestant =
            contestants.find(
                item =>
                    item.id === contestantId
            );


        if (!contestant) {

            updateButtonState();

            return;

        }


        // ==========================================
        // GET CURRENT CATEGORY VOTES
        // ==========================================

        const category =
            categorySelect.value;

        const currentVotes =
            contestant.votes?.[category] || 0;


        // ==========================================
        // DISPLAY CONTESTANT INFORMATION
        // ==========================================

        contestantInfo.innerHTML = `

    <div>

        <img
            src="${escapeHTML(contestant.photoUrl || "")}"
            alt="${escapeHTML(contestant.fullName || "Contestant")}"
        >

        <h3>
            ${escapeHTML(
                contestant.fullName || ""
            )}
        </h3>

        <p>
            ${escapeHTML(
                contestant.bio || ""
            )}
        </p>

        <p>
            Current Votes:
            <strong>
                ${currentVotes}
            </strong>
        </p>

    </div>

`;


        updateButtonState();

    }
);


// ==========================================
// UPDATE TOTAL
// ==========================================

function updateTotal() {

    let voteCount =
        Number(votesInput.value);


    if (
        !Number.isInteger(voteCount) ||
        voteCount < 1
    ) {

        voteCount = 1;

    }


    const total =
        voteCount * PRICE_PER_VOTE;


    voteTotal.textContent =
        `₦${total.toLocaleString("en-NG")}`;


    updateButtonState();

}


// ==========================================
// VOTE COUNT CHANGE
// ==========================================

votesInput.addEventListener(
    "input",
    updateTotal
);


// ==========================================
// EMAIL / PHONE CHANGE
// ==========================================

emailInput.addEventListener(
    "input",
    updateButtonState
);

phoneInput.addEventListener(
    "input",
    updateButtonState
);


// ==========================================
// CHECK FORM STATE
// ==========================================

function updateButtonState() {

    const hasCategory =
        categorySelect.value !== "";


    const hasContestant =
        contestantSelect.value !== "";


    const voteCount =
        Number(votesInput.value);


    const validVotes =
        Number.isInteger(voteCount) &&
        voteCount > 0;


    const validEmail =
        emailInput.checkValidity();


    const hasPhone =
        phoneInput.value.trim() !== "";


    voteButton.disabled =
        !hasCategory ||
        !hasContestant ||
        !validVotes ||
        !validEmail ||
        !hasPhone;

}


// ==========================================
// FORM SUBMISSION
// ==========================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // ==========================================
        // GET VALUES
        // ==========================================

        const contestantId =
            contestantSelect.value;

        const category =
            categorySelect.value;

        const voteCount =
            Number(votesInput.value);

        const email =
            emailInput.value.trim();

        const phone =
            phoneInput.value.trim();


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!category) {

            showMessage(
                "Please select an award category.",
                "error"
            );

            return;

        }


        if (!contestantId) {

            showMessage(
                "Please select a contestant.",
                "error"
            );

            return;

        }


        if (
            !Number.isInteger(voteCount) ||
            voteCount <= 0
        ) {

            showMessage(
                "Please enter a valid number of votes.",
                "error"
            );

            return;

        }


        if (!email) {

            showMessage(
                "Please enter your email address.",
                "error"
            );

            return;

        }


        if (!phone) {

            showMessage(
                "Please enter your phone number.",
                "error"
            );

            return;

        }


        // ==========================================
        // CALCULATE AMOUNT
        // ==========================================

        const amount =
            voteCount * PRICE_PER_VOTE;


        // ==========================================
        // DISABLE BUTTON
        // ==========================================

        voteButton.disabled = true;

        voteButton.textContent =
            "Processing...";


        showMessage(
            "Preparing your payment...",
            "info"
        );


        try {

            // ==========================================
            // SEND TO CLOUDFLARE WORKER
            // ==========================================

            const response =
                await fetch(
                    "https://cyon-voting-worker.tomgarh.workers.dev/awards/initialize-vote",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            contestantId,

                            category,

                            votes:
                                voteCount,

                            email,

                            phone,

                            amount

                        })

                    }
                );


            const data =
                await response.json();


            // ==========================================
            // HANDLE WORKER ERROR
            // ==========================================

            if (
                !response.ok ||
                !data.status
            ) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to initialize voting payment."
                );

            }


            // ==========================================
            // REDIRECT TO PAYSTACK
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
                "Awards voting error:",
                error
            );


            showMessage(
                error.message ||
                "Something went wrong. Please try again.",
                "error"
            );


            voteButton.disabled = false;

            voteButton.textContent =
                "Proceed to Payment";

        }

    }
);


// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, type) {

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message ${type}`;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}


// ==========================================
// INITIAL STATE
// ==========================================

updateTotal();
updateButtonState();
// ======================================
// GLOBAL VARIABLES
// ======================================

let selectedContestant = null;
let selectedVotes = 1;
let selectedAmount = 100;


// ======================================
// DOM ELEMENTS
// ======================================

const modal = document.getElementById("voteModal");

const closeBtn = document.querySelector(".close-modal");

const voteButtons = document.querySelectorAll(".vote-btn");

const optionButtons = document.querySelectorAll(".vote-option");

const customVoteInput = document.getElementById("customVoteInput");

const totalAmount = document.getElementById("totalAmount");

const contestantName = document.getElementById("modalContestantName");

const contestantGroup = document.getElementById("modalContestantGroup");

const proceedButton = document.getElementById("proceedPayment");


// ======================================
// OPEN MODAL
// ======================================

voteButtons.forEach(button => {

    button.addEventListener("click", () => {

        selectedContestant = {

            id: button.dataset.id,

            name: button.dataset.name,

            group: button.dataset.group

        };


        contestantName.textContent = selectedContestant.name;

        contestantGroup.textContent = selectedContestant.group;


        selectedVotes = 1;

        selectedAmount = 100;

        customVoteInput.value = "";


        updateAmount();


        modal.style.display = "flex";

    });

});


// ======================================
// CLOSE MODAL
// ======================================

closeBtn.onclick = () => {

    modal.style.display = "none";

};


window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};


// ======================================
// PRESET VOTE PACKAGES
// ======================================

optionButtons.forEach(btn => {

    btn.addEventListener("click", () => {


        optionButtons.forEach(b => {

            b.classList.remove("selected");

        });


        btn.classList.add("selected");


        selectedVotes = parseInt(btn.dataset.votes);

        selectedAmount = selectedVotes * 100;


        customVoteInput.value = "";


        updateAmount();


    });

});


// ======================================
// CUSTOM VOTES
// ======================================

customVoteInput.addEventListener("input", () => {


    optionButtons.forEach(b => {

        b.classList.remove("selected");

    });


    const value = parseInt(customVoteInput.value);


    if (!value || value < 1) {


        selectedVotes = 1;

        selectedAmount = 100;


    } else {


        selectedVotes = value;

        selectedAmount = value * 100;


    }


    updateAmount();


});


// ======================================
// UPDATE AMOUNT
// ======================================

function updateAmount() {

    totalAmount.textContent =
        "₦" + selectedAmount.toLocaleString();

}


// ======================================
// PAYMENT BUTTON
// ======================================

proceedButton.addEventListener("click", async () => {


    const email = document
        .getElementById("voterEmail")
        .value
        .trim();


    const phone = document
        .getElementById("voterPhone")
        .value
        .trim();



    if (email === "") {

        alert("Please enter your email.");

        return;

    }



    if (selectedContestant === null) {

        alert("No contestant selected.");

        return;

    }



    proceedButton.disabled = true;

    proceedButton.textContent = "Preparing Payment...";



    const payload = {

        contestantId: selectedContestant.id,

        votes: selectedVotes,

        email: email,

        phone: phone

    };


    console.log("Payment Payload:", payload);



    try {


        const response = await fetch(
            "https://cyon-voting-worker.tomgarh.workers.dev/initialize-payment",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(payload)

            }
        );



        const data = await response.json();


        console.log("Worker Response:", data);



        if (
            data.status === true &&
            data.data.authorization_url
        ) {


            window.location.href =
                data.data.authorization_url;


        } else {


            alert("Payment initialization failed");

        }



    } catch (error) {


        console.error(error);

        alert("Something went wrong. Try again.");


    } finally {


        proceedButton.disabled = false;

        proceedButton.textContent = "Proceed To Payment";


    }


});
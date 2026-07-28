// ======================================
// FIREBASE IMPORTS (LIVE VOTE COUNTS)
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// FIREBASE CONFIG
// ======================================
const firebaseConfig = {
    apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
    authDomain: "cyon-stbernard.firebaseapp.com",
    projectId: "cyon-stbernard",
    storageBucket: "cyon-stbernard.firebasestorage.app",
    messagingSenderId: "747151921456",
    appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
  };
   

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const groupNames = {};

// ======================================
// LOAD GROUPS & CONTESTANTS
// ======================================

const groupsContainer =
document.getElementById("groupsContainer");

async function loadContestants(){

    groupsContainer.innerHTML = "";

    const groupsSnapshot =
    await getDocs(
        collection(db, "groups")
    );
    groupsSnapshot.forEach(doc => {

        groupNames[doc.id] = doc.data().name;
    
    });


    const contestantsSnapshot =
    await getDocs(
        collection(db, "contestants")
    );

    const contestants =
    contestantsSnapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data()

    }));
    document.getElementById("contestantCount").textContent =
    contestants.length;

document.getElementById("groupCount").textContent =
    groupsSnapshot.size;

    groupsSnapshot.forEach(groupDoc => {

        const group = groupDoc.data();

        const members =
        contestants.filter(c =>

            c.group === groupDoc.id

        );

        if(members.length === 0)
            return;

        const section =
        document.createElement("section");

        section.className = "group-section";

        section.innerHTML = `

            <h2>${group.name}</h2>

            <div class="contestants-grid"></div>

        `;

        const grid =
        section.querySelector(".contestants-grid");

        members.forEach(contestant => {

            const card =
            document.createElement("div");

            card.className =
            "contestant-card";

            card.innerHTML = `

                <img
                    src="${contestant.photoURL}"
                    alt="${contestant.name}"
                >

                <h3>${contestant.name}</h3>

                <p class="gender-badge">${contestant.gender}</p>
                <p class="group-name">

    ${groupNames[contestant.group] || contestant.group}

</p>

                <div class="vote-count">

<span>

❤️ LIVE VOTES

</span>

<strong id="${contestant.id}_votes">

${contestant.votes || 0}

</strong>

</div>
                <button
                    class="vote-btn"
                    data-id="${contestant.id}"
                    data-name="${contestant.name}"
                    data-group="${group.name}"
                >

                    Vote Now

                </button>

            `;

            grid.appendChild(card);

            const contestantRef = doc(
                db,
                "contestants",
                contestant.id
            );
            
            onSnapshot(contestantRef, (snapshot) => {
            
                if (!snapshot.exists()) return;
            
                const data = snapshot.data();
            
                const voteElement = document.getElementById(
                    contestant.id + "_votes"
                );
            
                if (voteElement) {
            
                    voteElement.textContent =
                        data.votes || 0;
            
                }
            
            });

        });



        groupsContainer.appendChild(section);

    });

}





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

document.addEventListener("click", (e) => {

    const button = e.target.closest(".vote-btn");

    if (!button) return;

    selectedContestant = {

        id: button.dataset.id,

        name: button.dataset.name,

        group: button.dataset.group

    };

    contestantName.textContent =
        selectedContestant.name;

    contestantGroup.textContent =
        selectedContestant.group;

    selectedVotes = 1;

    selectedAmount = 100;

    customVoteInput.value = "";

    optionButtons.forEach(btn =>
        btn.classList.remove("selected")
    );

    updateAmount();

    modal.style.display = "flex";

});


// ======================================
// CLOSE MODAL
// ======================================

closeBtn.onclick = () => {

    modal.style.display = "none";
    document.body.style.overflow = "";

};



window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";
        document.body.style.overflow = "";

    }

};



// ======================================
// PRESET VOTE PACKAGES
// ======================================

optionButtons.forEach(btn => {


    btn.addEventListener("click", ()=>{


        optionButtons.forEach(b=>{

            b.classList.remove("selected");

        });



        btn.classList.add("selected");



        selectedVotes =
            parseInt(btn.dataset.votes);



        selectedAmount =
            selectedVotes * 100;



        customVoteInput.value = "";

        updateAmount();



    });


});



// ======================================
// CUSTOM VOTES
// ======================================

customVoteInput.addEventListener("input", ()=>{


    optionButtons.forEach(b=>{

        b.classList.remove("selected");

    });



    const value =
        parseInt(customVoteInput.value);



    if(!value || value < 1){


        selectedVotes = 1;

        selectedAmount = 100;


    }else{


        selectedVotes = value;

        selectedAmount = value * 100;


    }



    updateAmount();


});



// ======================================
// UPDATE AMOUNT
// ======================================

function updateAmount(){


    totalAmount.textContent =
        "₦" + selectedAmount.toLocaleString();


}



// ======================================
// PAYMENT BUTTON
// ======================================

proceedButton.addEventListener("click", async ()=>{


    const email =
        document.getElementById("voterEmail")
        .value
        .trim();



    const phone =
        document.getElementById("voterPhone")
        .value
        .trim();



    if(email === ""){


        alert("Please enter your email.");

        return;


    }



    if(selectedContestant === null){


        alert("No contestant selected.");

        return;


    }



    proceedButton.disabled = true;

    proceedButton.textContent =
        "Preparing Payment...";



    const payload = {


        contestantId:
            selectedContestant.id,


        votes:
            selectedVotes,


        email,

        phone


    };



    console.log(
        "Payment Payload:",
        payload
    );



    try{


        const response = await fetch(

            "https://cyon-voting-worker.tomgarh.workers.dev/initialize-payment",

            {

                method:"POST",

                headers:{

                    "Content-Type":
                    "application/json"

                },

                body:
                JSON.stringify(payload)

            }

        );



        const data =
            await response.json();



        console.log(
            "Worker Response:",
            data
        );



        if(
            data.status === true &&
            data.data.authorization_url
        ){


            window.location.href =
                data.data.authorization_url;


        }else{


            alert(
                "Payment initialization failed"
            );


        }



    }catch(error){


        console.error(error);

        alert(
            "Something went wrong. Try again."
        );


    }finally{


        proceedButton.disabled = false;

        proceedButton.textContent =
            "Proceed To Payment";


    }


});
function loadLeaderboard() {

    const maleLeaderboard =
        document.getElementById("maleLeaderboard");

    const femaleLeaderboard =
        document.getElementById("femaleLeaderboard");

    onSnapshot(

        collection(db, "contestants"),

        (snapshot) => {

            const contestants = [];

            snapshot.forEach(doc => {

                contestants.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            // Total Votes
            const totalVotes = contestants.reduce(

                (sum, contestant) =>

                    sum + (contestant.votes || 0),

                0

            );

            document.getElementById("totalVotes").textContent =
                totalVotes.toLocaleString();

            // Highest votes first
            contestants.sort(

                (a, b) => (b.votes || 0) - (a.votes || 0)

            );

            // Split by gender
            const males = contestants.filter(

                contestant => contestant.gender === "Male"

            );

            const females = contestants.filter(

                contestant => contestant.gender === "Female"

            );

            renderLeaderboard(maleLeaderboard, males);

            renderLeaderboard(femaleLeaderboard, females);

        }

    );

}


// ======================================
// RENDER LEADERBOARD
// ======================================

function renderLeaderboard(container, contestants) {

    container.innerHTML = "";

    contestants.forEach((contestant, index) => {

        const item = document.createElement("div");

        item.className = "leaderboard-item";

        if (index === 0) {

            item.classList.add("gold");

        } else if (index === 1) {

            item.classList.add("silver");

        } else if (index === 2) {

            item.classList.add("bronze");

        }

        let medal = "";

        if (index === 0) {

            medal = "🥇";

        } else if (index === 1) {

            medal = "🥈";

        } else if (index === 2) {

            medal = "🥉";

        }

        item.innerHTML = `

            <div class="leaderboard-rank">

                ${medal || "#" + (index + 1)}

            </div>

            <img
                src="${contestant.photoURL}"
                alt="${contestant.name}"
            >

            <div class="leaderboard-details">

                <h4>${contestant.name}</h4>

                <p>${groupNames[contestant.group] || contestant.group} </p>

            </div>

            <div class="leaderboard-votes">

                ❤️ ${contestant.votes || 0}

            </div>

        `;

        container.appendChild(item);

    });

}

loadContestants();
loadLeaderboard();
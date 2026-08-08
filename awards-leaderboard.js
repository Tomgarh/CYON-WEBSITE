// ==========================================
// CYON AWARDS — LIVE LEADERBOARD
// ==========================================


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyC-ADpygB1K1ELcBI3x2TtoOUpumKLa2zuw",

    authDomain:
        "cyon-stbernard.firebaseapp.com",

    projectId:
        "cyon-stbernard",

    storageBucket:
        "cyon-stbernard.firebasestorage.app",

    messagingSenderId:
        "747151921456",

    appId:
        "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"

};


// ==========================================
// INITIALIZE FIREBASE
// ==========================================

firebase.initializeApp(firebaseConfig);

const db =
    firebase.firestore();


// ==========================================
// FORM ELEMENTS
// ==========================================

const categorySelect =
    document.getElementById("category");

const leaderboard =
    document.getElementById("leaderboard");

const leaderboardTitle =
    document.getElementById("leaderboardTitle");


// ==========================================
// CATEGORY NAMES
// ==========================================

const categoryNames = {

    best_executive:
        "Best Executive Member",

    best_group_leader:
        "Best Group Leader",

    most_active_male:
        "Most Active Male Member",

    most_active_female:
        "Most Active Female Member",

    most_social_male:
        "Most Social Male Member",

    most_social_female:
        "Most Social Female Member",

    male_entrepreneur:
        "Male Entrepreneur of the Year",

    female_entrepreneur:
        "Female Entrepreneur of the Year"

};


// ==========================================
// FIRESTORE LISTENER
// ==========================================

let unsubscribe = null;


// ==========================================
// CATEGORY CHANGE
// ==========================================

categorySelect.addEventListener(
    "change",
    function () {

        const category =
            categorySelect.value;


        // ==========================================
        // STOP PREVIOUS LISTENER
        // ==========================================

        if (unsubscribe) {

            unsubscribe();

            unsubscribe = null;

        }


        // ==========================================
        // NO CATEGORY SELECTED
        // ==========================================

        if (!category) {

            leaderboardTitle.textContent =
                "Select a category";

            leaderboard.innerHTML =
                "<p>Select an award category above to view the live results.</p>";

            return;

        }


        // ==========================================
        // UPDATE TITLE
        // ==========================================

        leaderboardTitle.textContent =
            categoryNames[category] ||
            "Live Results";


        leaderboard.innerHTML =
            "<p>Loading live results...</p>";


        // ==========================================
        // START LIVE LISTENER
        // ==========================================

        listenForResults(category);

    }
);


// ==========================================
// LISTEN FOR LIVE RESULTS
// ==========================================

function listenForResults(category) {

    unsubscribe =
        db
            .collection(
                "cyon_awards_registrations"
            )
            .onSnapshot(

                function (snapshot) {

                    const contestants = [];


                    // ==========================================
                    // GET CONTESTANTS
                    // ==========================================

                    snapshot.forEach(
                        function (doc) {

                            const data =
                                doc.data();


                            const categories =
                                data.categories || [];


                            // ==========================================
                            // CHECK CATEGORY
                            // ==========================================

                            if (
                                categories.includes(
                                    category
                                )
                            ) {

                                const categoryVotes =
                                    data.votes &&
                                    data.votes[category]
                                        ? data.votes[category]
                                        : 0;


                                contestants.push({

                                    id:
                                        doc.id,

                                    fullName:
                                        data.fullName || "",

                                    bio:
                                        data.bio || "",

                                    photoUrl:
                                        data.photoUrl || "",

                                    votes:
                                        Number(
                                            categoryVotes
                                        )

                                });

                            }

                        }
                    );


                    // ==========================================
                    // SORT BY VOTES
                    // ==========================================

                    contestants.sort(
                        function (a, b) {

                            return b.votes -
                                a.votes;

                        }
                    );


                    // ==========================================
                    // DISPLAY
                    // ==========================================

                    displayLeaderboard(
                        contestants
                    );

                },


                // ==========================================
                // FIRESTORE ERROR
                // ==========================================

                function (error) {

                    console.error(
                        "Leaderboard error:",
                        error
                    );


                    leaderboard.innerHTML =
                        "<p>Unable to load live results.</p>";

                }

            );

}


// ==========================================
// DISPLAY LEADERBOARD
// ==========================================

function displayLeaderboard(
    contestants
) {

    // ==========================================
    // NO CONTESTANTS
    // ==========================================

    if (
        contestants.length === 0
    ) {

        leaderboard.innerHTML =
            "<p>No contestants are registered for this category yet.</p>";

        return;

    }


    // ==========================================
    // CLEAR OLD RESULTS
    // ==========================================

    leaderboard.innerHTML = "";


    // ==========================================
    // CREATE CONTESTANT CARDS
    // ==========================================

    contestants.forEach(
        function (contestant, index) {

            const rank =
                index + 1;


            // ==========================================
            // RANK DISPLAY
            // ==========================================

            let rankDisplay =
                rank;


            if (rank === 1) {

                rankDisplay =
                    "🥇";

            }


            if (rank === 2) {

                rankDisplay =
                    "🥈";

            }


            if (rank === 3) {

                rankDisplay =
                    "🥉";

            }


            // ==========================================
            // CARD
            // ==========================================

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "leaderboard-card";


            // ==========================================
            // RANK
            // ==========================================

            const rankElement =
                document.createElement(
                    "div"
                );


            rankElement.className =
                "leaderboard-rank";


            rankElement.textContent =
                rankDisplay;


            // ==========================================
            // PHOTO
            // ==========================================

            const photoElement =
                document.createElement(
                    "img"
                );


            photoElement.className =
                "leaderboard-photo";


            photoElement.src =
                contestant.photoUrl ||
                "";


            photoElement.alt =
                contestant.fullName ||
                "Contestant";


            // ==========================================
            // DETAILS
            // ==========================================

            const details =
                document.createElement(
                    "div"
                );


            details.className =
                "leaderboard-details";


            // ==========================================
            // NAME
            // ==========================================

            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                contestant.fullName;


            // ==========================================
            // BIO
            // ==========================================

            const bio =
                document.createElement(
                    "p"
                );


            bio.textContent =
                contestant.bio;


            details.appendChild(
                name
            );


            details.appendChild(
                bio
            );


            // ==========================================
            // VOTES
            // ==========================================

            const votes =
                document.createElement(
                    "div"
                );


            votes.className =
                "leaderboard-votes";


            // ==========================================
            // VOTE NUMBER
            // ==========================================

            const voteNumber =
                document.createElement(
                    "strong"
                );


            voteNumber.textContent =
                contestant.votes.toLocaleString(
                    "en-NG"
                );


            // ==========================================
            // VOTE LABEL
            // ==========================================

            const voteLabel =
                document.createElement(
                    "span"
                );


            voteLabel.textContent =
                "Votes";


            votes.appendChild(
                voteNumber
            );


            votes.appendChild(
                voteLabel
            );


            // ==========================================
            // BUILD CARD
            // ==========================================

            card.appendChild(
                rankElement
            );


            card.appendChild(
                photoElement
            );


            card.appendChild(
                details
            );


            card.appendChild(
                votes
            );


            // ==========================================
            // ADD CARD TO LEADERBOARD
            // ==========================================

            leaderboard.appendChild(
                card
            );

        }
    );

}
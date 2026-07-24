const formMessage =
document.getElementById("formMessage");

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

function showMessage(message, color){

    formMessage.textContent = message;
    formMessage.style.color = color;

}

function clearMessage(){

    showMessage("", "");

}

function validateContestant(card){

    const fullname =
    card.querySelector(".fullname").value.trim();

    const phone =
    card.querySelector(".phone").value.trim();

    const email =
    card.querySelector(".email").value.trim();

    const gender =
    card.querySelector(".gender").value;

    const photo =
    card.querySelector(".photo").files[0];

    if(fullname.length < 3){

        showMessage(
            "Every contestant must have a valid full name.",
            "red"
        );

        return false;

    }

    if(phone.length < 10){

        showMessage(
            "Enter a valid phone number for every contestant.",
            "red"
        );

        return false;

    }

    const emailPattern =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailPattern.test(email)){

    showMessage(
        "Enter a valid email address.",
        "red"
    );

    return false;

}

    if(!gender){

        showMessage(
            "Please select the gender of every contestant.",
            "red"
        );

        return false;

    }

    if(!photo){

        showMessage(
            "Every contestant must upload a passport photograph.",
            "red"
        );

        return false;

    }

    const extension =
    photo.name.split(".").pop().toLowerCase();
    
    const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp"
    ];
    
    if(
        !ALLOWED_TYPES.includes(photo.type) ||
        !allowedExtensions.includes(extension)
    ){
    
        showMessage(
            "Passport photos must be JPG, JPEG, PNG or WEBP.",
            "red"
        );
    
        return false;
    
    }

    return true;

}

function hasDuplicatePhones(){

    const phones = [];

    const cards =
    contestantsContainer.querySelectorAll(
        ".contestant-card"
    );

    for(const card of cards){

        const phone =
        card.querySelector(".phone")
        .value.trim();

        if(phones.includes(phone)){

            showMessage(
                "Duplicate phone numbers are not allowed.",
                "red"
            );

            return true;

        }

        phones.push(phone);

    }

    return false;

}
function hasDuplicateEmails() {

    const emails = [];

    const cards = contestantsContainer.querySelectorAll(".contestant-card");

    for (const card of cards) {

        const email = card.querySelector(".email").value.trim().toLowerCase();

        if (emails.includes(email)) {

            showMessage(
                "Duplicate email addresses are not allowed.",
                "red"
            );

            return true;
        }

        emails.push(email);

    }

    return false;

}



const firebaseConfig = {
    apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
    authDomain: "cyon-stbernard.firebaseapp.com",
    projectId: "cyon-stbernard",
    storageBucket: "cyon-stbernard.firebasestorage.app",
    messagingSenderId: "747151921456",
    appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
  };

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// ==============================
// ELEMENTS
// ==============================

const groupSelect = document.getElementById("group");

const contestantsContainer =
document.getElementById("contestantsContainer");

const template =
document.getElementById("contestantTemplate");

const addBtn =
document.getElementById("addContestant");

const contestantCount =
document.getElementById("contestantCount");

const totalAmount =
document.getElementById("totalAmount");

const form =
document.getElementById("registrationForm");

const submitBtn =
document.querySelector("button[type='submit']");

// ==============================
// SETTINGS
// ==============================

const REGISTRATION_FEE = 2500;
const MINIMUM_CONTESTANTS = 2;

// ==============================
// LOAD GROUPS
// ==============================

async function loadGroups(){

    try{

        const snapshot = await db
        .collection("groups")
        .orderBy("name")
        .get();

        snapshot.forEach(doc=>{

            const group = doc.data();

            const option =
            document.createElement("option");

            option.value = doc.id;

            option.textContent = group.name;

            groupSelect.appendChild(option);

        });

    }

    catch(err){

        console.error(err);

    }

}

// ==============================
// ADD CONTESTANT
// ==============================

function addContestant(){

    const clone =
    template.content.cloneNode(true);

    contestantsContainer.appendChild(clone);

    updateTitles();

    calculateTotal();

}

// ==============================
// REMOVE CONTESTANT
// ==============================

contestantsContainer.addEventListener("click",(e)=>{

    if(!e.target.classList.contains("removeContestant"))
        return;

    if(contestantsContainer.children.length===1){

        alert(
            "At least one contestant is required."
        );

        return;

    }

    e.target
    .closest(".contestant-card")
    .remove();

    updateTitles();

    calculateTotal();

});

// ==============================
// UPDATE TITLES
// ==============================

function updateTitles(){

    const cards =
    contestantsContainer.querySelectorAll(
        ".contestant-card"
    );

    cards.forEach((card,index)=>{

        card.querySelector(
            ".contestant-title"
        ).textContent =
        `Contestant ${index+1}`;

    });

    contestantCount.textContent =
    cards.length;

}

// ==============================
// CALCULATE PAYMENT
// ==============================

function calculateTotal(){

    const count =
    contestantsContainer.children.length;

    let payableContestants =
    Math.max(count,MINIMUM_CONTESTANTS);

    const amount =
    payableContestants *
    REGISTRATION_FEE;

    totalAmount.textContent =
    `₦${amount.toLocaleString()}`;

}

// ==============================
// ADD BUTTON
// ==============================

addBtn.addEventListener("click",()=>{

    addContestant();

});

// ==============================
// SUBMIT
// ==============================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    clearMessage();
    if(submitBtn.disabled){
        return;
    }

    if (!groupSelect.value) {

        return showMessage(
            "Please select a group.",
            "red"
        );

    }

    const cards = contestantsContainer.querySelectorAll(".contestant-card");

    for (const card of cards) {

        if (!validateContestant(card))
            return;

    }

    if (hasDuplicatePhones())
        return;

    if (hasDuplicateEmails())
        return;

    const count = cards.length;

    const payable = Math.max(
        count,
        MINIMUM_CONTESTANTS
    );

    const amount = payable * REGISTRATION_FEE;

    showMessage(
        "Uploading contestant photos...",
        "#0b7a3b"
    );

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {

        const registration = {

            group: groupSelect.value,

            contestants: []

        };

        for (const card of cards) {

            const photoFile =
                card.querySelector(".photo").files[0];

            const photoURL =
                await uploadPhoto(photoFile);

            registration.contestants.push({

                name: card.querySelector(".fullname").value.trim(),

                phone: card.querySelector(".phone").value.trim(),

                email: card.querySelector(".email").value.trim(),

                gender: card.querySelector(".gender").value,

                photoURL

            });

        }

        console.log(registration);

        await initializePayment(registration);

    }

    catch (error) {

        console.error(error);

        showMessage(
            error.message,
            "red"
        );

    }

    finally {

        submitBtn.disabled = false;

        submitBtn.textContent = "Proceed to Payment";

    }

});

// ==============================
// CLOUDINARY
// ==============================

const CLOUD_NAME = "t71rt123";
const UPLOAD_PRESET = "cyon-members";

async function uploadPhoto(file){

    const formData = new FormData();

    formData.append("file", file);

    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(

        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

        {

            method:"POST",

            body:formData

        }

    );

    if(!response.ok){

        throw new Error(
            "Photo upload failed."
        );
    
    }
    
    const data = await response.json();
    
    if(!data.secure_url){
    
        throw new Error(
            "Photo upload failed."
        );
    
    }

    return data.secure_url;

}

// ==============================
// INITIALIZE PAYMENT
// ==============================
showMessage(
    "Redirecting to Paystack...",
    "#0b7a3b"
);

async function initializePayment(registration){

    try{

        const response = await fetch(

            "https://cyon-voting-worker.tomgarh.workers.dev/initialize-registration",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify(registration)

            }

        );

        const data = await response.json();

        console.log(data);

        if(
            data.status &&
            data.data.authorization_url
        ){

            window.location.href =
            data.data.authorization_url;

        }else{

            showMessage(
                "Unable to initialize payment.",
                "red"
            );

        }

    }

    catch(error){

        console.error(error);

        showMessage(
            "Something went wrong.",
            "red"
        );

    }

}
// ==============================
// INITIALIZE
// ==============================

loadGroups();

addContestant();

contestantsContainer.addEventListener("change",(e)=>{

    if(!e.target.classList.contains("photo"))
        return;

    const file = e.target.files[0];

    if(!file) return;

    const card = e.target.closest(".contestant-card");

    const preview =
    card.querySelector(".photo-preview");

    const placeholder =
    card.querySelector(".photo-placeholder");

    const reader = new FileReader();

    reader.onload = function(event){

        preview.src = event.target.result;

        preview.style.display = "block";

        placeholder.style.display = "none";

    };

    reader.readAsDataURL(file);

});
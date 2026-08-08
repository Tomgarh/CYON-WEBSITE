async function base64UrlEncode(buffer) {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}


async function signJWT(unsignedToken, privateKeyPem) {

	const pem = privateKeyPem
		.replace(/\\n/g, "")
		.replace("-----BEGIN PRIVATE KEY-----", "")
		.replace("-----END PRIVATE KEY-----", "")
		.replace(/\s/g, "");


		console.log("PRIVATE KEY START:", pem.substring(0,50));
		console.log("PRIVATE KEY LENGTH:", pem.length);
		
		const binary = Uint8Array.from(
			atob(pem),
			c => c.charCodeAt(0)
		);


	const key = await crypto.subtle.importKey(
		"pkcs8",
		binary.buffer,
		{
			name:"RSASSA-PKCS1-v1_5",
			hash:"SHA-256"
		},
		false,
		["sign"]
	);


	const signature = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		key,
		new TextEncoder().encode(unsignedToken)
	);


	return base64UrlEncode(signature);
}


async function getGoogleAccessToken(env){

	const now = Math.floor(Date.now()/1000);


	const header = {
		alg:"RS256",
		typ:"JWT"
	};


	const payload = {

		iss:env.FIREBASE_CLIENT_EMAIL,

		scope:
		"https://www.googleapis.com/auth/datastore",

		aud:
		"https://oauth2.googleapis.com/token",

		exp:now + 3600,

		iat:now
	};



	const encodedHeader =
	await base64UrlEncode(
		new TextEncoder()
		.encode(JSON.stringify(header))
	);


	const encodedPayload =
	await base64UrlEncode(
		new TextEncoder()
		.encode(JSON.stringify(payload))
	);



	const unsignedJWT =
	`${encodedHeader}.${encodedPayload}`;


	const signature =
	await signJWT(
		unsignedJWT,
		env.FIREBASE_PRIVATE_KEY
	);



	const jwt =
	`${unsignedJWT}.${signature}`;



	const response = await fetch(
		"https://oauth2.googleapis.com/token",
		{

			method:"POST",

			headers:{
				"Content-Type":
				"application/x-www-form-urlencoded"
			},


			body:new URLSearchParams({

				grant_type:
				"urn:ietf:params:oauth:grant-type:jwt-bearer",

				assertion:jwt

			})

		}
	);



	const data = await response.json();


	return data.access_token;

}




async function incrementVotes(env, contestantId, votes){


	const accessToken =
	await getGoogleAccessToken(env);



	const response = await fetch(

		`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,

		{

			method:"POST",

			headers:{

				Authorization:
				`Bearer ${accessToken}`,

				"Content-Type":
				"application/json"

			},


			body:JSON.stringify({

				writes:[{

					transform:{

						document:
						`projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/contestants/${contestantId}`,


						fieldTransforms:[{

							fieldPath:"votes",

							increment:{
								integerValue:String(votes)
							}

						}]

					}

				}]

			})

		}

	);


	return await response.json();

}




export default {

async fetch(request, env){

const corsHeaders = {

	"Access-Control-Allow-Origin":"*",

	"Access-Control-Allow-Methods":
	"GET, POST, OPTIONS",

	"Access-Control-Allow-Headers":
	"Content-Type"

};



const url = new URL(request.url);



if(request.method==="OPTIONS"){

	return new Response(null,{
		headers:corsHeaders
	});

}




// HEALTH CHECK

if(
request.method==="GET" &&
url.pathname==="/"
){

	return Response.json({

		status:"online",

		service:"CYON Voting API",

		version:"1.0.0"

	},{
		headers:corsHeaders
	});

}

// ==========================================
// AWARDS REGISTRATION
// ==========================================

if (
    request.method === "POST" &&
    url.pathname === "/awards/initialize-registration"
) {

    try {

        const body = await request.json();

		const {
			fullName,
			gender,
			dob,
			phone,
			email,
			occupation,
			address,
			bio,
			categories,
			photoUrl
		} = body;


        // ==========================================
        // BASIC VALIDATION
        // ==========================================

		if (
			!fullName ||
			!gender ||
			!dob ||
			!phone ||
			!email ||
			!occupation ||
			!address ||
			!bio ||
			!photoUrl ||
			!Array.isArray(categories) ||
			categories.length === 0
		) {

            return Response.json(
                {
                    error: "All required fields must be provided."
                },
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // VALID CATEGORIES
        // ==========================================

        const validCategories = [
            "best_executive",
            "best_group_leader",
            "most_active_male",
            "most_active_female",
            "most_social_male",
            "most_social_female",
            "male_entrepreneur",
            "female_entrepreneur"
        ];


        // Check that every submitted category is valid

        const invalidCategory = categories.some(
            category => !validCategories.includes(category)
        );


        if (invalidCategory) {

            return Response.json(
                {
                    error: "Invalid award category."
                },
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // EXECUTIVE / GROUP LEADER RULE
        // ==========================================

        if (
            categories.includes("best_executive") &&
            categories.includes("best_group_leader")
        ) {

            return Response.json(
                {
                    error:
                        "A contestant cannot register for both Best Executive Member and Best Group Leader."
                },
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // GENDER RULE
        // ==========================================

        if (gender === "male") {

            const femaleCategories = [
                "most_active_female",
                "most_social_female",
                "female_entrepreneur"
            ];

            if (
                categories.some(
                    category =>
                        femaleCategories.includes(category)
                )
            ) {

                return Response.json(
                    {
                        error:
                            "Female categories cannot be selected by a male contestant."
                    },
                    {
                        status: 400,
                        headers: corsHeaders
                    }
                );

            }

        }


        if (gender === "female") {

            const maleCategories = [
                "most_active_male",
                "most_social_male",
                "male_entrepreneur"
            ];

            if (
                categories.some(
                    category =>
                        maleCategories.includes(category)
                )
            ) {

                return Response.json(
                    {
                        error:
                            "Male categories cannot be selected by a female contestant."
                    },
                    {
                        status: 400,
                        headers: corsHeaders
                    }
                );

            }

        }


        // ==========================================
        // CALCULATE REGISTRATION FEE
        // ==========================================

        const REGISTRATION_FEE = 1000;

        const amount =
            categories.length * REGISTRATION_FEE;


        // ==========================================
        // INITIALIZE PAYSTACK
        // ==========================================

        const paystackResponse = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${env.PAYSTACK_SECRET}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    email,

                    // Paystack expects kobo
                    amount: amount * 100,

					metadata: {

						type: "cyon_awards_registration",
					
						fullName,
						gender,
						dob,
						phone,
						occupation,
						address,
						bio,
						photoUrl,
						categories,
					
						registrationFee:
							REGISTRATION_FEE,
					
						categoryCount:
							categories.length
					},

                    callback_url:
    					"https://cyon-voting-worker.tomgarh.workers.dev/awards/verify-payment"

                })

            }
        );


        const data =
            await paystackResponse.json();


        // ==========================================
        // PAYSTACK ERROR
        // ==========================================

        if (!paystackResponse.ok) {

            return Response.json(
                {
                    error:
                        data.message ||
                        "Unable to initialize payment."
                },
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // RETURN PAYSTACK RESPONSE
        // ==========================================

        return Response.json(
            data,
            {
                headers: corsHeaders
            }
        );


    } catch (error) {

        return Response.json(
            {
                error: error.message
            },
            {
                status: 500,
                headers: corsHeaders
            }
        );

    }

}

// ==========================================
// AWARDS PAYMENT VERIFICATION
// ==========================================

if (
    request.method === "GET" &&
    url.pathname === "/awards/verify-payment"
) {

    try {

        const reference = url.searchParams.get("reference");

        if (!reference) {

            return new Response(
                "Payment reference is missing.",
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // VERIFY PAYMENT WITH PAYSTACK
        // ==========================================

        const paystackResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${env.PAYSTACK_SECRET}`
                }
            }
        );


        const payment = await paystackResponse.json();


        if (
            !paystackResponse.ok ||
            !payment.status ||
            payment.data?.status !== "success"
        ) {

            return new Response(
                "Payment could not be verified.",
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // MAKE SURE THIS IS AN AWARDS REGISTRATION
        // ==========================================

        const metadata =
            payment.data?.metadata;


        if (
            !metadata ||
            metadata.type !== "cyon_awards_registration"
        ) {

            return new Response(
                "Invalid awards registration payment.",
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // VERIFY AMOUNT
        // ==========================================

        const categories =
            metadata.categories || [];

        const expectedAmount =
            categories.length * 1000 * 100;


        if (
            Number(payment.data.amount) !==
            expectedAmount
        ) {

            return new Response(
                "Payment amount does not match registration.",
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // GET GOOGLE ACCESS TOKEN
        // ==========================================

        const accessToken =
            await getGoogleAccessToken(env);


        // ==========================================
        // CREATE FIRESTORE REGISTRATION
        // ==========================================

        const registrationId =
            `award_${reference}`;


        const firestoreResponse = await fetch(
            `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/cyon_awards_registrations?documentId=${registrationId}`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    fields: {

                        fullName: {
                            stringValue:
                                metadata.fullName
                        },

                        gender: {
                            stringValue:
                                metadata.gender
                        },

                        dob: {
                            stringValue:
                                metadata.dob
                        },

                        phone: {
                            stringValue:
                                metadata.phone
                        },

                        email: {
                            stringValue:
                                payment.data.customer?.email ||
                                ""
                        },

                        occupation: {
                            stringValue:
                                metadata.occupation
                        },

                        address: {
                            stringValue:
                                metadata.address
                        },


                        bio: {
                            stringValue:
                                metadata.bio
                        },
						photoUrl: {
							stringValue:
								metadata.photoUrl
						},

                        categories: {
                            arrayValue: {
                                values:
                                    categories.map(category => ({
                                        stringValue: category
                                    }))
                            }
                        },

                        paymentReference: {
                            stringValue:
                                reference
                        },

                        paymentStatus: {
                            stringValue:
                                "paid"
                        },

                        votes: {
                            integerValue:
                                "0"
                        },

                        createdAt: {
                            timestampValue:
                                new Date().toISOString()
                        }

                    }

                })

            }
        );


        const registration =
            await firestoreResponse.json();


        if (!firestoreResponse.ok) {

            console.error(
                "Firestore error:",
                registration
            );

            return new Response(
                "Payment verified, but registration could not be saved.",
                {
                    status: 500,
                    headers: corsHeaders
                }
            );

        }


        // ==========================================
        // SEND USER BACK TO WEBSITE
        // ==========================================

        return Response.redirect(
            `https://tomgarh.github.io/CYON-WEBSITE/awards-success.html?reference=${encodeURIComponent(reference)}`,
            302
        );


    } catch (error) {

        console.error(
            "Awards verification error:",
            error
        );

        return new Response(
            "Something went wrong while verifying payment.",
            {
                status: 500,
                headers: corsHeaders
            }
        );

    }

}

// ======================================
// INITIALIZE REGISTRATION PAYMENT
// ======================================

if (
    request.method === "POST" &&
    url.pathname === "/initialize-registration"
) {

    try {

        const body = await request.json();

        const {
            group,
            contestants
        } = body;

        if (
            !group ||
            !contestants ||
            contestants.length === 0
        ) {

            return Response.json({

                error:
                "Invalid registration."

            },{

                status:400,
                headers:corsHeaders

            });

        }

        // Always calculate on the server
        const payableContestants =
            Math.max(contestants.length, 2);

        const totalAmount =
            payableContestants * 2500;

        const email =
            contestants[0].email;

        const paystackResponse =
        await fetch(

            "https://api.paystack.co/transaction/initialize",

            {

                method:"POST",

                headers:{

                    Authorization:
                    `Bearer ${env.PAYSTACK_SECRET}`,

                    "Content-Type":
                    "application/json"

                },

                body:JSON.stringify({

                    email,

                    amount:
                    totalAmount * 100,

                    metadata:{

                        source:
                        "CYON Pageant Registration",

                        group,

                        contestants

                    },

                    callback_url:

"https://cyon-voting-worker.tomgarh.workers.dev/verify-registration"

                })

            }

        );

        const data =
        await paystackResponse.json();

        return Response.json(
            data,
            {
                headers:corsHeaders
            }
        );

    }

    catch(error){

        return Response.json({

            error:error.message

        },{

            status:500,
            headers:corsHeaders

        });

    }

}



// INITIALIZE PAYMENT


if(
request.method==="POST" &&
url.pathname==="/initialize-payment"
){


try{


const body =
await request.json();



const {
	contestantId,
	votes,
	email,
	phone
}=body;



const voteCount =
Number(votes);



if(
!contestantId ||
!voteCount ||
!email
){

return Response.json({

	error:
	"contestantId, votes and email are required"

},{
status:400,
headers:corsHeaders
});

}




const amount =
voteCount * 100 * 100;



const paystackResponse =
await fetch(

"https://api.paystack.co/transaction/initialize",

{

method:"POST",

headers:{

Authorization:
`Bearer ${env.PAYSTACK_SECRET}`,

"Content-Type":
"application/json"

},


body:JSON.stringify({

email,

amount,


metadata:{

contestantId,

votes:voteCount,

phone,

source:
"CYON Voting 2026"

},


callback_url:

"https://cyon-voting-worker.tomgarh.workers.dev/verify-payment"

})

}

);



const data =
await paystackResponse.json();



return Response.json(data,{
headers:corsHeaders
});



}

catch(error){

return Response.json({

error:error.message

},{
status:500,
headers:corsHeaders
});


}


}





// VERIFY PAYMENT


if(
request.method==="GET" &&
url.pathname==="/verify-payment"
){


try{


const reference =
url.searchParams.get("reference");



if(!reference){

return new Response(
"Missing reference",
{
status:400
}
);

}


// CHECK IF ALREADY PROCESSED


const accessToken =
await getGoogleAccessToken(env);



const existing =
await fetch(

`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${reference}`,

{

headers:{

Authorization:
`Bearer ${accessToken}`

}

}

);



if(existing.ok){

return Response.redirect(

"https://tomgarh.github.io/CYON-WEBSITE/payment-success.html",

302

);

}




// VERIFY WITH PAYSTACK


const verify =
await fetch(

`https://api.paystack.co/transaction/verify/${reference}`,

{

headers:{

Authorization:
`Bearer ${env.PAYSTACK_SECRET}`

}

}

);



const payment =
await verify.json();




if(
payment.data.status!=="success"
){

return Response.redirect(

"https://tomgarh.github.io/CYON-WEBSITE/payment-failed.html",

302

);

}




const metadata =
payment.data.metadata;

// Verify payment amount matches requested votes

const expectedAmount =
Number(metadata.votes) * 100 * 100;


if (payment.data.amount !== expectedAmount) {

	return Response.redirect(
		"https://tomgarh.github.io/CYON-WEBSITE/payment-failed.html",
		302
	);

}



await incrementVotes(

env,

metadata.contestantId,

Number(metadata.votes)

);





// SAVE PAYMENT


await fetch(

`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${reference}`,

{

method:"PATCH",

headers:{

Authorization:
`Bearer ${accessToken}`,

"Content-Type":
"application/json"

},


body:JSON.stringify({

fields:{

status:{

stringValue:"success"

},

contestantId:{

stringValue:
metadata.contestantId

},


votes:{

integerValue:
String(metadata.votes)

}

}

})

}

);





return Response.redirect(

"https://tomgarh.github.io/CYON-WEBSITE/payment-success.html",

302

);



}

catch(error){

return new Response(

error.message,

{

status:500,

headers:corsHeaders

}

);

}


}

// ======================================
// VERIFY REGISTRATION
// ======================================

if (
	request.method === "GET" &&
	url.pathname === "/verify-registration"
) {

	try {

		const reference =
			url.searchParams.get("reference");

		if (!reference) {

			return Response.redirect(
				"https://tomgarh.github.io/CYON-WEBSITE/registration-failed.html",
				302
			);

		}

		const accessToken =
			await getGoogleAccessToken(env);

		// Prevent duplicate processing

		const existing = await fetch(

			`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${reference}`,

			{

				headers: {

					Authorization:
						`Bearer ${accessToken}`

				}

			}

		);

		if (existing.ok) {

			return Response.redirect(

				"https://tomgarh.github.io/CYON-WEBSITE/registration-success.html",

				302

			);

		}

		// Verify with Paystack

		const verify = await fetch(

			`https://api.paystack.co/transaction/verify/${reference}`,

			{

				headers: {

					Authorization:
						`Bearer ${env.PAYSTACK_SECRET}`

				}

			}

		);

		const payment =
			await verify.json();

		if (
			!payment.status ||
			payment.data.status !== "success"
		) {

			return Response.redirect(

				"https://tomgarh.github.io/CYON-WEBSITE/registration-failed.html",

				302

			);

		}

		const metadata =
			payment.data.metadata;

		const contestants =
			metadata.contestants;

		const group =
			metadata.group;

		// Verify server-side amount

		const expectedAmount =
			Math.max(contestants.length, 2) *
			2500 *
			100;

		if (
			payment.data.amount !== expectedAmount
		) {

			return Response.redirect(

				"https://tomgarh.github.io/CYON-WEBSITE/registration-failed.html",

				302

			);

		}

		// Create contestants

		for (const contestant of contestants) {

			if (
				await emailExists(
					env,
					accessToken,
					contestant.email
				)
			) {
				continue;
			}

			if (
				await phoneExists(
					env,
					accessToken,
					contestant.phone
				)
			) {
				continue;
			}

			const id =
				generateFirestoreId();

			await fetch(

				`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/contestants/${id}`,

				{

					method: "PATCH",

					headers: {

						Authorization:
							`Bearer ${accessToken}`,

						"Content-Type":
							"application/json"

					},

					body: JSON.stringify({

						fields: {

							name: {
								stringValue:
									contestant.name
							},

							email: {
								stringValue:
									contestant.email
							},

							phone: {
								stringValue:
									contestant.phone
							},

							gender: {
								stringValue:
									contestant.gender
							},

							group: {
								stringValue:
									group
							},

							photoURL: {
								stringValue:
									contestant.photoURL
							},

							votes: {
								integerValue: "0"
							},

							registeredAt: {
								timestampValue:
									new Date().toISOString()
							}

						}

					})

				}

			);

		}

		// Save processed payment

		await fetch(

			`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${reference}`,

			{

				method: "PATCH",

				headers: {

					Authorization:
						`Bearer ${accessToken}`,

					"Content-Type":
						"application/json"

				},

				body: JSON.stringify({

					fields: {

						status: {
							stringValue: "success"
						},

						type: {
							stringValue: "registration"
						},

						group: {
							stringValue: group
						},

						contestantCount: {
							integerValue:
								String(contestants.length)
						},

						processedAt: {
							timestampValue:
								new Date().toISOString()
						}

					}

				})

			}

		);

		return Response.redirect(

			"https://tomgarh.github.io/CYON-WEBSITE/registration-success.html",

			302

		);

	}

	catch (error) {

		console.error(error);

		return Response.redirect(

			"https://tomgarh.github.io/CYON-WEBSITE/registration-failed.html",

			302

		);

	}

}



return new Response(

"Not Found",

{

status:404,

headers:corsHeaders

}

);



}

};
function generateFirestoreId() {

	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	let id = "";

	for (let i = 0; i < 20; i++) {

		id += chars.charAt(
			Math.floor(Math.random() * chars.length)
		);

	}

	return id;

}

async function emailExists(env, accessToken, email) {

	const response = await fetch(

		`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,

		{

			method: "POST",

			headers: {

				Authorization: `Bearer ${accessToken}`,

				"Content-Type": "application/json"

			},

			body: JSON.stringify({

				structuredQuery: {

					from: [

						{
							collectionId: "contestants"
						}

					],

					where: {

						fieldFilter: {

							field: {
								fieldPath: "email"
							},

							op: "EQUAL",

							value: {
								stringValue: email
							}

						}

					},

					limit: 1

				}

			})

		}

	);

	const result = await response.json();

	return result.some(item => item.document);

}

async function phoneExists(env, accessToken, phone) {

	const response = await fetch(

		`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,

		{

			method: "POST",

			headers: {

				Authorization: `Bearer ${accessToken}`,

				"Content-Type": "application/json"

			},

			body: JSON.stringify({

				structuredQuery: {

					from: [

						{
							collectionId: "contestants"
						}

					],

					where: {

						fieldFilter: {

							field: {
								fieldPath: "phone"
							},

							op: "EQUAL",

							value: {
								stringValue: phone
							}

						}

					},

					limit: 1

				}

			})

		}

	);

	const result = await response.json();

	return result.some(item => item.document);

}


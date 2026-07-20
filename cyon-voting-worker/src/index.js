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




return new Response(

"Not Found",

{

status:404,

headers:corsHeaders

}

);



}

};
export default {
	async fetch(request, env) {

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		const url = new URL(request.url);

		// ============================
		// Handle CORS Preflight
		// ============================

		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: corsHeaders,
			});
		}

		// ============================
		// Health Check
		// ============================

		if (request.method === "GET" && url.pathname === "/") {

			return Response.json(
				{
					status: "online",
					service: "CYON Voting API",
					version: "1.0.0",
				},
				{
					headers: corsHeaders,
				}
			);

		}

		// ============================
		// Firestore Test
		// ============================

		if (request.method === "GET" && url.pathname === "/test-firestore") {

			const response = await fetch(
				"https://firestore.googleapis.com/v1/projects/cyon-stbernard/databases/(default)/documents/contestants",
				{
					headers: {
						"X-Goog-Api-Key":
							"AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
					},
				}
			);

			const data = await response.json();

			return Response.json(data, {
				headers: corsHeaders,
			});

		}

		// ============================
		// Initialize Paystack Payment
		// ============================

		if (
			request.method === "POST" &&
			url.pathname === "/initialize-payment"
		) {

			try {

				const body = await request.json();

				const {
					contestantId,
					votes,
					email,
					phone
				} = body;

				if (!contestantId || !votes || !email) {

					return Response.json(
						{
							error: "contestantId, votes and email are required"
						},
						{
							status: 400,
							headers: corsHeaders,
						}
					);

				}

				// ₦100 per vote
				const amount = votes * 100 * 100;

				const paystackResponse = await fetch(
					"https://api.paystack.co/transaction/initialize",
					{
						method: "POST",

						headers: {
							Authorization: `Bearer ${env.PAYSTACK_SECRET}`,
							"Content-Type": "application/json",
						},

						body: JSON.stringify({

							email,

							amount,

							metadata: {

								contestantId,

								votes,

								phone

							},

							callback_url:
								"https://tomgarh.github.io/CYON-WEBSITE/pageantry.html"

						})

					}
				);

				const data = await paystackResponse.json();

				return Response.json(data, {
					headers: corsHeaders,
				});

			}
			catch (error) {

				return Response.json(
					{
						error: error.message,
					},
					{
						status: 500,
						headers: corsHeaders,
					}
				);

			}

		}

		// ============================
		// 404
		// ============================

		return new Response("Not Found", {
			status: 404,
			headers: corsHeaders,
		});

	},
};
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import axios from 'axios';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;
		console.log(env);

		// Handle different routes
		switch (path) {
			case '/':
				return new Response('Hello World!', {
					headers: { 'Content-Type': 'text/plain' },
				});

			case '/alerts/bus':
				const busOptions = {
					method: 'GET',
					url: 'https://api.goswift.ly/rider-alerts/v2',
					params: { agency: 'lametro' },
					headers: {
						Accept: 'application/json, application/json; charset=utf-8, text/csv; charset=utf-8',
						Authorization: env.API_KEY,
					},
				};
				try {
					const { data } = await axios.request(busOptions);
					console.log(data);

					const alertResponse = new Response(JSON.stringify(data), {
						status: 200,
						headers: {
							'Access-Control-Allow-Origin': '*', // Required for CORS support to work
							'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
							'Access-Control-Allow-Headers': 'Content-Type',
						},
					});

					return alertResponse;
				} catch (error) {
					console.error(error);
					return new Response(JSON.stringify(error), {
						statusCode: 400,
					});
				}

			case '/alerts/rail':
				const railOptions = {
					method: 'GET',
					url: 'https://api.goswift.ly/rider-alerts/v2',
					params: { agency: 'lametro-rail' },
					headers: {
						Accept: 'application/json, application/json; charset=utf-8, text/csv; charset=utf-8',
						Authorization: env.API_KEY,
					},
				};
				try {
					const { data } = await axios.request(railOptions);
					console.log(data);

					const alertResponse = new Response(JSON.stringify(data), {
						status: 200,
						headers: {
							'Access-Control-Allow-Origin': '*', // Required for CORS support to work
							'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
							'Access-Control-Allow-Headers': 'Content-Type',
						},
					});

					return alertResponse;
				} catch (error) {
					console.error(error);
					return new Response(JSON.stringify(error), {
						statusCode: 400,
					});
				}

			default:
				return new Response('Not Found', {
					status: 404,
					headers: { 'Content-Type': 'text/plain' },
				});
		}
	},
};

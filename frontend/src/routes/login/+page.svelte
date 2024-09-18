<script>
	// @ts-nocheck
	import axios from 'axios';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { alertError, alertSuccess } from '../../stores/errorHandle';

	let username = '';
	let password = '';

	async function handleLogout() {
		try {
			// Ensure cookies are sent with the request
			await axios.post('http://localhost:5000/api/users/logout', {}, { withCredentials: true });
			alertSuccess('Logged out successfully.');
		} catch (error) {
			if (error.response && error.response.status === 401) {
				// Handle the case where the user is already logged out (no token)
				console.log('User already logged out.');
			} else {
				// For other errors, display the error and notify the user
				console.error('Error logging out:', error);
				alertError('Server Error. Please try again.');
			}
		}
	}

	onMount(() => {
		handleLogout();
	});

	async function handleSubmit() {
		if (!username || !password) {
			alertError('Invalid Credentials');
			return;
		}

		// Log the request payload
		console.log('Request payload:', { username, password });

		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/login',
				{ username, password },
				{ withCredentials: true } // Send cookies with the request
			);

			// Clear fields
			username = '';
			password = '';

			// Log the token for debugging purposes
			console.log('Login successful.');

			// Show success message
			alertSuccess('Login successful! Redirecting to homepage...');

			// Redirect to homepage
			goto('/homepage/applications');
		} catch (error) {
			if (error.response) {
				if (error.response.status === 401) {
					alertError('Invalid Credentials');
					goto('/login');
				}
				if (error.response.status === 403) {
					alertError('Access Denied');
					goto('/login');
				}
			} else if (error.request) {
				alertError('No response received from the server.');
			}
		}
	}
</script>

<body>
	<div class="container">
		<div class="login-container">
			<h2>Login</h2>
			<div class="form-group">
				<input id="username" type="text" bind:value={username} placeholder="Username" />
			</div>
			<div class="form-group">
				<input id="password" type="password" bind:value={password} placeholder="Password" />
			</div>
			<button on:click={handleSubmit}>Login</button>
		</div>
	</div>
</body>

<style>
	body {
		margin: 0;
	}

	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background-color: #f5f5f5;
	}

	.login-container {
		max-width: 300px;
		width: 100%;
		padding: 1em;
		border-radius: 4px;
		justify-content: center;
	}
	.login-container h2 {
		text-align: center;
		margin-bottom: 1em;
	}

	.form-group {
		margin-bottom: 1em;
	}

	input {
		width: 100%;
		padding: 0.5em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #c9c9c9;
	}

	button {
		width: 105%;
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: #000;
		color: white;
		font-size: 1em;
		cursor: pointer;
	}

	button:hover {
		background-color: #333;
	}
</style>

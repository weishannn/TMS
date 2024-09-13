<script>
	// @ts-nocheck
	import axios from 'axios';
	import { goto } from '$app/navigation';
	import { Toaster, toast } from 'svelte-sonner';

	let username = '';
	let password = '';

	async function handleSubmit() {
		if (!username || !password) {
			toast.error('Invalid Username or Password');
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
			toast.success('Login successful! Redirecting to homepage...');

			// Redirect to homepage
			goto('/homepage');
		} catch (error) {
			if (error.response) {
				if (error.response.status === 401 || error.response.status === 403) {
					toast.error('Invalid Username or Password');
					goto('/login');
				} else {
					toast.error(`An error occurred: ${error.response.status}`);
				}
			} else if (error.request) {
				toast.error('No response received from the server.');
			} else {
				toast.error(`Error in setting up the request: ${error.message}`);
			}
			console.error('Error details:', error);
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
	<Toaster />
	<!-- Add the Toaster component here -->
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

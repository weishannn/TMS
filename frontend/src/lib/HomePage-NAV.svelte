<script>
	// @ts-nocheck
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { refreshUserList } from '../stores/updateStore';
	import { alertError, alertSuccess } from '../stores/errorHandle';
	import { Toaster } from 'svelte-sonner';

	export let username = '';
	//export let usergroup = ''; // Default to an empty string
	let usergrouplist = { users: [] };
	export let currentemail = '';

	let showProfileModal = false;
	let email = '';
	let password = '';

	let isAdmin = false;
	export let inTMS = false;
	export let appAcronym = '';

	const redirectToLogin = () => {
		goto('/login');
	};

	const fetchCurrentUser = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/currentUser', {
				withCredentials: true // Ensure cookies are sent with the request
			});
			username = response.data.username;
			currentemail = response.data.email;

			await checkIfAdmin();
		} catch (error) {
			if ((error.response && error.response.status === 404) || error.response.status === 401) {
				alertError('User not logged in.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				console.error('Error fetching current user:', error);
				alertError('Server Error. Please try again.');
				redirectToLogin();
			}
		}
	};

	const checkIfAdmin = async () => {
		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/checkAdmin',
				{ username },
				{
					withCredentials: true // Ensure cookies are sent with the request
				}
			);

			isAdmin = response.data.isAdmin; // Set based on the backend response
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				//console.log('User not admin');
				isAdmin = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking if user is an admin:', error);
			}
		}
	};

	const handleRedirection = () => {
		if (isAdmin && window.location.pathname === '/homepage/admin') {
			return; // Allow admin to visit the admin page
		}
	};

	onMount(async () => {
		// Fetch current user data and check admin status
		await fetchCurrentUser();
		handleRedirection(); // Continue with redirection for both admin and non-admin
	});

	// Password validation function
	function validatePassword(password) {
		const lengthValid = password.length >= 8 && password.length <= 10;
		const hasAlphabet = /[A-Za-z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		if (!lengthValid) {
			alertError('Password must be between 8 and 10 characters long.');
			return false;
		}
		if (!hasAlphabet || !hasNumber || !hasSpecialChar) {
			alertError(
				'Password must contain at least one alphabet, one number, and one special character.'
			);
			return false;
		}

		return true;
	}

	function validateEmail(email) {
		// Regular expression for validating an email address
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return emailPattern.test(email);
	}

	async function handleSave() {
		// Validate email or password presence
		if (!email && !password) {
			alertError('Email or Password is required');
			return;
		}

		if (email && !validateEmail(email)) {
			alertError('Invalid email address');
			return;
		}

		// Validate password only if it's being updated
		if (password && !validatePassword(password)) {
			return;
		}

		try {
			const response = await axios.put(
				'http://localhost:5000/api/users/updateProfile',
				{ username, email, password },
				{
					withCredentials: true // Ensure cookies are sent with the request
				}
			);

			// On successful update
			alertSuccess(response.data.message);
			email = '';
			password = '';

			// Fetch the updated user profile
			await fetchCurrentUser();
		} catch (error) {
			if (error.response) {
				// Server responded with a status other than 2xx
				alertError(`An error occurred: ${error.response.status}`);
				redirectToLogin();
			} else if (error.request) {
				// The request was made but no response was received
				alertError('No response received from the server.');
			} else {
				// Something happened in setting up the request
				alertError(`Error in setting up the request: ${error.message}`);
			}
			console.error('Error details:', error);
		}
	}

	function handleCancel() {
		email = '';
		password = '';
		showProfileModal = false;

		if (isAdmin) {
			refreshUserList.set(true); // Trigger the refresh
		}
	}

	function handleUMS() {
		// Redirect to UMS page
		goto('/homepage/admin');
	}

	function handleTMS() {
		// Redirect to TMS page
		goto('/homepage/applications');
	}

	function handleUpdate() {
		showProfileModal = true; // Open profile modal
	}

	async function handleLogout() {
		try {
			// Ensure cookies are sent with the request
			await axios.post('http://localhost:5000/api/users/logout', {}, { withCredentials: true });
			alertSuccess('Logged out successfully.');
			redirectToLogin();
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
</script>

<body>
	<div class="container">
		<header class="header">
			{#if inTMS}
				<h4>Application: {appAcronym}</h4>
			{:else}
				<h4>Hello, {username}</h4>
			{/if}

			<div>
				<button class="header-h5" on:click={handleTMS}>Application</button>

				{#if isAdmin}
					<button class="header-h5" on:click={handleUMS}>User Management</button>
				{/if}
			</div>
			<div>
				<button class="white-button" on:click={handleUpdate}>Edit Profile</button>
				<button class="white-button" on:click={handleLogout}>Log Out</button>
			</div>
		</header>

		<main></main>

		{#if showProfileModal}
			<Toaster richColors style="z-index: 12;" />
			<div class="modal">
				<div class="modal-content">
					<h2>Profile</h2>
					<div class="form-group">
						<label for="username">Username:</label>
						<h7>{username}</h7>
					</div>
					<div class="form-group">
						<label for="username">Current Email:</label>
						<h7>{currentemail}</h7>
					</div>
					<div class="form-group">
						<label for="email">Email:</label>
						<input id="email" type="email" bind:value={email} placeholder="Email" />
					</div>
					<div class="form-group">
						<label for="password">Password:</label>
						<input id="password" type="password" bind:value={password} placeholder="Password" />
					</div>
					<div class="modal-actions">
						<button on:click={handleSave}>Save Changes</button>
						<button on:click={handleCancel}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</body>

<style>
	body {
		margin: 0px;
	}

	.container {
		display: flex;
		flex-direction: column;
	}

	.header {
		background-color: #000; /* Black background */
		color: #fff; /* White text color */
		height: 60px; /* Header height */
		display: flex;
		flex-shrink: 0; /* Prevent the header from shrinking */
		align-items: center; /* Center align items vertically */
		justify-content: space-between; /* Space out items horizontally */
		padding: 0 1em; /* Optional padding */
	}

	.header h4 {
		margin: 0; /* Remove default margin */
		font-size: 1.5em; /* Adjust font size if needed */
		margin-left: 50px;
	}

	button {
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: black; /* Set button color to white */
		color: white;
		font-size: 1em;
		cursor: pointer;
		margin-right: 150px;
	}

	.white-button {
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: white; /* Set button color to white */
		color: black;
		font-size: 1em;
		cursor: pointer;
		margin-right: 50px;
	}

	.white-button:hover {
		background-color: #c2c2c2; /* Darker shade on hover */
	}

	button:hover {
		background-color: #333; /* Change to a lighter shade on hover */
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000; /* Ensure modal is on top */
	}

	.modal-content {
		background-color: #fff;
		padding: 2em;
		border-radius: 8px;
		width: 400px;
		max-width: 90%;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.modal-content h2 {
		margin-top: 0;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1em;
		text-align: left;
		display: flex; /* Use flexbox */
		align-items: center; /* Align items vertically */
		justify-content: space-between; /* Space out items horizontally */
	}
	.form-group h7 {
		flex: 1;
	}

	.form-group label {
		display: block;
		margin-right: 2em; /* Space between label and input */
		flex: 0 0 25%; /* Adjust label width */
		white-space: nowrap; /* Prevent label text from wrapping */
	}

	.form-group input {
		width: 100%;
		padding: 0.5em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #c9c9c9;
		flex: 1; /* Input takes remaining space */
	}

	.modal-actions {
		margin-top: 1em;
		text-align: center;
	}

	.modal-actions button {
		margin: 0 0.5em;
	}

	.header-h5 {
		margin: 0; /* Remove default margin */
		font-size: 1em; /* Adjust font size if needed */
		margin-left: 50px;
	}

	.header-h5:hover {
		text-decoration: underline;
	}
</style>

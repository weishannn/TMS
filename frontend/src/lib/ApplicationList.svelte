<script>
	// @ts-nocheck
	import FaEdit from 'svelte-icons/fa/FaEdit.svelte';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { alertError, alertSuccess } from '../stores/errorHandle';

	let applications = [];

	const fetchapplications = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/getApps', {
				//withCredentials: true // Ensure cookies are sent with the request
			});
			applications = response.data;
			console.log(applications);
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Unable to fetch users. Please try again.');
			}
			console.error('Error fetching users:', error);
		}
	};

	function formatDate(dateString) {
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, '0'); // Adds leading zero if needed
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so +1
		const year = date.getFullYear();
		return `${day}/${month}/${year}`; // Returns in DD/MM/YYYY format
	}

	onMount(async () => {
		await fetchapplications();
	});
</script>

<div class="applications">
	{#each applications as app}
		<div class="app-card">
			<h3>App Name: <span>{app.App_Acronym}</span></h3>
			<p>
				<strong>App Description:</strong>
				{app.App_Description}
			</p>
			<p><strong>Start Date:</strong> {formatDate(app.App_startDate)}</p>
			<p><strong>End Date:</strong> {formatDate(app.App_endDate)}</p>
			<button class="edit-btn"><FaEdit /></button>
		</div>
	{/each}
</div>

<style>
	.applications {
		display: flex;
		gap: 20px;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		padding: 20px;
	}

	.app-card {
		background-color: #f2f2f2; /* Light grey background */
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
		width: 45%; /* Adjust width */
		display: flex;
		flex-direction: column;
		position: relative;
	}

	h3 {
		font-size: 1.2rem;
		margin-bottom: 10px;
	}

	p {
		margin: 5px 0;
	}

	.edit-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2rem;
		width: 40px;
	}

	.edit-btn:hover {
		color: #007bff; /* Change color on hover */
	}
</style>

<script>
	//@ts-nocheck
	import axios from 'axios';
	import { alertError, alertSuccess } from '../../src/stores/errorHandle';
	import HomePageNav from '$lib/HomePage-NAV.svelte';
	import TaskList from '$lib/TaskList.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let selectedAppDetails;
	export let inTMS;
	export let username;

	let appAcronym = selectedAppDetails.App_Acronym;

	console.log('selectedApp in tms', selectedAppDetails);
	console.log('inTMS', inTMS);
	console.log('appAcronym', appAcronym);

	// Redirect to login page
	const redirectToLogin = () => {
		goto('/login');
	};

	function handleCreatePlan() {
		showCreateModal = true;
	}

	async function handleSubmitPlan() {
		if (!planName || !planappAcronym || !planStartDate || !planEndDate || !planColor) {
			alertError('Please fill in all fields.');
			return;
		}

		// convert date to epoch
		const planStartDateEpoch = Math.floor(new Date(planStartDate).getTime() / 1000);
		const planEndDateEpoch = Math.floor(new Date(planEndDate).getTime() / 1000);

		console.log(planName, planappAcronym, planStartDateEpoch, planEndDateEpoch, planColor);

		try {
			const response = await axios.post('http://localhost:5000/api/users/createPlan', {
				planName,
				planappAcronym,
				planStartDate: planStartDateEpoch,
				planEndDate: planEndDateEpoch,
				planColor
			});
			if (response.status === 200) {
				alertSuccess('Plan created successfully!');
				handleClosePlan();
			}
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 409) {
				alertError('Plan already exists. Please choose a different name.');
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.error('Error creating plan:', error);
		}
	}

	function handleClosePlan() {
		showCreateModal = false;
		planName = '';
		planStartDate = '';
		planEndDate = '';
		planColor = '';
	}

	let showCreateModal = false;
	let planappAcronym = appAcronym;
	let planName = '';
	let planStartDate = '';
	let planEndDate = '';
	let planColor = '';
</script>

<body style="margin:0;padding:0">
	<HomePageNav {inTMS} {appAcronym} />

	{#if inTMS}
		<div class="container">
			<div class="content">
				<h1>Task Management Board</h1>
				<button on:click={handleCreatePlan}>+ CREATE PLAN</button>
			</div>
		</div>
	{:else}
		<p>No application details found or loading...</p>
	{/if}

	{#if showCreateModal}
		<div class="modal">
			<div class="modal-content">
				<h2>Create Plan</h2>
				<div class="form-group">
					<label for="planappAcronym">App Acronym:</label>
					<h7 id="planappAcronym">{appAcronym}</h7>
				</div>
				<div class="form-group">
					<label for="planName">Plan Name:</label>
					<input id="planName" type="text" bind:value={planName} placeholder="Name" />
				</div>
				<div class="form-group">
					<label for="planStartDate">Start Date:</label>
					<input id="planStartDate" type="date" bind:value={planStartDate} placeholder="DD/MM/YY" />
				</div>
				<div class="form-group">
					<label for="planEndDate">End Date:</label>
					<input id="planEndDate" type="date" bind:value={planEndDate} placeholder="DD/MM/YY" />
				</div>
				<div class="form-group">
					<label for="planColor">Color:</label>
					<input class="color" type="color" bind:value={planColor} />
				</div>

				<div class="modal-actions">
					<button on:click={handleSubmitPlan}>Create Plan</button>
					<button on:click={handleClosePlan}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	<TaskList {selectedAppDetails} {username} />
</body>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 15vh;
	}

	button {
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: black;
		color: white;
		font-size: 1em;
		cursor: pointer;
		margin-right: 150px;
	}

	button:hover {
		background-color: #333;
	}

	.content {
		padding: 0.5em 1em;
		color: #000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 50px;
		margin-top: 20px;
	}

	.content h1 {
		padding: 1em;
		margin-left: 50px;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: #fff;
		padding: 2em;
		border-radius: 8px;
		width: 500px;
		max-width: 100%;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.modal-content h2 {
		margin-top: 0;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1em;
		display: flex;
		align-items: center;
	}

	.form-group label {
		margin-right: 1em;
		flex: 1;
		white-space: nowrap;
	}

	.form-group h7 {
		flex: 2;
		font-weight: bold;
	}

	.color {
		width: 100%;
		height: 50px;
		background-color: #fff;
	}

	.form-group input {
		width: 100%;
		padding: 0.5em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #c9c9c9;
		flex: 2;
	}

	.modal-actions {
		margin-top: 1em;
		text-align: center;
	}

	.modal-actions button {
		margin: 0 0.5em;
	}
</style>

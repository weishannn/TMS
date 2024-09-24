<script>
	//@ts-nocheck
	import axios from 'axios';
	import { alertError, alertSuccess } from '../../../../stores/errorHandle';
	import HomePageNav from '$lib/HomePage-NAV.svelte';
	import TaskList from '$lib/TaskList.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data;
	const { appAcronym } = data;

	let appDetails;
	let inTMS = false;
	let name = '';

	// Redirect to login page
	const redirectToLogin = () => {
		goto('/login');
	};

	console.log('AppAcronym prop:', appAcronym); // Log to check the received appAcronym

	const fetchspecificapplications = async () => {
		console.log('appAcronym', appAcronym); // Log the appAcronym being fetched

		try {
			const response = await axios.get(`http://localhost:5000/api/users/${appAcronym}`, {
				// withCredentials: true
			});

			const appDetailsArray = response.data; // Store the fetched application data

			// Check if the array is not empty and access the first item
			if (appDetailsArray.length > 0) {
				const appDetails = appDetailsArray[0]; // Get the first object in the array
				console.log('Application details:', appDetails.App_Acronym); // Access App_Acronym from the first object
				inTMS = true;
				name = appDetails.App_Acronym;
			} else {
				console.error('No application found in the response:', appDetailsArray);
			}
		} catch (error) {
			if (error.response) {
				// Check for specific error responses
				if (error.response.status === 404) {
					alertError('Application not found.');
				} else if (error.response.status === 401) {
					alertError('Unauthorized access.');
					goto('/login'); // Redirect to login if unauthorized
				} else if (error.response.status === 500) {
					alertError('Server Error. Unable to fetch applications. Please try again.');
				}
			} else {
				// Handle errors that are not related to the response
				alertError('An unexpected error occurred. Please try again.');
			}
			console.error('Error fetching applications:', error);
		}
	};

	onMount(() => {
		fetchspecificapplications();
	});

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
	}

	let showCreateModal = false;
	let planappAcronym = appAcronym;
	let planName = '';
	let planStartDate = '';
	let planEndDate = '';
	let planColor = '#000000';
</script>

<body style="margin:0;padding:0">
	<HomePageNav {inTMS} {name} />

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
				<!-- app permit done -->
				<div class="form-group">
					<label for="planColor">Color:</label>
					<div class="form-group-permit">
						<select id="planColor" bind:value={planColor}>
							<option value="">Color</option>
							<!-- {#each availableGroups as group} -->
							<!-- <option value={group.user_group}>{group.user_group}</option>
							{/each} -->
						</select>
					</div>
				</div>

				<div class="modal-actions">
					<button on:click={handleSubmitPlan}>Create Plan</button>
					<button on:click={handleClosePlan}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	<TaskList />
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

	.form-group-permit {
		flex: 2;
	}

	.form-group-permit select,
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

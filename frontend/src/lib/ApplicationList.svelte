<script>
	// @ts-nocheck
	import FaEdit from 'svelte-icons/fa/FaEdit.svelte';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { alertError, alertSuccess } from '../stores/errorHandle';
	import { createEventDispatcher } from 'svelte';

	export let applications = [];
	export let availableGroups = [];
	export let fetchapplications;
	let showEditModal = false;
	let appAcronym = '';
	let appRNumber = '';
	let appDescription = '';
	let appStartDate = '';
	let appEndDate = '';
	let appPermitCreate = '';
	let appPermitOpen = '';
	let appPermitToDo = '';
	let appPermitDoing = '';
	let appPermitDone = '';

	const editApp = async () => {
		if (!appAcronym || !appRNumber || !appStartDate || !appEndDate) {
			alertError(
				'Please fill in all required fields. (App Acronym, R Number, Start Date, End Date)'
			);
			return;
		}

		// convert date to epoch
		const epochStartDate = Math.floor(new Date(appStartDate).getTime() / 1000);
		const epochEndDate = Math.floor(new Date(appEndDate).getTime() / 1000);

		try {
			const response = await axios.put('http://localhost:5000/api/users/editApp', {
				appAcronym,
				appDescription,
				appRNumber,
				appStartDate: epochStartDate,
				appEndDate: epochEndDate,
				appPermitCreate,
				appPermitOpen,
				appPermitToDo,
				appPermitDoing,
				appPermitDone
			});

			if (response.status === 200) {
				alertSuccess('Application created successfully!');
				handleCloseApp(); // Close modal and reset form on success
				// Fetch updated applications
				fetchapplications();
			} else {
				alertError('Error creating application. Please try again.');
			}
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.error('Error creating application:', error);
		}
	};

	const handleEditApp = (
		acronym,
		rnumber,
		description,
		startDate,
		endDate,
		permitCreate,
		permitOpen,
		permitToDo,
		permitDoing,
		permitDone,
		event
	) => {
		event.stopPropagation(); // Prevents the card click (which triggers navigation) from firing

		// Set the state of the form for editing
		showEditModal = true;
		appAcronym = acronym;
		appRNumber = rnumber;
		appDescription = description;

		// Convert DD/MM/YYYY to YYYY-MM-DD
		const formatDate = (dateString) => {
			const [day, month, year] = dateString.split('/');
			return `${year}-${month}-${day}`;
		};

		appStartDate = formatDate(startDate);
		appEndDate = formatDate(endDate);

		appPermitCreate = permitCreate;
		appPermitOpen = permitOpen;
		appPermitToDo = permitToDo;
		appPermitDoing = permitDoing;
		appPermitDone = permitDone;
	};

	const handleCloseApp = () => {
		showEditModal = false;
		// appAcronym = '';
		// appRNumber = '';
		appDescription = '';
		appStartDate = '';
		appEndDate = '';
		appPermitCreate = '';
		appPermitOpen = '';
		appPermitToDo = '';
		appPermitDoing = '';
		appPermitDone = '';
	};

	function handleSubmitApp() {
		editApp();
	}

	const dispatch = createEventDispatcher();
	function handleViewApp(app) {
		dispatch('selectApp', app);
	}
</script>

<body style="margin:0;padding:0">
	<div class="applications">
		{#each applications as app}
			<div class="app-card-wrapper">
				<button
					class="app-card"
					on:click={() => handleViewApp(app)}
					aria-label={`View application: ${app.App_Acronym}`}
				>
					<h3>App Acronym: <span>{app.App_Acronym}</span></h3>
					<p>
						<strong>App Description:</strong>
						{app.App_Description}
					</p>
					<p><strong>Start Date:</strong> {app.App_startDate}</p>
					<p><strong>End Date:</strong> {app.App_endDate}</p>
					<button
						class="edit-btn"
						on:click={(event) =>
							handleEditApp(
								app.App_Acronym,
								app.App_Rnumber,
								app.App_Description,
								app.App_startDate,
								app.App_endDate,
								app.App_permit_Create,
								app.App_permit_Open,
								app.App_permit_toDoList,
								app.App_permit_Doing,
								app.App_permit_Done,
								event
							)}
					>
						<FaEdit />
					</button>
				</button>
			</div>
		{/each}
	</div>

	<!-- EDIT APP MODAL -->

	{#if showEditModal}
		<div class="modal">
			<div class="modal-content">
				<h2>Edit Application</h2>
				<div class="form-group">
					<label for="appAcronym">App Acronym:</label>
					<h7 id="appAcronym">{appAcronym}</h7>
				</div>
				<div class="form-group">
					<label for="appRNumber">App R-Number:</label>
					<h7 id="appRNumber">{appRNumber}</h7>
				</div>
				<div class="form-group">
					<label for="appDescription">App Description: </label>
					<textarea
						class="inputdescription"
						id="appDescription"
						type="text"
						bind:value={appDescription}
						placeholder="Description"
					/>
				</div>
				<div class="form-group">
					<label for="appStartDate">Start Date:</label>
					<input id="appStartDate" type="date" bind:value={appStartDate} placeholder="DD/MM/YY" />
				</div>
				<div class="form-group">
					<label for="appEndDate">End Date:</label>
					<input id="appEndDate" type="date" bind:value={appEndDate} placeholder="DD/MM/YY" />
				</div>

				<!-- app permit create -->
				<div class="form-group">
					<label for="appPermitCreate">App Permit Create:</label>
					<div class="form-group-permit">
						<select id="appPermitCreate" bind:value={appPermitCreate}>
							<option value="">Group</option>
							{#each availableGroups as group}
								<option value={group.user_group}>{group.user_group}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- app permit open -->
				<div class="form-group">
					<label for="appPermitOpen">App Permit Open:</label>
					<div class="form-group-permit">
						<select id="appPermitOpen" bind:value={appPermitOpen}>
							<option value="">Group</option>
							{#each availableGroups as group}
								<option value={group.user_group}>{group.user_group}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- app permit todo -->
				<div class="form-group">
					<label for="appPermitToDo">App Permit ToDo:</label>
					<div class="form-group-permit">
						<select id="appPermitToDo" bind:value={appPermitToDo}>
							<option value="">Group</option>
							{#each availableGroups as group}
								<option value={group.user_group}>{group.user_group}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- app permit doing -->
				<div class="form-group">
					<label for="appPermitDoing">App Permit Doing:</label>
					<div class="form-group-permit">
						<select id="appPermitDoing" bind:value={appPermitDoing}>
							<option value="">Group</option>
							{#each availableGroups as group}
								<option value={group.user_group}>{group.user_group}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- app permit done -->
				<div class="form-group">
					<label for="appPermitDone">App Permit Done:</label>
					<div class="form-group-permit">
						<select id="appPermitDone" bind:value={appPermitDone}>
							<option value="">Group</option>
							{#each availableGroups as group}
								<option value={group.user_group}>{group.user_group}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="modal-actions">
					<button on:click={handleSubmitApp}>Edit Application</button>
					<button on:click={handleCloseApp}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}
</body>

<style>
	.applications {
		display: flex;
		gap: 20px;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		padding: 20px;
		flex-direction: row;
	}

	.app-card {
		background-color: #f2f2f2; /* Light grey background */
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
		display: flex;
		flex-direction: column;
		position: relative;
		cursor: pointer;
		border: none; /* Remove default button border */
		text-align: left; /* Align text to the left */
		color: inherit; /* Inherit text color from button styles */
		font-size: inherit; /* Inherit font size */
	}

	/* Ensuring hover effect */
	.app-card:hover {
		background-color: #b8b8b8; /* Dark background on hover */
		color: white; /* Ensure text remains white */
	}

	.app-card-wrapper {
		width: calc(50% - 20px); /* Control width here for 2 per row */
		display: flex;
		flex-direction: column;
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
		color: grey;
	}

	.edit-btn:hover {
		color: black; /* Change color on hover */
		background-color: #b8b8b8; /* Dark background on hover */
	}

	button {
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: black;
		color: white;
		font-size: 1em;
		cursor: pointer;
	}

	button:hover {
		background-color: #333;
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
		width: 700px;
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

	.inputdescription {
		width: 100%;
		height: 100px;
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

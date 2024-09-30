<script>
	// @ts-nocheck
	import HomePageNAV from '$lib/HomePage-NAV.svelte';
	import ApplicationList from '$lib/ApplicationList.svelte';
	import TMS from '$lib/TMS.svelte';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';
	import { alertError, alertInfo, alertSuccess } from '../../../stores/errorHandle';
	import { appStore } from '../../../stores/updateStore';
	import { Toaster } from 'svelte-sonner';

	let showCreateModal = false;
	let applications = [];
	let username = '';

	// Fetch the current user
	const fetchCurrentUser = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/currentUser', {
				withCredentials: true // Ensure cookies are sent with the request
			});
			username = response.data.username;
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				console.error('Error fetching current user:', error);
				alertError('Server Error. Please try again.');
				redirectToLogin();
			}
		}
	};

	let isInGroupPL = false;
	const checkIfPL = async () => {
		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/checkisInGroup',
				{
					username,
					userGroup: 'PL'
				},
				{
					withCredentials: true
				}
			);

			isInGroupPL = response.data.isInGroup;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				isInGroupPL = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};

	let isInGroupPM = false;
	const checkIfPM = async () => {
		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/checkisInGroup',
				{
					username,
					userGroup: 'PM'
				},
				{
					withCredentials: true
				}
			);

			isInGroupPM = response.data.isInGroup;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				isInGroupPM = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};

	const fetchapplications = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/getApps', {
				withCredentials: true
			});
			applications = response.data;

			//convert epoch to date
			applications.forEach((app) => {
				app.App_startDate = new Date(app.App_startDate * 1000).toLocaleDateString();
				app.App_endDate = new Date(app.App_endDate * 1000).toLocaleDateString();
			});

			console.log(applications);
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertInfo('No Application Assigned Yet.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Unable to fetch users. Please try again.');
			}
			console.error('Error:', error);
		}
	};

	const handleCreateApp = () => {
		showCreateModal = true;
	};
	const handleCloseApp = () => {
		showCreateModal = false;
		appAcronym = '';
		appRNumber = '';
		appDescription = '';
		appStartDate = '';
		appEndDate = '';
		appPermitCreate = '';
		appPermitOpen = '';
		appPermitToDo = '';
		appPermitDoing = '';
		appPermitDone = '';
	};

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

	let availableGroups = [];

	// Redirect to login page
	const redirectToLogin = () => {
		goto('/login');
	};
	// Fetch available groups from the API
	const fetchGroups = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/getGroups', {
				withCredentials: true
			});
			availableGroups = response.data.groups;
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.error('Error fetching groups:', error);
		}
	};

	onMount(async () => {
		await fetchCurrentUser();
		await fetchGroups();
		await fetchapplications();
		await checkIfPL();
		await checkIfPM();
	});

	function validateAppName(appname) {
		// Regular expression for validating an email address
		const appnamePattern = /^[a-zA-Z0-9_]{1,50}$/;
		return appnamePattern.test(appname);
	}

	function validateRNumber(rnumber) {
		const rnumberPattern = /^[1-9]\d*$/;
		return rnumberPattern.test(rnumber);
	}

	const createApp = async () => {
		if (!appAcronym || !appRNumber || !appStartDate || !appEndDate) {
			alertError(
				'Please fill in all required fields. (App Acronym, R Number, Start Date, End Date)'
			);
			return;
		}
		if (!validateAppName(appAcronym)) {
			alertError(
				'App Acronym can only have alphanumeric characters and underscores. Max length is 50 characters.'
			);
			return;
		}
		if (!validateRNumber(appRNumber)) {
			alertError('R Number must be a positive integer.');
			return;
		}
		if (!appPermitCreate) {
			appPermitCreate = null;
		}
		if (!appPermitOpen) {
			appPermitOpen = null;
		}
		if (!appPermitToDo) {
			appPermitToDo = null;
		}
		if (!appPermitDoing) {
			appPermitDoing = null;
		}
		if (!appPermitDone) {
			appPermitDone = null;
		}

		// convert date to epoch
		const epochStartDate = Math.floor(new Date(appStartDate).getTime() / 1000);
		const epochEndDate = Math.floor(new Date(appEndDate).getTime() / 1000);

		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/createApp',
				{
					appAcronym,
					appDescription,
					appRNumber,
					appStartDate: epochStartDate, // Ensure it's in the expected format
					appEndDate: epochEndDate, // Ensure it's in the expected format
					appPermitCreate,
					appPermitOpen,
					appPermitToDo,
					appPermitDoing,
					appPermitDone
				},
				{ withCredentials: true }
			);

			if (response.status === 200) {
				alertSuccess('Application created successfully!');
				await handleCloseApp(); // Close modal and reset form on success
				await fetchapplications(); // Fetch updated list of applications
			} else {
				alertError('Error creating application. Please try again.');
			}
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (
				(error.response && error.response.status === 401) ||
				error.response.status === 403
			) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 409) {
				alertError('Application already exists. Please choose a different Acronym.');
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.error('Error creating application:', error);
		}
	};

	function handleSubmitApp() {
		createApp();
	}

	let inTMS = false;
	let selectedAppDetails = null;

	function handleAppSelect(event) {
		const selectedAppDetails = event.detail; // Your selected app details

		// Update the store
		appStore.set({ selectedAppDetails, username, inTMS: true, isInGroupPL, isInGroupPM });

		// Navigate to TMS component
		goto('/homepage/applications/TMS');
	}
</script>

<body style="margin:0;padding:0">
	<HomePageNAV />
	<div class="container">
		<div class="content">
			<h1>Applications</h1>
			{#if isInGroupPL}
				<button on:click={handleCreateApp}>+ CREATE APP</button>
			{/if}
		</div>
	</div>
	<!-- Show the ApplicationList only when TMS is not being viewed -->
	<ApplicationList
		{availableGroups}
		{applications}
		{fetchapplications}
		{isInGroupPL}
		on:selectApp={handleAppSelect}
	/>

	<!-- CREATE APP MODAL -->

	{#if showCreateModal}
		<Toaster richColors style="z-index: 12;" />
		<div class="modal">
			<div class="modal-content">
				<h2>Create Application</h2>

				<div class="form-group">
					<label for="appAcronym">App Acronym:</label>
					<input id="appAcronym" type="text" bind:value={appAcronym} placeholder="Name" />
				</div>
				<div class="form-group">
					<label for="appRNumber">App R-Number:</label>
					<input id="appRNumber" type="number" bind:value={appRNumber} placeholder="Number" />
				</div>

				<div class="form-group">
					<label for="appStartDate">Start Date:</label>
					<input id="appStartDate" type="date" bind:value={appStartDate} placeholder="DD/MM/YY" />
				</div>
				<div class="form-group">
					<label for="appEndDate">End Date:</label>
					<input id="appEndDate" type="date" bind:value={appEndDate} placeholder="DD/MM/YY" />
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
					<button on:click={handleSubmitApp}>Create Application</button>
					<button on:click={handleCloseApp}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}
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
		width: 700px;
		max-width: 100%;
		max-height: 90%;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		overflow-y: auto;
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
		flex: 0.5;
		white-space: nowrap;
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

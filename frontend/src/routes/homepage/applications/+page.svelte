<script>
	// @ts-nocheck
	import HomePageNAV from '$lib/HomePage-NAV.svelte';
	import ApplicationList from '$lib/ApplicationList.svelte';
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';

	let showGroupModal = false;

	const handleCreateApp = () => {
		showGroupModal = true;
	};
	const handleCloseApp = () => {
		showGroupModal = false;
		appAcronym = '';
		appRnumber = '';
		appDescription = '';
		appStartDate = '';
		appEndDate = '';
		// appPermitCreate = '';
		// appPermitOpen = '';
	 	// appPermitToDo = '';
		// appPermitDoing = '';
		// appPermitDone = '';
		selectedGroupPermitCreate = [];
		selectedGroupPermitOpen = [];
		selectedGroupPermitToDo = [];
		selectedGroupPermitDoing = [];
		selectedGroupPermitDone = [];
	};

	let appAcronym = '';
	let appRnumber = '';
	let appDescription = '';
	let appStartDate = '';
	let appEndDate = '';
	let appPermitCreate = '';
	let appPermitOpen = '';
	let appPermitToDo = '';
	let appPermitDoing = '';
	let appPermitDone = '';

	let availableGroups = [];
	let selectedGroupPermitCreate = [];
	let selectedGroupPermitOpen = [];
	let selectedGroupPermitToDo = [];
	let selectedGroupPermitDoing = [];
	let selectedGroupPermitDone = [];
	let inputGroupPermitCreate = '';
	let inputGroupPermitOpen = '';
	let inputGroupPermitToDo = '';
	let inputGroupPermitDoing = '';
	let inputGroupPermitDone = '';

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

	// Function to handle adding a group to the selected list
function handleAddGroup(event, field) {
    const selectedGroup = event.target.value;

    // Check if the selected group is not empty and not already in the specific selectedGroups array
    switch (field) {
        case 'create':
            if (selectedGroup && !selectedGroupPermitCreate.includes(selectedGroup)) {
                selectedGroupPermitCreate = [...selectedGroupPermitCreate, selectedGroup];
                inputGroupPermitCreate = ''; // Clear the input after adding
            }
            break;
        case 'open':
            if (selectedGroup && !selectedGroupPermitOpen.includes(selectedGroup)) {
                selectedGroupPermitOpen = [...selectedGroupPermitOpen, selectedGroup];
                inputGroupPermitOpen = '';
            }
            break;
        case 'todo':
            if (selectedGroup && !selectedGroupPermitToDo.includes(selectedGroup)) {
                selectedGroupPermitToDo = [...selectedGroupPermitToDo, selectedGroup];
                inputGroupPermitToDo = '';
            }
            break;
        case 'doing':
            if (selectedGroup && !selectedGroupPermitDoing.includes(selectedGroup)) {
                selectedGroupPermitDoing = [...selectedGroupPermitDoing, selectedGroup];
                inputGroupPermitDoing = '';
            }
            break;
        case 'done':
            if (selectedGroup && !selectedGroupPermitDone.includes(selectedGroup)) {
                selectedGroupPermitDone = [...selectedGroupPermitDone, selectedGroup];
                inputGroupPermitDone = '';
            }
            break;
        default:
            break;
    }
}


function handleRemoveGroup(group, field) {
    // Remove the group from the specific selectedGroups array
    switch (field) {
        case 'create':
            selectedGroupPermitCreate = selectedGroupPermitCreate.filter((selectedGroup) => selectedGroup !== group);
            break;
        case 'open':
            selectedGroupPermitOpen = selectedGroupPermitOpen.filter((selectedGroup) => selectedGroup !== group);
            break;
        case 'todo':
            selectedGroupPermitToDo = selectedGroupPermitToDo.filter((selectedGroup) => selectedGroup !== group);
            break;
        case 'doing':
            selectedGroupPermitDoing = selectedGroupPermitDoing.filter((selectedGroup) => selectedGroup !== group);
            break;
        case 'done':
            selectedGroupPermitDone = selectedGroupPermitDone.filter((selectedGroup) => selectedGroup !== group);
            break;
        default:
            break;
    }
}


	onMount(async () => {
		await fetchGroups();
	})

</script>

<body style="margin:0;padding:0">
	<HomePageNAV />

	<div class="container">
		<div class="content">
			<h1>Applications</h1>
			<button on:click={handleCreateApp}>+ CREATE APP</button>
		</div>
	</div>




			{#if showGroupModal}
				<div class="modal">
					<div class="modal-content">
						<h2>Create Application</h2>
						<div class="form-group">
							<label for="appAcronym">App Acronym:</label>
							<input id="appAcronym" type="text" bind:value={appAcronym} placeholder="Name" />
						</div>
						<div class="form-group">
							<label for="appRnumber">App R-Number:</label>
							<input id="appRnumber" type="text" bind:value={appRnumber} placeholder="Number" />
						</div>
						<div class="form-group">
							<label for="appDescription">App Description:</label>
							<textarea class="inputdescription" id="appDescription" type="text" bind:value={appDescription} placeholder="Description" />
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
									<select id="appPermitCreate" bind:value={inputGroupPermitCreate} on:change={(e) => handleAddGroup(e, 'create')}>
										<option value="">Group</option>
										{#each availableGroups as group}
											<option value={group.user_group}>{group.user_group}</option>
										{/each}
									</select>

									{#if selectedGroupPermitCreate.length > 0}
										<div class="scrollable-container">
											{#each selectedGroupPermitCreate as group}
												<div class="group-bubble2">
													<span class="group-name">{group}</span>
													<button
														class="remove-icon"
														on:click={() => handleRemoveGroup(group, 'create')}
														aria-label={`Remove group ${group}`}
													>
														<span>✖</span>
													</button>
												</div>
											{/each}
										</div>
									{/if}
									</div>
								</div>

								<!-- app permit open -->
								<div class="form-group">
									<label for="appPermitOpen">App Permit Open:</label>
									<div class="form-group-permit">
									<select id="appPermitOpen" bind:value={inputGroupPermitOpen} on:change={(e) => handleAddGroup(e, 'open')}>
										<option value="">Group</option>
										{#each availableGroups as group}
											<option value={group.user_group}>{group.user_group}</option>
										{/each}
									</select>

									{#if selectedGroupPermitOpen.length > 0}
										<div class="scrollable-container">
											{#each selectedGroupPermitOpen as group}
												<div class="group-bubble2">
													<span class="group-name">{group}</span>
													<button
														class="remove-icon"
														on:click={() => handleRemoveGroup(group, 'open')}
														aria-label={`Remove group ${group}`}
													>
														<span>✖</span>
													</button>
												</div>
											{/each}
										</div>
									{/if}
									</div>
								</div>

								<!-- app permit todo -->
								<div class="form-group">
									<label for="appPermitToDo">App Permit ToDo:</label>
									<div class="form-group-permit">
									<select id="appPermitToDo" bind:value={inputGroupPermitToDo} on:change={(e) => handleAddGroup(e, 'todo')}>
										<option value="">Group</option>
										{#each availableGroups as group}
											<option value={group.user_group}>{group.user_group}</option>
										{/each}
									</select>

									{#if selectedGroupPermitToDo.length > 0}
										<div class="scrollable-container">
											{#each selectedGroupPermitToDo as group}
												<div class="group-bubble2">
													<span class="group-name">{group}</span>
													<button
														class="remove-icon"
														on:click={() => handleRemoveGroup(group, 'todo')}
														aria-label={`Remove group ${group}`}
													>
														<span>✖</span>
													</button>
												</div>
											{/each}
										</div>
									{/if}
									</div>
								</div>

								<!-- app permit doing -->
								<div class="form-group">
									<label for="appPermitDoing">App Permit Doing:</label>
									<div class="form-group-permit">
									<select id="appPermitDoing" bind:value={inputGroupPermitDoing} on:change={(e) => handleAddGroup(e, 'doing')}>
										<option value="">Group</option>
										{#each availableGroups as group}
											<option value={group.user_group}>{group.user_group}</option>
										{/each}
									</select>

									{#if selectedGroupPermitDoing.length > 0}
										<div class="scrollable-container">
											{#each selectedGroupPermitDoing as group}
												<div class="group-bubble2">
													<span class="group-name">{group}</span>
													<button
														class="remove-icon"
														on:click={() => handleRemoveGroup(group, 'doing')}
														aria-label={`Remove group ${group}`}
													>
														<span>✖</span>
													</button>
												</div>
											{/each}
										</div>
									{/if}
									</div>
								</div>

								<!-- app permit done -->
								<div class="form-group">
									<label for="appPermitDone">App Permit Done:</label>
									<div class="form-group-permit">
									<select id="appPermitDone" bind:value={inputGroupPermitDone} on:change={(e) => handleAddGroup(e, 'done')}>
										<option value="">Group</option>
										{#each availableGroups as group}
											<option value={group.user_group}>{group.user_group}</option>
										{/each}
									</select>

									{#if selectedGroupPermitDone.length > 0}
										<div class="scrollable-container">
											{#each selectedGroupPermitDone as group}
												<div class="group-bubble2">
													<span class="group-name">{group}</span>
													<button
														class="remove-icon"
														on:click={() => handleRemoveGroup(group, 'done')}
														aria-label={`Remove group ${group}`}
													>
														<span>✖</span>
													</button>
												</div>
											{/each}
										</div>
									{/if}
									</div>
								</div>


						<div class="modal-actions">
							<button on:click>Create</button>
							<button on:click={handleCloseApp}>Cancel</button>
						</div>
					</div>
				</div>
			{/if}

<ApplicationList/>
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

	.group-bubble2 {
		background-color: #e1e9f6; /* Light gray background */
		border-radius: 12px; /* Rounded edges */
		padding: 0.5rem 1rem; /* Padding inside the bubble */
		font-size: 12px; /* Adjust the text size */
		margin-top: 0.3rem;
		margin-right: 0.2rem;
		color: #000; /* Text color */
		border: #e1e9f6;
	}

	.remove-icon {
		background-color: #e1e9f6;
		color: #000; /* Text color */
		cursor: pointer;
		border: #e1e9f6;
	}

	.remove-icon:hover {
		border: red;
		color: red; /* Text color */
		cursor: pointer;
		background-color: #e1e9f6;
	}

	.scrollable-container {
		max-height: 150px; /* Adjust based on your design */
		overflow-y: auto; /* Adds vertical scroll */
		border: 1px solid #ccc;
		padding: 8px;
		border-radius: 4px;
	}
</style>

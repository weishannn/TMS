<script>
	// @ts-nocheck
	import HomePageNAV from '$lib/HomePage-NAV.svelte';
	import UserList from '$lib/CreateUserList.svelte';
	import axios from 'axios';
	import { onMount, onDestroy } from 'svelte';
	import { refreshUserList } from '../../../stores/updateStore';
	import { goto } from '$app/navigation';
	import { alertError, alertSuccess } from '../../../stores/errorHandle';

	let users = [];
	let availableGroups = [];
	let showGroupModal = false;
	let groupName = '';
	let errorMessage = '';
	let loading = true;
	let username = '';
	let isAdmin = false;
	let unsubscribe;

	// Redirect to login page
	const redirectToLogin = () => {
		goto('/login');
	};

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

	// Check if the current user is an admin
	const checkIfAdmin = async () => {
		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/checkAdmin',
				{ username },
				{ withCredentials: true }
			);
			isAdmin = response.data.isAdmin;
		} catch (error) {
			console.error('Error checking if user is an admin:', error);
			alertError('Unauthorized access.');
			redirectToLogin();
		}
	};

	// Fetch users from the API
	const fetchUsers = async () => {
		if (!isAdmin) return; // Skip fetching users if not an admin
		try {
			const response = await axios.get('http://localhost:5000/api/users/getUsers', {
				withCredentials: true
			});
			users = response.data.users;
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.error('Error fetching users:', error);
		}
	};

	// Fetch available groups from the API
	const fetchGroups = async () => {
		if (!isAdmin) return; // Skip fetching groups if not an admin
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

	// Call fetch functions on mount
	onMount(async () => {
		await fetchCurrentUser();
		await checkIfAdmin();

		//console.log('onmount', isAdmin, username);

		if (isAdmin) {
			await fetchUsers();
			await fetchGroups();

			// Subscribe to user list updates
			unsubscribe = refreshUserList.subscribe(async (refresh) => {
				if (refresh) {
					await fetchUsers();
					await fetchGroups();
					refreshUserList.set(false); // Reset the store
				}
			});
		}

		loading = false;
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	// Handle modal visibility
	function handleCreateGroup() {
		showGroupModal = true;
	}

	function handleCancel() {
		errorMessage = '';
		groupName = '';
		showGroupModal = false;
	}

	function validateGroup(group) {
		// Regular expression for validating an email address
		const groupPattern = /^[a-zA-Z0-9_]+$/; // Alphanumeric with no spaces
		return groupPattern.test(group);
	}

	async function handleSaveGroup() {
		if (!groupName) {
			alertError('Group name is required');
			return;
		}

		if (!validateGroup(groupName) || groupName.length > 50) {
			alertError('Group name must only be alphanumeric and/or underscore. (Up to 50 characters)');
			return;
		}

		// Check if the group already exists
		if (
			availableGroups.some(
				(group) => group.user_group && group.user_group.toLowerCase() === groupName.toLowerCase()
			)
		) {
			alertError('Group already exists');
			return;
		}

		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/createGroup',
				{ userGroup: groupName },
				{ withCredentials: true }
			);

			// Update the availableGroups state
			availableGroups = [...availableGroups, { user_group: groupName }];
			groupName = '';
			errorMessage = '';
			showGroupModal = false;

			alertSuccess(response.data.message);
			await fetchGroups();
		} catch (error) {
			if (error.response && error.response.status === 401) {
				alertError('Unauthorized. Please login again.');
				redirectToLogin();
			} else {
				console.error('Error creating group:', error);
				alertError('Server Error. Failed to create group. Please try again.');
			}
		}
	}
</script>

<body style="margin:0;padding:0">
	<HomePageNAV />

	{#if loading}
		<p></p>
	{:else if isAdmin}
		<div class="container">
			<div class="admin-content">
				<h1>User Management</h1>
				<button on:click={handleCreateGroup}>+ Group</button>
			</div>
			<div class="admin-header">
				<div class="admin-header-content">Name</div>
				<div class="admin-header-content">Email</div>
				<div class="admin-header-content">Group</div>
				<div class="admin-header-content">Password</div>
				<div class="admin-header-content">Status</div>
				<div class="admin-header-content">Action</div>
			</div>
			{#if users.length > 0}
				<UserList {users} {availableGroups} {fetchUsers} />
			{/if}

			{#if showGroupModal}
				<div class="modal">
					<div class="modal-content">
						<h2>Add Group</h2>
						<div class="form-group">
							<label for="groupName">Group Name:</label>
							<input id="groupName" type="text" bind:value={groupName} placeholder="Name" />
						</div>
						<div class="modal-actions">
							<button on:click={handleSaveGroup}>Add</button>
							<button on:click={handleCancel}>Cancel</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</body>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
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
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.form-group label {
		margin-right: 1em;
		flex: 0 0 20%;
		white-space: nowrap;
	}

	.form-group input {
		width: 100%;
		padding: 0.5em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #c9c9c9;
		flex: 1;
	}

	.modal-actions {
		margin-top: 1em;
		text-align: center;
	}

	.modal-actions button {
		margin: 0 0.5em;
	}

	.admin-content {
		padding: 0.5em 1em;
		color: #000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 50px;
		margin-top: 20px;
	}

	.admin-content h1 {
		padding: 1em;
		margin-left: 50px;
	}

	.admin-header {
		background-color: #eff4fa;
		color: #8f9bb3;
		height: 50px;
		padding: 0 1em;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.5em;
		align-items: center;
		margin-bottom: 1em;
	}

	.admin-header-content {
		padding: 1em;
		text-align: center;
		font-weight: bold;
	}
</style>

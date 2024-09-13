<script>
	// @ts-nocheck
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';
	import UserList from './CreateUserList.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import { refreshUserList } from '../stores/updateStore';

	let users = [];
	let availableGroups = [];
	let showGroupModal = false;
	let groupName = '';
	let errorMessage = '';

	let unsubscribe;

	onMount(() => {
		unsubscribe = refreshUserList.subscribe(async (refresh) => {
			if (refresh) {
				await fetchUsers();
				refreshUserList.set(false); // Reset the store
			}
		});
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	// Function to fetch users
	const fetchUsers = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/getUsers', {
				withCredentials: true // Ensure cookies are sent with the request
			});
			users = response.data.users; // assign users data
			console.log('users:', users);
		} catch (error) {
			console.error('Error fetching users:', error);
			toast.error('Server issue. Please try again.');
		}
	};

	// Function to fetch groups
	const fetchGroups = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/getGroups', {
				withCredentials: true // Ensure cookies are sent with the request
			});
			availableGroups = response.data.groups;
			console.log('availableGroups:', availableGroups);
		} catch (error) {
			console.error('Error fetching groups:', error);
			toast.error('Server issue. Please try again.');
		}
	};

	// Call both fetch functions on mount
	onMount(async () => {
		await fetchUsers();
		await fetchGroups();
	});

	function handleCreateGroup() {
		showGroupModal = true;
	}

	function handleCancel() {
		errorMessage = '';
		groupName = '';
		showGroupModal = false;
	}

	async function handleSaveGroup() {
		if (!groupName) {
			toast.error('Group name is required');
			return;
		}

		// Check if the group already exists (case-insensitive check)
		if (
			availableGroups.some(
				(group) => group.user_group && group.user_group.toLowerCase() === groupName.toLowerCase()
			)
		) {
			toast.error('Group already exists');
			return;
		}

		try {
			// Make POST request to create a new group
			const response = await axios.post(
				'http://localhost:5000/api/users/createGroup',
				{
					userGroup: groupName
				},
				{
					withCredentials: true // Ensure cookies are sent with the request
				}
			);

			// Update the availableGroups state
			availableGroups = [...availableGroups, groupName];
			groupName = '';
			errorMessage = '';
			showGroupModal = false;

			console.log(response.data.message); // Log the success message
			toast.success(response.data.message); // Show success message

			await fetchGroups();
		} catch (error) {
			console.error('Error creating group:', error);
			toast.error('Failed to create group. Please try again.');
		}
	}
</script>

<div class="container">
	<Toaster />
	<!-- Include the Toaster component here -->
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

<script>
	// @ts-nocheck
	import FaEdit from 'svelte-icons/fa/FaEdit.svelte';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { alertError, alertSuccess } from '../stores/errorHandle';

	let inputUsername = '';
	let inputEmail = '';
	let inputGroup = ''; // Default value
	let inputPassword = '';
	let inputAccount_status = 'active'; // Default value

	let selectedUser = null;
	let isEditing = false;
	let editInputUsername = '';
	let editInputEmail = '';
	let editInputGroup = '';
	let editInputPassword = '';
	let editInputAccount_status = 'active';
	let localSelectedGroups = []; // Local list to store selected groups during editing
	let selectedGroups = []; // Array to store selected groups

	// Retrieve data from parent component
	export let users = [];
	export let availableGroups = [];
	export let fetchUsers;

	// Display the user group matching the username
	let usergroup = { users: [] };

	// Function to fetch users and groups
	const fetchUsersAndGroups = async () => {
		try {
			const response = await axios.get('http://localhost:5000/api/users/getUsersAndGroups', {
				withCredentials: true // Ensure cookies are sent with the request
			});
			usergroup = response.data;
			console.log('usergroup after fetch:', usergroup); // Ensure usergroup contains the expected data
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

	// Call fetchUsersAndGroups inside onMount
	onMount(async () => {
		await fetchUsersAndGroups();
	});

	function getUserGroup(username) {
		// Ensure usergroup.users is populated
		if (!usergroup.users || usergroup.users.length === 0) {
			console.log('Usergroup not populated yet');
			return [];
		}

		// Find the matching user by username
		const user = usergroup.users.find((user) => user.username === username);

		// Return the array of groups or an empty array
		return user ? user.groups : [];
	}

	// Validate password
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

	function validateUsername(username) {
		// Regular expression for validating an email address
		const usernamePattern = /^[a-zA-Z0-9]+$/; // Alphanumeric with no spaces
		return usernamePattern.test(username);
	}

	// Redirect to login page
	const redirectToLogin = () => {
		goto('/login');
	};

	async function handleCreateUser() {
		if (!inputUsername || !inputPassword || !inputAccount_status) {
			alertError('Please provide valid inputs. (Username, Password, Account Status)');
			return;
		}
		if (!validateUsername(inputUsername || inputUsername.length > 50)) {
			alertError('Username must be alphanumeric with no spaces. (Up to 50 characters)');
			return;
		}
		if (!validatePassword(inputPassword)) {
			return;
		}

		if (inputEmail && !validateEmail(inputEmail)) {
			alertError('Invalid email address');
			return;
		}

		try {
			// Create user
			await axios.post(
				'http://localhost:5000/api/users/createUser',
				{
					username: inputUsername,
					email: inputEmail,
					password: inputPassword,
					accountStatus: inputAccount_status
				},
				{
					withCredentials: true // Ensure cookies are sent with the request
				}
			);

			// Add user to groups
			if (selectedGroups && selectedGroups.length > 0) {
				// Add each group
				for (const group of selectedGroups) {
					await axios.post(
						'http://localhost:5000/api/users/putUserIntoGroup',
						{
							username: inputUsername,
							userGroup: group
						},
						{
							withCredentials: true // Ensure cookies are sent with the request
						}
					);
				}
			}

			alertSuccess('User added successfully!');
			resetForm();
		} catch (error) {
			if (error.response && error.response.status === 409) {
				alertError('Username already exists.');
			} else if (error.response && error.response.status === 401) {
				console.log(error);
				alertError('Unauthorized access.');
				redirectToLogin();
			} else {
				console.error('Error saving user:', error);
				alertError('Server Error. Failed saving user. Please try again.');
			}
		}
	}

	// Function to handle adding a group to the selected list
	function handleAddGroup(event) {
		const selectedGroup = event.target.value;

		// Check if the selected group is not empty and not already in the selectedGroups array
		if (selectedGroup && !selectedGroups.includes(selectedGroup)) {
			selectedGroups = [...selectedGroups, selectedGroup];
			// Clear the selection after adding
			inputGroup = '';
		}
	}

	function handleRemoveGroup(group) {
		selectedGroups = selectedGroups.filter((selectedGroup) => selectedGroup !== group);
	}

	// Edit user (Update)
	async function handleEditUser() {
		if (!editInputUsername) {
			alertError('Username is required.');
			return;
		}

		if (editInputPassword && !validatePassword(editInputPassword)) {
			return;
		}

		if (editInputEmail && !validateEmail(editInputEmail)) {
			alertError('Invalid email address');
			return;
		}

		try {
			await axios.put(
				'http://localhost:5000/api/users/editOtherUserProfile',
				{
					username: editInputUsername,
					email: editInputEmail,
					password: editInputPassword,
					accountStatus: editInputAccount_status,
					userGroups: localSelectedGroups
				},
				{
					withCredentials: true // Ensure cookies are sent with the request
				}
			);

			alertSuccess('User updated successfully!');
			resetForm();
		} catch (error) {
			if (error.response && error.response.status === 409) {
				alertError('Username already exists.');
			} else if (error.response && error.response.status === 411) {
				alertError('User already in the group.');
			} else if (error.response && error.response.status === 401) {
				console.log(error);
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				console.error('Error updating user:', error);
				alertError('Error updating user. Please try again.');
			}
		}
	}

	async function handleSaveUser() {
		if (isEditing) {
			await handleEditUser();
		} else {
			await handleCreateUser();
		}

		// Fetch the updated list of users and groups after save
		await fetchUsers(); // Ensure this is working and updating the `users` array
		await fetchUsersAndGroups(); // Verify that this is being called
	}

	function handleGroupSelection() {
		const group = editInputGroup;

		// Only add if it's a valid selection and not already in the list
		if (group && !localSelectedGroups.includes(group)) {
			localSelectedGroups = [...localSelectedGroups, group];
		}

		// Clear the selection
		editInputGroup = '';
	}

	function handleEdit(user) {
		selectedUser = user;
		editInputUsername = user.username;
		editInputEmail = user.email;
		editInputPassword = '';
		editInputAccount_status = user.accountStatus;
		localSelectedGroups = getUserGroup(user.username); // Initialize with existing groups
		isEditing = true;
	}

	function removeGroupFromLocalList(group) {
		localSelectedGroups = localSelectedGroups.filter((g) => g !== group);
	}

	function resetForm() {
		inputUsername = '';
		inputEmail = '';
		editInputGroup = ''; // Reset dropdown selection
		localSelectedGroups = []; // Clear selected groups list
		inputPassword = '';
		inputAccount_status = 'active'; // Reset to default value
		selectedUser = null;
		isEditing = false;
		selectedGroups = [];
		usergroup = { users: [] }; // Resetting usergroup
	}

	function handleCancel() {
		isEditing = false;
	}

	async function handleDeleteGroup(username, groupName) {
		console.log('Delete group', groupName, 'from user', username);

		try {
			await axios.delete(
				'http://localhost:5000/api/users/deleteUserGroup',
				{
					params: {
						username: username,
						userGroup: groupName
					}
				},
				{
					withCredentials: true // Ensure cookies are sent with the request
				}
			);
			alertSuccess('Group deleted successfully.');
		} catch (error) {
			if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 500) {
				alertError('Error deleting group. Please try again.');
			}
			console.error('Error deleting group:', error.response ? error.response.data : error.message);
		}
	}
</script>

<div class="user-list">
	<div class="add-users-form">
		<div class="form-row">
			<div class="form-group">
				<input id="username" bind:value={inputUsername} placeholder="Username" />
			</div>
			<div class="form-group">
				<input id="email" type="email" bind:value={inputEmail} placeholder="Email" />
			</div>

			<div class="form-group">
				<select id="group" bind:value={inputGroup} on:click={handleAddGroup}>
					<option value="">Group</option>
					{#each availableGroups as group}
						<option value={group.user_group}>{group.user_group}</option>
					{/each}
				</select>

				{#if selectedGroups.length > 0}
					<div class="scrollable-container">
						{#each selectedGroups as group}
							<div class="group-bubble2">
								<span class="group-name">{group}</span>
								<button
									class="remove-icon"
									on:click={() => handleRemoveGroup(group)}
									aria-label={`Remove group ${group}`}
								>
									<span>✖</span>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="form-group">
				<input id="password" type="password" bind:value={inputPassword} placeholder="Password" />
			</div>
			<div class="form-group">
				<select id="account_status" bind:value={inputAccount_status}>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>
			<div class="form-group">
				<button type="submit" on:click={handleSaveUser}>Add</button>
			</div>
		</div>
	</div>

	<!-- Displaying User List -->
	<ul class="user-list-table">
		{#each users as user (user.username)}
			<li class="user-row">
				{#if isEditing && selectedUser && selectedUser.username === user.username && user.username !== 'Admin'}
					<!-- Edit mode -->
					<div class="form-group">
						<input type="text" value={editInputUsername} readonly class="readonly-username" />
					</div>
					<div class="form-group">
						<input type="email" bind:value={editInputEmail} />
					</div>
					<div class="form-group">
						<select id="group" bind:value={editInputGroup} on:change={handleGroupSelection}>
							<option value="">Group</option>
							{#each availableGroups as group}
								<option value={group.user_group}>{group.user_group}</option>
							{/each}
						</select>

						{#if localSelectedGroups.length > 0}
							<div class="scrollable-container">
								{#each localSelectedGroups as group}
									<div class="group-bubble2">
										<span class="group-name">{group}</span>
										<button
											class="remove-icon"
											on:click={() => removeGroupFromLocalList(group)}
											aria-label={`Remove group ${group}`}
										>
											<span>✖</span>
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="form-group">
						<input type="password" bind:value={editInputPassword} placeholder="Password" />
					</div>
					<div class="form-group">
						<select bind:value={editInputAccount_status}>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
					<div class="actions">
						<button type="submit" on:click={handleSaveUser}>Save</button>
						<button class="cancel-button" on:click={handleCancel}>Cancel</button>
					</div>
				{:else}
					<!-- Normal mode -->
					<div class="user-username">{user.username}</div>
					<div class="user-email">{user.email}</div>

					<div class="user-group">
						{#if user.username && usergroup.users && usergroup.users.length > 0}
							{#each getUserGroup(user.username) as group}
								<div class="group-bubble">{group}</div>
							{/each}
						{:else}
							NA
						{/if}
					</div>

					<div class="user-password">••••••••</div>
					<div class="user-account_status">{user.accountStatus}</div>

					<div class="actions">
						{#if user.username !== 'Admin'}
							<button class="edit-button" on:click={() => handleEdit(user)}>
								<div style="width: 20px;">
									<FaEdit />
								</div>
							</button>
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.user-list {
		width: 100%;
		font-family: Arial, sans-serif;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.5em;
		align-items: center;
		margin-bottom: 1em;
	}

	.form-group,
	.actions {
		display: flex;
		flex-direction: column;
		padding: 0.5em;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.5em;
		box-sizing: border-box;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.user-list-table {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.user-row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.5em;
		align-items: center;
		padding: 0.5em;
		background-color: #fff;
		border-bottom: 1px solid #ccc;
		margin-bottom: 1em;
		font-size: 12px;
	}

	.user-username,
	.user-email,
	.user-group,
	.user-password,
	.user-account_status,
	.edit-button {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.user-email {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: left;
		padding-right: 1em;
		justify-content: left;
	}

	.user-username {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		justify-content: center;
	}

	.edit-button {
		border: white;
		background-color: white;
		cursor: pointer;
	}

	.user-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem; /* Adjust spacing between bubbles */
	}

	.group-bubble {
		background-color: #e1e9f6; /* Light gray background */
		border-radius: 12px; /* Rounded edges */
		padding: 0.5rem 1rem; /* Padding inside the bubble */
		font-size: 12px; /* Adjust the text size */
		color: #000; /* Text color */
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

	.actions {
		display: flex;
		justify-content: center;
	}

	button[type='submit'] {
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: black;
		color: white;
		font-size: 1em;
		cursor: pointer;
		width: 100%;
	}

	.cancel-button {
		padding: 0.5em;
		border: none;
		border-radius: 4px;
		background-color: #f0f0f0;
		color: black;
		font-size: 1em;
		cursor: pointer;
		margin-top: 1em;
		width: 100%;
	}

	.readonly-username {
		cursor: not-allowed; /* Change cursor to indicate read-only */
		background-color: #f0f0f0; /* Optional: Change background to indicate read-only */
		border: none; /* Remove border for a cleaner look */
	}
</style>

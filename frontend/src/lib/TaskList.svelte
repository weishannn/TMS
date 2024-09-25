<script>
	//@ts-nocheck
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { alertError, alertSuccess } from '../stores/errorHandle';

	export let selectedAppDetails;
	export let username;

	console.log('accessing task list details of the selected', selectedAppDetails);

	let appAcronym = selectedAppDetails.App_Acronym;
	let appRNumber = selectedAppDetails.App_Rnumber;
	$: taskId = `${appAcronym}_${appRNumber}`;

	let tasks = {
		open: [],
		todo: [],
		doing: [],
		done: [],
		closed: []
	};

	// Fetch tasks based on appAcronym
	async function fetchTasks() {
		try {
			const response = await axios.post(
				`http://localhost:5000/api/users/getTasks`,
				{ taskappAcronym: appAcronym }
				// { withCredentials: true }  // Uncomment if necessary
			);
			const fetchedTasks = response.data;

			// Reset the task state arrays
			tasks.open = [];
			tasks.todo = [];
			tasks.doing = [];
			tasks.done = [];
			tasks.closed = [];

			// Group tasks by their state
			fetchedTasks.forEach((task) => {
				switch (task.Task_state.toLowerCase()) {
					case 'open':
						tasks.open.push(task);
						break;
					case 'todo':
						tasks.todo.push(task);
						break;
					case 'doing':
						tasks.doing.push(task);
						break;
					case 'done':
						tasks.done.push(task);
						break;
					case 'closed':
						tasks.closed.push(task);
						break;
				}
			});

			console.log('Tasks fetched:', tasks);
		} catch (error) {
			console.error('Error fetching tasks:', error);
		}
	}

	let plans = [];
	// get all plans
	async function fetchPlans() {
		try {
			const response = await axios.post(
				'http://localhost:5000/api/users/getPlans',
				{ planappAcronym: appAcronym }
				// { withCredentials: true }  // Uncomment if necessary
			);
			plans = response.data; // Update the plans array
			console.log(plans); // Log the plans for debugging
		} catch (error) {
			console.error('Error fetching plans:', error);
		}
	}

	// Function to get the plan color based on the plan name
	function getPlanColor(planName) {
		const plan = plans.find((p) => p.Plan_MVP_name === planName);

		if (plan) {
			console.log(`Plan Name: ${plan.Plan_MVP_name}, Plan Color: ${plan.Plan_color}`); // Corrected property name
			return plan.Plan_color; // Return the correct plan color
		} else {
			console.log(`Plan Name: ${planName} not found.`);
			return; // Default color if the plan is not found
		}
	}

	onMount(() => {
		fetchPlans();
		fetchTasks();
	});

	function handleCreateTask() {
		showCreateModal = true;
	}

	function handleCloseTask() {
		showCreateModal = false;
		showEditModal = false;
		taskName = '';
		taskNotes = '';
		taskPlan;
	}

	const createTask = async () => {
		if (!taskName) {
			alertError('Please enter a task name.');
			return;
		}
		if (!taskPlan) {
			taskPlan = null; // Use simple assignment
		}
		//convert data to epoch
		const epochCreateDate = Math.floor(new Date(taskcreateDate).getTime() / 1000);

		try {
			const response = await axios.post('http://localhost:5000/api/users/createTask', {
				taskId,
				taskPlan,
				taskappAcronym: appAcronym,
				taskName,
				taskDescription,
				taskNotes,
				taskState,
				taskCreator,
				taskOwner,
				taskcreateDate: epochCreateDate
			});
			if (response.status === 200) {
				alertSuccess('Task created successfully!');
				handleCloseTask();
				fetchTasks();
				appRNumber += 1; // increment appRNumber correctly
				console.log('new r number:', appRNumber);
			} else {
				alertError('Failed to create task. Please try again.');
			}
		} catch (error) {
			if (error.response && error.response.status === 404) {
				alertError('User not logged in.');
			} else if (error.response && error.response.status === 401) {
				alertError('Unauthorized access.');
				redirectToLogin();
			} else if (error.response && error.response.status === 409) {
				alertError('Task already exists. Please choose a different name.');
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.log('Error creating task:', error);
		}
	};

	function handleSubmitTask() {
		createTask();
	}

	let showCreateModal = false;
	let taskPlan;
	let taskName = '';
	let taskDescription = '';
	let taskState = 'Open';
	let taskCreator = username;
	let taskOwner = username;
	let taskcreateDate = new Date().toISOString().split('T')[0];
	let taskNotes = '';

	//editable modal
	let showEditModal = false;
	let editabletaskId = '';

	function handleEditTask(task) {
		showEditModal = true;
		taskPlan = task.Task_plan;
		taskName = task.Task_name;
		taskDescription = task.Task_description;
		taskState = task.Task_state;
		taskNotes = task.Task_notes;
		taskOwner = task.Task_owner;
		editabletaskId = task.Task_id;
		taskCreator = task.Task_creator;
		taskcreateDate = new Date(task.Task_createDate * 1000).toISOString().split('T')[0];
	}
</script>

<body style="margin:0;padding:0">
	<!-- Display Kanban Board -->
	<div class="kanban-board">
		{#each Object.keys(tasks) as state}
			<div class="column">
				<div class="column-header">
					<h2>{state.charAt(0).toUpperCase() + state.slice(1)}</h2>
					{#if state === 'open'}
						<button class="create-task-btn" on:click={handleCreateTask}>+ CREATE TASK</button>
					{/if}
				</div>

				<!-- Display tasks under each state -->
				{#each tasks[state] as task}
					<button
						on:click={handleEditTask(task)}
						class="task-card"
						style="border-left: {getPlanColor(task.Task_plan)} 6px solid;"
					>
						<div class="task-content">
							<p class="task-id">
								<strong>{task.Task_id}</strong>
							</p>
							<p class="task-name">{task.Task_name}</p>
							<div class="owner-btn">{task.Task_owner}</div>
						</div>
					</button>
				{/each}
			</div>
		{/each}
	</div>

	{#if showCreateModal}
		<div class="modal">
			<div class="modal-header">
				<h2>Create Task</h2>
			</div>
			<div class="modal-content" style="display: flex;">
				<!-- Left Side -->
				<div class="left-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<div class="task-row">
							<label for="taskId">Task ID: </label>
							<span style="font-weight: bold; margin-left: 10px; font-size: 18px; flex:2;"
								>{taskId}</span
							>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskName">Task Name:</label>
							<input
								class="task-input"
								id="taskName"
								type="text"
								bind:value={taskName}
								placeholder="Task Name"
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskDescription">Task Description:</label>
							<textarea
								class="task-input"
								id="taskDescription"
								bind:value={taskDescription}
								placeholder="Description"
							></textarea>
						</div>
					</div>

					<div class="form-group">
						<div class="task-row">
							<label for="taskPlan">Plan Name:</label>
							<select id="taskPlan" bind:value={taskPlan}>
								<option value="">Plan Name</option>
								{#if plans.length !== 0}
									{#each plans as plan}
										<option value={plan.Plan_MVP_name}>{plan.Plan_MVP_name}</option>
									{/each}
								{/if}
							</select>
						</div>
					</div>

					<div class="form-group">
						<div class="task-row">
							<label for="taskState">Task State:</label>
							<input
								class="task-input-readonly"
								id="taskState"
								type="text"
								bind:value={taskState}
								placeholder="Task State"
								readonly
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskCreator">Task Creator:</label>
							<input
								class="task-input-readonly"
								id="taskCreator"
								type="text"
								bind:value={taskCreator}
								placeholder="Task Creator"
								readonly
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskOwner">Task Owner:</label>
							<input
								class="task-input-readonly"
								id="taskOwner"
								type="text"
								bind:value={taskOwner}
								placeholder="Task Owner"
								readonly
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskcreateDate">Task Create Date:</label>
							<input
								class="task-input-readonly"
								id="taskcreateDate"
								type="date"
								bind:value={taskcreateDate}
								readonly
							/>
						</div>
					</div>
				</div>

				<!-- Right Side -->
				<div class="right-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<div class="notes-column">
							<label for="notes">Notes:</label>
							<span class="notes-label">{taskNotes}</span>
							<textarea
								class="notes-input"
								id="comments"
								bind:value={taskNotes}
								placeholder="Comments"
							></textarea>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-actions" style="margin-top: 20px;">
				<button on:click={handleSubmitTask}>Create Task</button>
				<button on:click={handleCloseTask}>Cancel</button>
			</div>
		</div>
	{/if}

	<!-- view/edit model -->
	{#if showEditModal}
		<div class="modal">
			<div class="modal-header">
				<h2>{editabletaskId}</h2>
			</div>
			<div class="modal-content" style="display: flex;">
				<!-- Left Side -->
				<div class="left-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<div class="task-row">
							<label for="taskId">Task ID: </label>
							<span style="font-weight: bold; margin-left: 10px; font-size: 18px; flex:2;"
								>{editabletaskId}</span
							>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskName">Task Name:</label>
							<input
								class="task-input"
								id="taskName"
								type="text"
								bind:value={taskName}
								placeholder="Task Name"
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskDescription">Task Description:</label>
							<textarea
								class="task-input"
								id="taskDescription"
								bind:value={taskDescription}
								placeholder="Description"
							></textarea>
						</div>
					</div>

					<div class="form-group">
						<div class="task-row">
							<label for="taskPlan">Plan Name:</label>
							<select id="taskPlan" bind:value={taskPlan}>
								<option value="">Plan Name</option>
								{#if plans.length !== 0}
									{#each plans as plan}
										<option value={plan.Plan_MVP_name}>{plan.Plan_MVP_name}</option>
									{/each}
								{/if}
							</select>
						</div>
					</div>

					<div class="form-group">
						<div class="task-row">
							<label for="taskState">Task State:</label>
							<input
								class="task-input-readonly"
								id="taskState"
								type="text"
								bind:value={taskState}
								placeholder="Task State"
								readonly
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskCreator">Task Creator:</label>
							<input
								class="task-input-readonly"
								id="taskCreator"
								type="text"
								bind:value={taskCreator}
								placeholder="Task Creator"
								readonly
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskOwner">Task Owner:</label>
							<input
								class="task-input-readonly"
								id="taskOwner"
								type="text"
								bind:value={taskOwner}
								placeholder="Task Owner"
								readonly
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskcreateDate">Task Create Date:</label>
							<input
								class="task-input-readonly"
								id="taskcreateDate"
								type="date"
								bind:value={taskcreateDate}
								readonly
							/>
						</div>
					</div>
				</div>

				<!-- Right Side -->
				<div class="right-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<div class="notes-column">
							<label for="notes">Notes:</label>
							<span class="notes-label">{taskNotes}</span>
							<textarea
								class="notes-input"
								id="comments"
								bind:value={taskNotes}
								placeholder="Comments"
							></textarea>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-actions" style="margin-top: 20px;">
				<button style="background-color: green;" on:click>Release Task</button>
				<button on:click>Save Changes</button>
				<button on:click={handleCloseTask}>Cancel</button>
			</div>
		</div>
	{/if}
</body>

<style>
	.kanban-board {
		display: flex;
		justify-content: space-between;
		margin: 20px;
	}
	.column {
		width: 18%;
		background-color: #d8d8d8;
		padding: 10px;
		border-radius: 8px;
		display: inline-block;
	}
	.column h2 {
		margin-left: 1rem;
	}
	.column-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 70%; /* Decrease width to 60% of the viewport */
		max-width: 70%; /* Maximum width for the modal */
		max-height: 95%;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
		z-index: 1000;
		overflow: hidden;
		overflow-y: auto;
	}

	.modal-header {
		background-color: black;
		color: white;
		padding: 10px; /* Reduce padding for a smaller header */
		font-size: 1em; /* Slightly reduce font size */
		height: 50px;
		align-items: center;
		justify-content: center;
		display: flex;
		height: 40px;
	}

	.modal-content {
		display: flex;
	}

	.left-side,
	.right-side {
		flex: 1;
		padding: 15px; /* Reduce padding for smaller spacing */
	}

	.left-side {
		border-right: 1px solid #ccc; /* Keep the separator */
	}

	.form-group {
		margin-bottom: 10px; /* Reduce space between form groups */
	}

	label {
		display: block;
		margin-bottom: 4px; /* Reduce space between label and input */
		font-weight: bold;
		flex: 1;
	}

	.task-input {
		flex: 2;
	}
	.task-input-readonly {
		cursor: not-allowed; /* Change cursor to indicate read-only */
		background-color: #fff; /* Optional: Change background to indicate read-only */
		border: none; /* Remove border for a cleaner look */
		flex: 2;
	}

	input[type='text'],
	input[type='date'],
	textarea {
		width: 100%;
		padding: 8px; /* Reduce padding inside inputs */
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
	}

	.task-row {
		display: flex; /* Use flexbox to align items in the row */
		align-items: center; /* Center align items vertically */
	}

	.notes-column {
		display: flex; /* Flexbox for consistent layout */
		flex-direction: column; /* Stack elements vertically */
	}

	textarea {
		width: 100%; /* Ensure textarea fills the available width */
		padding: 8px; /* Adjust padding for better aesthetics */
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		resize: vertical; /* Allow vertical resizing only */
		height: 60px; /* Set a default height */
	}

	.modal-actions {
		margin-top: 1em;
		text-align: center;
	}

	.modal-actions button {
		margin: 0 0.5em;
		margin-bottom: 1rem;
	}

	.task-row select,
	.task-row input {
		width: 100%;
		padding: 0.5em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #c9c9c9;
		flex: 2;
	}
	.notes-label {
		flex: 1;
	}
	.notes-input {
		flex: 2;
	}

	.task-card {
		display: flex;
		align-items: center;
		background-color: white;
		padding: 15px;
		margin-bottom: 10px;
		border-radius: 8px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		position: relative;
		border: none; /* Remove default button border */
		text-align: left; /* Align text to the left */
		color: inherit; /* Inherit text color from button styles */
		font-size: inherit; /* Inherit font size */
		width: 100%;
	}

	.task-card:hover {
		background-color: #b8b8b8; /* Dark background on hover */
		color: black;
	}

	.task-content {
		flex-grow: 1;
	}

	.task-id {
		font-size: 1rem;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.task-name {
		font-size: 0.9rem;
		color: #555;
		margin-bottom: 10px;
	}

	.owner-btn {
		background-color: #0088cc;
		color: white;
		border: none;
		border-radius: 5px;
		padding: 5px 10px;
		cursor: default;
		font-weight: bold;
		display: inline-flex;
	}
</style>

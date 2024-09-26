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
			return '#ffffff'; // Default color if the plan is not found
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
		taskPlan = '';
	}

	const createTask = async () => {
		if (!taskName) {
			alertError('Please enter a task name.');
			return;
		}
		if (!taskPlan) {
			taskPlan = null;
		}
		if (taskNotes) {
			// Get the current date and time
			const now = new Date();

			// Format the date to DD/MM/YYYY
			const day = String(now.getDate()).padStart(2, '0'); // Get day and pad with zero if needed
			const month = String(now.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed) and pad
			const year = now.getFullYear(); // Get full year

			// Format the time to HH:MM (24-hour format)
			const hours = String(now.getHours()).padStart(2, '0'); // Get hours and pad
			const minutes = String(now.getMinutes()).padStart(2, '0'); // Get minutes and pad

			// Construct the formatted date and time
			const formattedDate = `${day}/${month}/${year}`;
			const formattedTime = `${hours}:${minutes}`;

			// Append to taskNotes
			taskNotes = `Commented by: ${username} \nDated on: ${formattedDate} ${formattedTime} \n${taskNotes}\n`;
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
	let taskComments = '';

	//editable modal
	let showEditModal = false;
	let editabletaskId = '';
	let edittaskState = '';

	function handleEditTask(task) {
		showEditModal = true;
		taskPlan = task.Task_plan;
		taskName = task.Task_name;
		taskDescription = task.Task_description;
		edittaskState = task.Task_state;
		taskNotes = '';
		taskOwner = username;
		editabletaskId = task.Task_id;
		taskCreator = task.Task_creator || '';

		// Convert create date from epoch to YYYY-MM-DD format
		taskcreateDate = new Date(task.Task_createDate * 1000).toISOString().split('T')[0]; // Format the date

		// Format task comments
		if (task.Task_notes) {
			taskComments = task.Task_notes.split(/(?=Commented by: )/) // Split at each "Commented By"
				.map((comment) => comment.trim()) // Trim each comment block
				.map((comment) => comment.replace(/(Dated on: \d{2}\/\d{2}\/\d{4})/, '\n$1')) // Ensure "Dated On" has a line break before it
				.map((comment) => comment.replace(/\n{2,}/g, '\n')) // Remove extra newlines within each comment
				.join('\n\n'); // Join each comment block with a double newline
		} else {
			taskComments = ''; // Default to empty string if no comments
		}

		console.log(taskComments);
	}

	async function handleReleaseTask() {
		// Set the task state to 'Todo'
		edittaskState = 'Todo';

		// Get the current date and time
		const now = new Date();

		// Format the date to DD/MM/YYYY
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		// Format the time to HH:MM
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		// Construct the formatted date and time
		const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

		// Prepare the promotion note
		const promotionNote = `Promoted by: ${username} Dated on: ${formattedDateTime}`;

		// Check if there are existing task notes
		if (taskNotes && taskNotes.trim() !== '') {
			// Append to existing task notes
			taskNotes = `${taskNotes}\n${promotionNote}`;
		} else {
			// If no existing notes, set taskNotes to the promotion note
			taskNotes = promotionNote;
		}

		try {
			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the edit modal after updating
			showEditModal = false;
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleTakeOnTask() {
		// Set the task state to 'Todo'
		edittaskState = 'Doing';

		// Get the current date and time
		const now = new Date();

		// Format the date to DD/MM/YYYY
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		// Format the time to HH:MM
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		// Construct the formatted date and time
		const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

		// Prepare the promotion note
		const promotionNote = `Promoted by: ${username} Dated on: ${formattedDateTime}`;

		// Check if there are existing task notes
		if (taskNotes && taskNotes.trim() !== '') {
			// Append to existing task notes
			taskNotes = `${taskNotes}\n${promotionNote}`;
		} else {
			// If no existing notes, set taskNotes to the promotion note
			taskNotes = promotionNote;
		}

		try {
			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the edit modal after updating
			showEditModal = false;
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleToReviewTask() {
		// Set the task state to 'Todo'
		edittaskState = 'Done';

		// Get the current date and time
		const now = new Date();

		// Format the date to DD/MM/YYYY
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		// Format the time to HH:MM
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		// Construct the formatted date and time
		const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

		// Prepare the promotion note
		const promotionNote = `Promoted by: ${username} Dated on: ${formattedDateTime}`;

		// Check if there are existing task notes
		if (taskNotes && taskNotes.trim() !== '') {
			// Append to existing task notes
			taskNotes = `${taskNotes}\n${promotionNote}`;
		} else {
			// If no existing notes, set taskNotes to the promotion note
			taskNotes = promotionNote;
		}

		try {
			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the edit modal after updating
			showEditModal = false;
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleForfeitTask() {
		// Set the task state to 'Todo'
		edittaskState = 'Todo';

		// Get the current date and time
		const now = new Date();

		// Format the date to DD/MM/YYYY
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		// Format the time to HH:MM
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		// Construct the formatted date and time
		const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

		// Prepare the promotion note
		const promotionNote = `Forfeited by: ${username} Dated on: ${formattedDateTime}`;

		// Check if there are existing task notes
		if (taskNotes && taskNotes.trim() !== '') {
			// Append to existing task notes
			taskNotes = `${taskNotes}\n${promotionNote}`;
		} else {
			// If no existing notes, set taskNotes to the promotion note
			taskNotes = promotionNote;
		}

		try {
			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the edit modal after updating
			showEditModal = false;
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleApproveTask() {
		// Set the task state to 'Todo'
		edittaskState = 'Closed';

		// Get the current date and time
		const now = new Date();

		// Format the date to DD/MM/YYYY
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		// Format the time to HH:MM
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		// Construct the formatted date and time
		const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

		// Prepare the promotion note
		const promotionNote = `Promoted by: ${username} Dated on: ${formattedDateTime}`;

		// Check if there are existing task notes
		if (taskNotes && taskNotes.trim() !== '') {
			// Append to existing task notes
			taskNotes = `${taskNotes}\n${promotionNote}`;
		} else {
			// If no existing notes, set taskNotes to the promotion note
			taskNotes = promotionNote;
		}

		try {
			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the edit modal after updating
			showEditModal = false;
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleRejectTask() {
		// Set the task state to 'Todo'
		edittaskState = 'Done';

		// Get the current date and time
		const now = new Date();

		// Format the date to DD/MM/YYYY
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		// Format the time to HH:MM
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		// Construct the formatted date and time
		const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

		// Prepare the promotion note
		const promotionNote = `Rejected by: ${username} Dated on: ${formattedDateTime}`;

		// Check if there are existing task notes
		if (taskNotes && taskNotes.trim() !== '') {
			// Append to existing task notes
			taskNotes = `${taskNotes}\n${promotionNote}`;
		} else {
			// If no existing notes, set taskNotes to the promotion note
			taskNotes = promotionNote;
		}

		try {
			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the edit modal after updating
			showEditModal = false;
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	function handleUpdateTask() {
		updateTask();
	}

	const updateTask = async () => {
		if (!taskName) {
			alertError('Please enter a task name.');
			return;
		}

		if (!taskPlan) {
			taskPlan = null; // Set taskPlan to null if not provided
		}

		// Check if there are new task notes to append
		if (taskNotes) {
			// Get the current date and time
			const now = new Date();

			// Format the date to DD/MM/YYYY
			const day = String(now.getDate()).padStart(2, '0'); // Get day and pad with zero if needed
			const month = String(now.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed) and pad
			const year = now.getFullYear(); // Get full year

			// Format the time to HH:MM (24-hour format)
			const hours = String(now.getHours()).padStart(2, '0'); // Get hours and pad
			const minutes = String(now.getMinutes()).padStart(2, '0'); // Get minutes and pad

			// Construct the formatted date and time
			const formattedDate = `${day}/${month}/${year}`;
			const formattedTime = `${hours}:${minutes}`;

			// Append to taskNotes
			taskNotes = `Commented by: ${username} \nDated on: ${formattedDate} ${formattedTime} \n${taskNotes}\n`;
		}

		try {
			// Send updated task data to the server
			const response = await axios.put('http://localhost:5000/api/users/editTask', {
				taskId: editabletaskId,
				taskPlan,
				taskName,
				taskDescription,
				taskNotes,
				taskState: edittaskState,
				taskOwner
			});

			// If the response is successful
			if (response.status === 200) {
				alertSuccess('Task updated successfully!');

				// Append the new taskNotes to taskComments if successful
				taskComments += `\n\n${taskNotes}`; // Concatenate new notes to existing comments

				// Clear taskNotes after the update
				taskNotes = '';

				// Fetch updated tasks
				fetchTasks();
			} else {
				alertError('Failed to update task. Please try again.');
			}
		} catch (error) {
			// Error handling for various response statuses
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
			console.log('Error updating task:', error);
		}
	};
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
							<span style="font-weight: bold; margin-left: 10px; font-size: 18px; flex:2;">
								{editabletaskId}
							</span>
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
								readonly={edittaskState === 'Closed' ||
									edittaskState === 'Todo' ||
									edittaskState === 'Doing' ||
									edittaskState === 'Done'}
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
								readonly={edittaskState === 'Closed' ||
									edittaskState === 'Todo' ||
									edittaskState === 'Doing'}
							></textarea>
						</div>
					</div>

					<div class="form-group">
						<div class="task-row">
							<label for="taskPlan">Plan Name:</label>
							<select
								id="taskPlan"
								bind:value={taskPlan}
								disabled={edittaskState === 'Closed' ||
									edittaskState === 'Todo' ||
									edittaskState === 'Doing'}
							>
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
								id="edittaskState"
								type="text"
								bind:value={edittaskState}
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
							<!-- Use a div instead of span and apply the white-space CSS -->
							<div class="notes-label" style="white-space: pre-line;">{taskComments}</div>
							<textarea
								class="notes-input"
								id="comments"
								bind:value={taskNotes}
								placeholder="Comments"
								readonly={edittaskState === 'Closed'}
							></textarea>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-actions" style="margin-top: 20px;">
				{#if edittaskState === 'Closed'}
					<button on:click={handleCloseTask}>Close</button>
				{:else if edittaskState === 'Open'}
					<button style="background-color: green;" on:click={handleReleaseTask}>Release Task</button
					>
				{:else if edittaskState === 'Todo'}
					<button style="background-color: green;" on:click={handleTakeOnTask}>Take On</button>
				{:else if edittaskState === 'Doing'}
					<button style="background-color: green;" on:click={handleToReviewTask}>To Review</button>
					<button style="background-color: red;" on:click={handleForfeitTask}>Forfeit Task</button>
				{:else if edittaskState === 'Done'}
					<button style="background-color: green;" on:click={handleApproveTask}>Approve Task</button
					>
					<button style="background-color: red;" on:click={handleRejectTask}>Reject Task</button>
				{/if}

				{#if edittaskState !== 'Closed'}
					<button on:click={handleUpdateTask}>Save Changes</button>
					<button on:click={handleCloseTask}>Cancel</button>
				{/if}
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
		width: 100%;
		padding: 0.5em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #c9c9c9;
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

	select[disabled] {
		color: black; /* Change text color to black */
		font-weight: bolder;
		background-color: #fff; /* Light background for better contrast */
		border: none;
		cursor: not-allowed; /* Change cursor to indicate it's disabled */
	}
</style>

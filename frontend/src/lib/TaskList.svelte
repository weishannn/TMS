<script>
	let tasks = {
		open: [],
		todo: [],
		doing: [],
		done: [],
		closed: []
	};

	export let selectedAppDetails;

	console.log('accessing task list details of the selected', selectedAppDetails);

	let taskID = `${selectedAppDetails.App_Acronym}_${selectedAppDetails.App_Rnumber}`;

	function handleCreateTask() {
		showCreateModal = true;
	}

	function handleCloseTask() {
		showCreateModal = false;
	}

	function handleSubmitTask() {
		//something
	}

	//TO CHANGE THIS PART TO FIT TASK STUFF....
	let showCreateModal = false;
	let planName = '';
	let taskName = '';
	let taskDescription = '';
	let taskState = '';
	let taskCreator = '';
	let taskOwner = '';
	let taskCreateDate = '';
	let tasknotes = '';
	let taskcomments = '';
</script>

<body style="margin:0;padding:0">
	<div class="kanban-board">
		{#each Object.keys(tasks) as state}
			<div class="column">
				<div class="column-header">
					<h2>{state.charAt(0).toUpperCase() + state.slice(1)}</h2>
					{#if state === 'open'}
						<button on:click={handleCreateTask}>+ Create Task</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if showCreateModal}
		<div class="modal">
			<div
				class="modal-header"
				style="background-color: black; color: white; text-align: center; padding: 10px;"
			>
				<h2>{taskID}</h2>
			</div>
			<div class="modal-content" style="display: flex;">
				<!-- Left Side -->
				<div class="left-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<label for="taskID">Task ID:</label>
						<div class="task-id-row">
							<span>{taskID}</span>
						</div>
					</div>
					<div class="form-group">
						<label for="taskName">Task Name:</label>
						<input id="taskName" type="text" bind:value={taskName} placeholder="Task Name" />
					</div>
					<div class="form-group">
						<label for="taskDescription">Task Description:</label>
						<textarea id="taskDescription" bind:value={taskDescription} placeholder="Description"
						></textarea>
					</div>
					<div class="form-group">
						<label for="planName">Plan Name:</label>
						<input id="planName" type="text" bind:value={planName} placeholder="Plan Name" />
					</div>
					<div class="form-group">
						<label for="taskState">Task State:</label>
						<input id="taskState" type="text" bind:value={taskState} placeholder="Task State" />
					</div>
					<div class="form-group">
						<label for="taskCreator">Task Creator:</label>
						<input
							id="taskCreator"
							type="text"
							bind:value={taskCreator}
							placeholder="Task Creator"
						/>
					</div>
					<div class="form-group">
						<label for="taskOwner">Task Owner:</label>
						<input id="taskOwner" type="text" bind:value={taskOwner} placeholder="Task Owner" />
					</div>
					<div class="form-group">
						<label for="taskCreateDate">Task Create Date:</label>
						<input id="taskCreateDate" type="date" bind:value={taskCreateDate} />
					</div>
				</div>

				<!-- Right Side -->
				<div class="right-side" style="flex: 2; padding: 20px;">
					<div class="form-group">
						<label for="notes">Notes:</label>
						<div class="notes-column">
							<textarea id="notes" bind:value={tasknotes} placeholder="Add your notes here..."
							></textarea>
						</div>
					</div>
					<div class="form-group">
						<label for="comments">Comments:</label>
						<textarea
							id="comments"
							bind:value={taskcomments}
							placeholder="Add your comments here..."
						></textarea>
					</div>
				</div>
			</div>
			<div class="modal-actions" style="margin-top: 20px;">
				<button on:click={handleSubmitTask}>Create Task</button>
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
		height: 550px;
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
		width: 60%; /* Decrease width to 60% of the viewport */
		max-width: 100%; /* Maximum width for the modal */
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
		z-index: 1000;
		overflow: hidden;
	}

	.modal-header {
		background-color: black;
		color: white;
		text-align: center;
		padding: 10px; /* Reduce padding for a smaller header */
		font-size: 1em; /* Slightly reduce font size */
		height: 60px;
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

	.task-id-row {
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
		margin-bottom: 3rem;
	}
</style>

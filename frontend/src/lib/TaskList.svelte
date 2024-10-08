<script>
	//@ts-nocheck
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { alertError, alertSuccess } from '../stores/errorHandle';
	import { goto } from '$app/navigation';
	import { Toaster } from 'svelte-sonner';

	export let selectedAppDetails;
	export let username;

	let appAcronym = selectedAppDetails.App_Acronym;

	let permitCreate = selectedAppDetails.App_permit_Create;
	let permitOpen = selectedAppDetails.App_permit_Open;
	let permitToDo = selectedAppDetails.App_permit_toDoList;
	let permitDoing = selectedAppDetails.App_permit_Doing;
	let permitDone = selectedAppDetails.App_permit_Done;

	let permitCreateGroup = false;
	let permitOpenGroup = false;
	let permitToDoGroup = false;
	let permitDoingGroup = false;
	let permitDoneGroup = false;

	// Redirect to login page
	const redirectToLogin = () => {
		goto('/login');
	};

	const redirectToApps = () => {
		goto('/homepage/applications');
	};

	const checkpermitCreate = async () => {
		try {
			const response = await axios.post(
				'http://localhost:3000/api/users/checkisInGroup',
				{
					username,
					userGroup: permitCreate
				},
				{
					withCredentials: true
				}
			);

			permitCreateGroup = response.data.isInGroup;
			return true;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				permitCreateGroup = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};
	const checkpermitOpen = async () => {
		try {
			const response = await axios.post(
				'http://localhost:3000/api/users/checkisInGroup',
				{
					username,
					userGroup: permitOpen
				},
				{
					withCredentials: true
				}
			);

			permitOpenGroup = response.data.isInGroup;
			return true;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				permitOpenGroup = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};
	const checkpermitToDo = async () => {
		try {
			const response = await axios.post(
				'http://localhost:3000/api/users/checkisInGroup',
				{
					username,
					userGroup: permitToDo
				},
				{
					withCredentials: true
				}
			);

			permitToDoGroup = response.data.isInGroup;
			return true;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				permitToDoGroup = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};

	const checkpermitDoing = async () => {
		try {
			const response = await axios.post(
				'http://localhost:3000/api/users/checkisInGroup',
				{
					username,
					userGroup: permitDoing
				},
				{
					withCredentials: true
				}
			);

			permitDoingGroup = response.data.isInGroup;
			return true;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				permitDoingGroup = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};

	const checkpermitDone = async () => {
		try {
			const response = await axios.post(
				'http://localhost:3000/api/users/checkisInGroup',
				{
					username,
					userGroup: permitDone
				},
				{
					withCredentials: true
				}
			);

			permitDoneGroup = response.data.isInGroup;
			return true;
		} catch (error) {
			if (
				error.response.status === 404 ||
				error.response.status === 401 ||
				error.response.status === 403
			) {
				permitDoneGroup = false;
			} else {
				// Log other errors (e.g., server issues or unexpected responses)
				console.error('Error checking user group:', error);
			}
		}
	};

	let tasks = {
		open: [],
		todo: [],
		doing: [],
		done: [],
		closed: []
	};

	onMount(async () => {
		fetchPlans();
		fetchTasks();
		await checkpermitCreate();
		await checkpermitOpen();
		await checkpermitToDo();
		await checkpermitDoing();
		await checkpermitDone();
	});

	// Fetch tasks based on appAcronym
	async function fetchTasks() {
		try {
			const response = await axios.post(
				`http://localhost:3000/api/users/getTasks`,
				{ taskappAcronym: appAcronym },
				{ withCredentials: true }
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
		} catch (error) {
			console.error('Error fetching tasks:', error);
		}
	}

	export let plans = [];

	// get all plans
	async function fetchPlans() {
		try {
			const response = await axios.post(
				'http://localhost:3000/api/users/getPlans',
				{ planappAcronym: appAcronym },
				{ withCredentials: true }
			);
			plans = response.data; // Update the plans array
		} catch (error) {
			console.error('Error fetching plans:', error);
		}
	}
	// Function to get the plan color based on the plan name
	function getPlanColor(planName) {
		const plan = plans.find((p) => p.Plan_MVP_name === planName);

		if (plan) {
			return plan.Plan_color; // Return the correct plan color
		} else {
			return '#ffffff'; // Default color if the plan is not found
		}
	}

	function handleCreateTask() {
		showCreateModal = true;
	}

	function handleCloseTask() {
		showCreateModal = false;
		showEditModal = false;
		taskName = '';
		taskNotes = '';
		taskPlan = '';
		taskDescription = '';
	}

	function validateTaskName(taskname) {
		// Regular expression for validating an email address
		const tasknamePattern = /^[a-zA-Z0-9\s!@#$%^&*()\-_=+{};:'",.<>?/|\\~`[\]]{1,255}$/;
		return tasknamePattern.test(taskname);
	}

	const createTask = async () => {
		if (!taskName) {
			alertError('Please enter a task name.');
			return;
		}
		if (!validateTaskName(taskName)) {
			alertError(
				'Task name can only be alphanumeric, including spaces and special characters. Max length is 255 characters.'
			);
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
			const response = await axios.post(
				'http://localhost:3000/api/users/createTask',
				{
					taskPlan,
					taskappAcronym: appAcronym,
					taskName,
					taskDescription,
					taskNotes,
					taskState,
					taskCreator,
					taskOwner,
					taskcreateDate: epochCreateDate
				},
				{ withCredentials: true }
			);
			if (response.status === 200) {
				alertSuccess('Task created successfully!');
				handleCloseTask();
				fetchTasks();
			} else {
				alertError('Failed to create task. Please try again.');
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
				alertError('Task already exists. Please choose a different name.');
			} else if (error.response && error.response.status === 500) {
				alertError('Server Error. Please try again.');
			}
			console.log('Error creating task:', error);
		}
	};

	async function handleSubmitTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitCreate();

			console.log('hasPermission:', hasPermission);

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to create tasks.');
				//redirectToApps();
				// Redirect user to login page or handle the session logout
				return; // Stop further execution
			}

			// Set the task state to 'Todo'
			edittaskState = 'Open';

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
			const promotionNote = `Created by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			await createTask();
		} catch (error) {
			console.error('Error submitting task:', error);
			alertError('Error submitting task. Please try again.');
		}
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
	let edittaskPlan = '';
	let edittaskName = '';
	let previoustaskOwner = '';

	let taskPlanHasChanges = false;
	$: taskPlanHasChanges = edittaskPlan !== taskPlan;

	function handleEditTask(task) {
		showEditModal = true;
		taskPlan = task.Task_plan;
		edittaskPlan = taskPlan;
		edittaskName = task.Task_name;
		taskDescription = task.Task_description;
		edittaskState = task.Task_state;
		taskNotes = '';
		previoustaskOwner = task.Task_owner;
		taskOwner = username;
		editabletaskId = task.Task_id;
		taskCreator = task.Task_creator || '';

		// Convert create date from epoch to YYYY-MM-DD format
		taskcreateDate = new Date(task.Task_createDate * 1000).toISOString().split('T')[0]; // Format the date

		// Define keywords to split comments
		const commentKeywords = [
			'Commented by',
			'Created by',
			'Released by',
			'Take on by',
			'Submitted to review by',
			'Forfeited by',
			'Approved by',
			'Rejected by'
		];

		// Build regex dynamically for keywords
		const commentRegex = new RegExp(`(?=${commentKeywords.join('|')})`, 'g');

		// Format task comments
		if (task.Task_notes) {
			taskComments = task.Task_notes.split(commentRegex) // Split at each keyword (Commented by, Created by, etc.)
				.map((comment) => comment.trim()) // Trim each comment block
				.map(
					(comment) => comment.replace(/(Dated on: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/, '\n$1') // Ensure date has a line break before it
				)
				.map((comment) => comment.replace(/\n{2,}/g, '\n')) // Remove extra newlines within each comment
				.join('\n\n'); // Join each comment block with a double newline
		} else {
			taskComments = ''; // Default to empty string if no comments
		}
	}

	async function sendEmail() {
		try {
			// Make a POST request to the email sending API
			const response = await axios.post(
				'http://localhost:3000/api/users/send-email',
				{
					appAcronym,
					taskName: edittaskName,
					taskId: editabletaskId
				},
				{ withCredentials: true }
			);

			// Handle the response
			if (response.status === 200) {
				console.log('Email sent successfully:', response.data);
				alertSuccess('Email sent successfully!');
			} else {
				console.error('Error sending email:', response.data);
				alertError('Error sending email.');
			}
		} catch (error) {
			console.error('Error occurred while sending email:', error);
			alertError('Error occurred while sending email.');
		}
	}

	async function handleReleaseTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitOpen();

			console.log('hasPermission:', hasPermission);

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to release this task.');
				redirectToApps();
				return; // Stop further execution
			}

			if (edittaskPlan === '') {
				edittaskPlan = null;
			}

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
			const promotionNote = `Released by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			// Close the task handling
			handleCloseTask();
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleTakeOnTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitToDo();

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to take on this task.');
				redirectToApps();
				// Redirect user to login page or handle the session logout
				return; // Stop further execution
			}

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
			const promotionNote = `Take on by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			handleCloseTask();
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleToReviewTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitDoing();

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to submit this task for review.');
				redirectToApps();
				// Redirect user to login page or handle the session logout
				return; // Stop further execution
			}

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
			const promotionNote = `Submitted to review by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();
			handleCloseTask();

			// Send an email notification after updating the task
			await sendEmail(); // Make sure sendEmail is defined and returns a promise
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleForfeitTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitDoing();

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to forfeit this task.');
				redirectToApps();
				// Redirect user to login page or handle the session logout
				return; // Stop further execution
			}

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
			const promotionNote = `Forfeited by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			handleCloseTask();
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleApproveTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitDone();

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to approve this task.');
				redirectToApps();
				// Redirect user to login page or handle the session logout
				return; // Stop further execution
			}
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
			const promotionNote = `Approved by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask();

			handleCloseTask();
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleRejectTask() {
		try {
			// Await the result of checkpermitOpen and act accordingly
			const hasPermission = await checkpermitDone();

			console.log('hasPermission:', hasPermission);

			// If the user does not have permission, redirect to the login page
			if (!hasPermission) {
				alertError('You do not have permission to reject this task.');
				redirectToApps();
				// Redirect user to login page or handle the session logout
				return; // Stop further execution
			}

			if (edittaskPlan === '') {
				edittaskPlan = null;
			}

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
			const promotionNote = `Rejected by: ${username} Dated on: ${formattedDateTime} Current State: ${edittaskState}\n`;

			// Check if there are existing task notes
			if (taskNotes && taskNotes.trim() !== '') {
				// Append to existing task notes
				taskNotes = `${taskNotes}\n${promotionNote}`;
			} else {
				// If no existing notes, set taskNotes to the promotion note
				taskNotes = promotionNote;
			}

			taskOwner = previoustaskOwner;

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask(taskOwner);

			handleCloseTask();
		} catch (error) {
			console.error('Error releasing task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	async function handleUpdateTask() {
		try {
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

			if (edittaskPlan === '') {
				edittaskPlan = null;
			}

			// Determine the current task state (assuming you have a variable for this)
			const taskState = edittaskState; // Implement this function to retrieve the current state

			let hasPermission;

			// Check permissions based on the current state
			switch (taskState) {
				case 'Open':
					hasPermission = await checkpermitOpen();
					if (!hasPermission) {
						alertError('You do not have permission to update this task.');
						redirectToApps();
						return; // Stop further execution
					}
					break;

				case 'Todo':
					hasPermission = await checkpermitToDo();
					if (!hasPermission) {
						alertError('You do not have permission to update this task.');
						redirectToApps();
						return; // Stop further execution
					}
					break;

				case 'Doing':
					hasPermission = await checkpermitDoing();
					if (!hasPermission) {
						alertError('You do not have permission to update this task.');
						redirectToApps();
						return; // Stop further execution
					}
					break;

				case 'Done':
					hasPermission = await checkpermitDone();
					if (!hasPermission) {
						alertError('You do not have permission to update this task.');
						redirectToApps();
						return; // Stop further execution
					}
					break;

				default:
					return; // Stop further execution
			}

			// If we reach here, the user has the required permission for the current task state
			taskOwner = previoustaskOwner;

			// Await the updateTask function to ensure it's completed before proceeding
			await updateTask(taskOwner);
			handleCloseTask();
		} catch (error) {
			console.error('Error updating task:', error);
			// Optionally, handle the error here (e.g., show an alert or message)
		}
	}

	const updateTask = async () => {
		if (!edittaskName) {
			alertError('Please enter a task name.');
			return;
		}
		if (!validateTaskName(edittaskName)) {
			alertError(
				'Task name can only be alphanumeric, including spaces and special characters. Max length is 255 characters.'
			);
			return;
		}

		if (!taskPlan) {
			taskPlan = null; // Set taskPlan to null if not provided
		}

		try {
			// Send updated task data to the server
			const response = await axios.put(
				'http://localhost:3000/api/users/editTask',
				{
					taskId: editabletaskId,
					taskPlan: edittaskPlan,
					taskName: edittaskName,
					taskDescription,
					taskNotes,
					taskState: edittaskState,
					taskOwner
				},
				{ withCredentials: true }
			);

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
			} else if (
				(error.response && error.response.status === 401) ||
				error.response.status === 403
			) {
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
					{#if state === 'open' && permitCreateGroup}
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
		<Toaster richColors style="z-index: 12;" />
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
								>System Auto Generated</span
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
								class="inputdescription"
								id="taskDescription"
								bind:value={taskDescription}
								style="border:1px solid #000"
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
							<span class="task-input" id="taskState" type="text" placeholder="Task State" readonly
								>{taskState}</span
							>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskCreator">Task Creator:</label>
							<span
								class="task-input"
								id="taskCreator"
								type="text"
								placeholder="Task Creator"
								readonly
							>
								{taskCreator}
							</span>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskOwner">Task Owner:</label>
							<span class="task-input" id="taskOwner" type="text" placeholder="Task Owner" readonly
								>{taskOwner}</span
							>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskcreateDate">Task Create Date:</label>
							<span class="task-input" id="taskcreateDate" type="date" readonly
								>{taskcreateDate}</span
							>
						</div>
					</div>
				</div>

				<!-- Right Side -->
				<div class="right-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<label for="notes">Notes:</label>
						<span class="notes-label">{taskNotes}</span>
						<textarea
							class="inputdescription"
							id="comments"
							bind:value={taskNotes}
							style="border:1px solid #000"
							placeholder="Comments"
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

	<!-- view/edit model -->
	{#if showEditModal}
		<Toaster richColors style="z-index: 12;" />
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
								bind:value={edittaskName}
								placeholder="Task Name"
								disabled={edittaskState === 'Closed' ||
									edittaskState === 'Todo' ||
									edittaskState === 'Doing' ||
									edittaskState === 'Done' ||
									edittaskState === 'Open'}
							/>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskDescription">Task Description:</label>
							<textarea
								class="inputdescription"
								id="taskDescription"
								bind:value={taskDescription}
								placeholder="Description"
								style="border:1px solid #000"
								disabled={edittaskState === 'Closed' ||
									edittaskState === 'Todo' ||
									edittaskState === 'Doing' ||
									edittaskState === 'Done' ||
									edittaskState === 'Open'}
							></textarea>
						</div>
					</div>

					<div class="form-group">
						<div class="task-row">
							<label for="edittaskPlan">Plan Name:</label>
							<select
								id="edittaskPlan"
								bind:value={edittaskPlan}
								disabled={edittaskState === 'Closed' ||
									edittaskState === 'Todo' ||
									edittaskState === 'Doing' ||
									(edittaskState === 'Open' && !permitOpenGroup) ||
									(edittaskState === 'Done' && !permitDoneGroup)}
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
							<span
								class="task-input"
								id="edittaskState"
								type="text"
								placeholder="Task State"
								readonly>{edittaskState}</span
							>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskCreator">Task Creator:</label>
							<span
								class="task-input"
								id="taskCreator"
								type="text"
								placeholder="Task Creator"
								readonly>{taskCreator}</span
							>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskOwner">Task Owner:</label>
							<span class="task-input" id="taskOwner" type="text" placeholder="Task Owner" readonly>
								<!-- {#if edittaskState === 'Doing'}
									{previoustaskOwner}								
								{:else} -->
								<!-- TO IMPLEMENT???? -->
								{taskOwner}
								<!-- {/if} -->
							</span>
						</div>
					</div>
					<div class="form-group">
						<div class="task-row">
							<label for="taskcreateDate">Task Create Date:</label>
							<span class="task-input" id="taskcreateDate" type="date" readonly
								>{taskcreateDate}</span
							>
						</div>
					</div>
				</div>

				<!-- Right Side -->
				<div class="right-side" style="flex: 1; padding: 20px;">
					<div class="form-group">
						<label for="notes">Notes:</label>
						<!-- Use a div instead of span and apply the white-space CSS -->
						<div class="notes-label" style="white-space: pre-line;">{taskComments}</div>
						<textarea
							class="inputdescription"
							id="comments"
							bind:value={taskNotes}
							placeholder="Comments"
							style="border:1px solid #000"
							disabled={edittaskState === 'Closed' ||
								(edittaskState === 'Open' && !permitOpenGroup) ||
								(edittaskState === 'Todo' && !permitToDoGroup) ||
								(edittaskState === 'Doing' && !permitDoingGroup) ||
								(edittaskState === 'Done' && !permitDoneGroup)}
						></textarea>
					</div>
				</div>
			</div>

			<div class="modal-actions" style="margin-top: 20px;">
				{#if edittaskState === 'Closed'}
					<button on:click={handleCloseTask}>Close</button>
				{:else if edittaskState === 'Open' && permitOpenGroup}
					<button style="background-color: green;" on:click={handleReleaseTask}>Release Task</button
					>
					<button on:click={handleUpdateTask}>Save Changes</button>
				{:else if edittaskState === 'Todo' && permitToDoGroup}
					<button style="background-color: green;" on:click={handleTakeOnTask}>Take On</button>
					<button on:click={handleUpdateTask}>Save Changes</button>
				{:else if edittaskState === 'Doing' && permitDoingGroup}
					<!-- && previoustaskOwner === username 							TO IMPLEMENT????-->
					<button style="background-color: green;" on:click={handleToReviewTask}>To Review</button>
					<button style="background-color: red;" on:click={handleForfeitTask}>Forfeit Task</button>
					<button on:click={handleUpdateTask}>Save Changes</button>
				{:else if edittaskState === 'Done' && permitDoneGroup}
					<button
						style="background-color: green;"
						on:click={handleApproveTask}
						disabled={taskPlanHasChanges}>Approve Task</button
					>
					<button style="background-color: red;" on:click={handleRejectTask}>Reject Task</button>
					<button on:click={handleUpdateTask} disabled={taskPlanHasChanges}>Save Changes</button>
				{/if}

				{#if edittaskState !== 'Closed'}
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
		max-width: 100%; /* Maximum width for the modal */
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

	input[type='text'],
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

	textarea {
		width: 100%; /* Ensure textarea fills the available width */
		padding: 8px; /* Adjust padding for better aesthetics */
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		resize: vertical;
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
		overflow-y: auto;
		height: 400px;
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

	input[disabled],
	textarea[disabled],
	select[disabled] {
		color: black; /* Change text color to black */
		font-weight: bolder;
		background-color: #fff; /* Light background for better contrast */
		border: none;
		cursor: not-allowed; /* Change cursor to indicate it's disabled */
	}

	button:disabled {
		filter: brightness(70%); /* Darkens the color to give a 'disabled' effect */
		color: #fff; /* You can adjust the text color */
		cursor: not-allowed; /* Show not-allowed cursor */
		opacity: 0.6; /* Make it more translucent to give a 'blurred' effect */
		box-shadow: none; /* Remove any shadow or effects */
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
</style>

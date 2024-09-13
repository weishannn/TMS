<script>
	// @ts-nocheck
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';
	import UserList from './CreateUserList.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import { refreshUserList } from '../stores/updateStore';
</script>

<div class="container">
	<Toaster />
	<!-- Include the Toaster component here -->
	<div class="content">
		<h1>Applications</h1>
		<button on:click>+ CREATE APP</button>
	</div>
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

	.content {
		padding: 0.5em 1em;
		color: #000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 50px;
		margin-top: 20px;
	}
</style>

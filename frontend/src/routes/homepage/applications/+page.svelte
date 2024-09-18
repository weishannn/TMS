<script>
	// @ts-nocheck
	import HomePageNAV from '$lib/HomePage-NAV.svelte';
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';
</script>

<body style="margin:0;padding:0">
	<HomePageNAV />

	<div class="container">
		<div class="content">
			<h1>Applications</h1>
			<button on:click>+ CREATE APP</button>
		</div>
	</div>
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
</style>

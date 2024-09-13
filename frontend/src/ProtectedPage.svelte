<script>
	import { onMount } from 'svelte';
	import { navigate } from 'svelte-routing'; // Use navigate for redirection

	const PROTECTED_ROUTE = 'http://localhost:5000/api/users/protected-route';

	let data = null;
	let error = null;

	onMount(async () => {
		try {
			const token = localStorage.getItem('token'); // Retrieve the JWT token
			const response = await fetch(PROTECTED_ROUTE, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.status === 401 || response.status === 403) {
				// Redirect to login page if the token is invalid or expired
				navigate('/login');
			} else if (response.ok) {
				data = await response.json(); // Process the data
			} else {
				throw new Error('An unexpected error occurred');
			}
		} catch (err) {
			error = err.message;
		}
	});
</script>

{#if error}
	<p>{error}</p>
{:else if data}
	<pre>{JSON.stringify(data, null, 2)}</pre>
	<!-- Display fetched data -->
{:else}
	<p>Loading...</p>
{/if}

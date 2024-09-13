<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Replace this condition with your actual logic
		const shouldRedirect = true; // or some condition to check

		if (shouldRedirect) {
			goto('/login');
		}
	});
</script>

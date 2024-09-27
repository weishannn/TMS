<script>
	// @ts-nocheck
	import TMS from '$lib/TMS.svelte';
	import { appStore } from '../../../../stores/updateStore';
	import HomePageNav from '$lib/HomePage-NAV.svelte';

	let selectedAppDetails = null;
	let username = '';
	let inTMS = false;
	let isInGroupPL = false;
	let isInGroupPM = false;

	const unsubscribe = appStore.subscribe((value) => {
		selectedAppDetails = value.selectedAppDetails;
		username = value.username;
		inTMS = value.inTMS;
		isInGroupPL = value.isInGroupPL;
		isInGroupPM = value.isInGroupPM;
	});
</script>

{#if inTMS}
	<TMS {selectedAppDetails} {inTMS} {username} {isInGroupPM} />
{:else}
	<HomePageNav />
	<h1>No Application Selected.</h1>
	<h1>Please Select an Application to View.</h1>
{/if}

<style>
	h1 {
		color: red;
		text-align: center;
	}
</style>

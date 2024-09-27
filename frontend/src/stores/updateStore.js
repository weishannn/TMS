import { writable } from 'svelte/store';

export const refreshUserList = writable(false);

export const appStore = writable({
	selectedAppDetails: null,
	username: '',
	inTMS: false,
	isInGroupPL: false,
	isInGroupPM: false
});

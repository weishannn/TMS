export async function load({ params }) {
	const { appAcronym } = params;
	console.log('Params:', params); // Log to check the params

	return {
		appAcronym
	};
}

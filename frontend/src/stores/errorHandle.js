import { toast } from 'svelte-sonner';

// Function to handle a general error message
export function alertError(error) {
	toast.error(`Error: ${error || 'Server Error!'}`);
}

export function alertSuccess(success) {
	toast.success(`${success || 'Server Error!'}`);
}

// // Function for handling specific error scenarios
// export function alertNetworkError() {
// 	toast.error('Network error: Please check your connection.');
// }

// export function alertUnauthorizedError() {
// 	toast.error('Unauthorized: You do not have permission to access this resource.');
// }

// export function alertValidationError(field) {
// 	toast.error(`Validation error: ${field} is invalid.`);
// }

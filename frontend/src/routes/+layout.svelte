<script>
	import { alertError, alertSuccess } from '../stores/errorHandle';
	import { toast, Toaster } from 'svelte-sonner';
</script>

<Toaster richColors style="z-index: 12;" />
<slot></slot>

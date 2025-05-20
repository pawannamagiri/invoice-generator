<script>
	import Button from '$lib/components/Button.svelte';
</script>

<svelte:head>
	<title>Invoices | Invoice Generator</title>
</svelte:head>

<div class="invoices-page">
	<h1>Invoices</h1>
	
	<div class="actions">
		<Button variant="primary">Create New Invoice</Button>
	</div>
	
	<div class="invoice-list">
		<p>No invoices found. Create your first invoice to get started!</p>
	</div>
</div>

<style>
	.invoices-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	h1 {
		color: #4a4a4a;
		margin-bottom: 2rem;
	}
	
	.actions {
		margin-bottom: 2rem;
	}
	
	.invoice-list {
		background-color: #f9f9f9;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
</style>
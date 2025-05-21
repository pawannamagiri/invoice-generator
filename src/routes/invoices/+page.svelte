<script>
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';

	let invoices = [];
	let loading = true;
	let error = null;

	// Format date to a readable string
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Fetch all invoices
	async function fetchInvoices() {
		try {
			loading = true;
			const response = await fetch('/api/invoices');

			if (!response.ok) {
				throw new Error('Failed to fetch invoices');
			}

			invoices = await response.json();
		} catch (err) {
			console.error('Error fetching invoices:', err);
			error = err.message;
		} finally {
			loading = false;
		}
	}

	// Delete an invoice
	async function deleteInvoice(id) {
		if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
			try {
				const response = await fetch(`/api/invoices?id=${id}`, {
					method: 'DELETE'
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || 'Failed to delete invoice');
				}

				// Refresh the invoice list
				await fetchInvoices();
			} catch (err) {
				console.error('Error deleting invoice:', err);
				alert('Failed to delete invoice: ' + err.message);
			}
		}
	}

	// View full invoice
	function viewInvoice(id) {
		goto(`/generateInvoice?id=${id}`);
	}

	// Create new invoice
	function createNewInvoice() {
		goto('/generateInvoice');
	}

	onMount(fetchInvoices);
</script>

<svelte:head>
	<title>Invoices | Invoice Generator</title>
</svelte:head>

<div class="invoices-page">
	<h1 class="text-3xl">Invoices</h1>

	<div class="actions">
		<Button variant="primary" on:click={createNewInvoice}>Create New Invoice</Button>
	</div>

	<div class="invoice-list">
		{#if loading}
			<p class="text-center py-4">Loading invoices...</p>
		{:else if error}
			<div class="error-message">
				<p>Error: {error}</p>
				<button on:click={fetchInvoices} class="retry-button">Retry</button>
			</div>
		{:else if invoices.length === 0}
			<p>No invoices found. Create your first invoice to get started!</p>
		{:else}
			<table class="invoice-table">
				<thead>
					<tr>
						<th>Invoice Number</th>
						<th>Customer</th>
						<th>Total Amount</th>
						<th>Date</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each invoices as invoice}
						<tr>
							<td>{invoice.invoiceNo}</td>
							<td>{invoice.billTo?.name || 'N/A'}</td>
							<td>₹{invoice.totalAfterTax?.toFixed(2) || '0.00'}</td>
							<td>{formatDate(invoice.created_at)}</td>
							<td class="actions-cell">
								<button 
									on:click={() => viewInvoice(invoice._id)} 
									class="view-button"
									title="View full invoice"
								>
									View
								</button>
								<button 
									on:click={() => deleteInvoice(invoice._id)} 
									class="delete-button"
									title="Delete invoice"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
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

	.invoice-table {
		width: 100%;
		border-collapse: collapse;
	}

	.invoice-table th, .invoice-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
	}

	.invoice-table th {
		font-weight: 600;
		background-color: #f1f5f9;
	}

	.actions-cell {
		display: flex;
		gap: 0.5rem;
	}

	.view-button {
		background-color: #3b82f6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		cursor: pointer;
	}

	.view-button:hover {
		background-color: #2563eb;
	}

	.delete-button {
		background-color: #ef4444;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		cursor: pointer;
	}

	.delete-button:hover {
		background-color: #dc2626;
	}

	.error-message {
		color: #ef4444;
		padding: 1rem;
		border: 1px solid #ef4444;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
	}

	.retry-button {
		background-color: #3b82f6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		cursor: pointer;
		margin-top: 0.5rem;
	}
</style>

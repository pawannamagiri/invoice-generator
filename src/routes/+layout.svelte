<script>
	// Your layout script goes here
	import "../app.css";
</script>

<div class="app">
	<header>
		<div class="corner">
			<!-- Logo or corner content -->
		</div>

		<nav>
			<a href="/">Home</a>
			<a href="/invoices">Invoices</a>
			<a href="/customers">Customers</a>
			<a href="/products">Products</a>
			<a href="generateInvoice">New Invoice</a>
		</nav>

		<div class="corner">
			<!-- Right corner content -->
		</div>
	</header>

	<main>
		<slot></slot>
	</main>

	<footer>
		<p>© 2025 Invoice Generator</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: #f9f9f9;
		border-bottom: 1px solid #eaeaea;
	}

	.corner {
		width: 3rem;
		height: 3rem;
	}

	nav {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	nav a {
		text-decoration: none;
		color: #333;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	nav a:hover {
		background-color: #eaeaea;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background-color: #f9f9f9;
		border-top: 1px solid #eaeaea;
	}
</style>

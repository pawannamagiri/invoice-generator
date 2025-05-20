<script>
	// Your script goes here
</script>

<main class="font-sans max-w-3xl mx-auto p-8">
	<h1 class="text-2xl font-bold text-gray-700 text-center mb-4">Invoice Generator</h1>
	<p class="text-gray-600 text-center mb-8">Welcome to the Invoice Generator application built with SvelteKit!</p>

	<div class="mt-8 p-6 bg-blue-50 rounded-lg shadow-md mb-8">
		<p class="text-blue-600 mb-4">This page is now styled with Tailwind CSS and Tailwind Forms!</p>

		<form class="space-y-6">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
				<input type="text" id="name" name="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input type="email" id="email" name="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
			</div>

			<div>
				<label for="message" class="block text-sm font-medium text-gray-700">Message</label>
				<textarea id="message" name="message" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700">Notification Preferences</label>
				<div class="mt-2 space-y-2">
					<div class="flex items-center">
						<input id="email-notifications" name="notifications" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
						<label for="email-notifications" class="ml-2 block text-sm text-gray-700">Email notifications</label>
					</div>
					<div class="flex items-center">
						<input id="sms-notifications" name="notifications" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
						<label for="sms-notifications" class="ml-2 block text-sm text-gray-700">SMS notifications</label>
					</div>
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700">Invoice Type</label>
				<select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
					<option>Standard</option>
					<option>Premium</option>
					<option>Custom</option>
				</select>
			</div>

			<div>
				<button type="submit" class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
					Submit
				</button>
			</div>
		</form>
	</div>
</main>

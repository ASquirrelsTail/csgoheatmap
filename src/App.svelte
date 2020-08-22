<script>
	import Upload from './svelte/Upload.svelte';
	import Filters from './svelte/Filters.svelte';
	import Toasts from './svelte/Toasts.svelte';
</script>

<header>
	<h1>CSGO Scopes</h1>
	<div>
		<Upload />
	</div>
</header>
<main>
	<Filters />
	
</main>

<Toasts />

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid #273233;
	}

	h1 {
		color: #ff3e00;
		padding-left: 1rem;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
		margin: 0;
	}

	hr {
		margin-top: 0;
	}


</style>
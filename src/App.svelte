<script>
	import Upload from './svelte/Upload.svelte';
	import HeatMap from './svelte/HeatMap.svelte';
	import Filters from './svelte/Filters.svelte';
	import Toasts from './svelte/Toasts.svelte';
</script>

<h1>CSGO Scopes</h1>

<hr>

<main>
	<Upload />
	<Filters />

	<div>
	  <HeatMap />
	</div>
</main>

<Toasts />

<style>
	main {
		text-align: center;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		padding-left: 1rem;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
		margin: 0;
	}

	hr {
		margin-top: 0;
	}
</style>
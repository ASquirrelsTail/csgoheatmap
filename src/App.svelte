<script>
	import Upload from './svelte/Upload.svelte';
	import HeatMap from './svelte/HeatMap.svelte';
	import Filters from './svelte/Filters.svelte';
	import Toasts from './svelte/Toasts.svelte';
</script>

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
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
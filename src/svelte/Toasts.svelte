<script>
  import { fade, fly } from 'svelte/transition';
  import { toasts } from '../store.js';
</script>

<div class="toast-container">
  {#each $toasts as toast (toast)}
    <div class="toast {toast.type}" in:fly="{{ y: 200, duration: 300 }}" out:fade>
      {toast.message}
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 0px;
    right: 0px;
    padding-right: 0.2rem;
  }
</style>
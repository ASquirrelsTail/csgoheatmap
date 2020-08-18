<script>
  import simpleheat from 'simpleheat';
  import { onMount } from 'svelte';
  import mapData from '../mapdata.js';
  import { points, mapName } from '../store.js'
  export let density = 3;

  let canvas;
  let heat;

  let displaySetting = 'heat'

  let scale = 10;
  let offsetX = 204;
  let offsetY = 387;

  onMount(() => {
    heat = simpleheat(canvas);
    heat.radius(5, 2);
    heat.max(density);
  });

  function drawPoints() {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, 500, 500);
    $points.forEach(point => {
      ctx.fillRect(Math.floor(point.x/scale + offsetX), Math.floor(-point.y/scale + offsetY), 1, 1);
    });
  }

  $: if(heat && $points) { // If points changes redraw
    if (displaySetting === 'heat') {
      heat.data($points.map(point => [point.x/scale + offsetX, -point.y/scale + offsetY, 1]));
      heat.draw();
    } else drawPoints();
    
    
  }

  $: if ($mapName && mapData[$mapName]) { // If map changes update scale and offset
    scale = mapData[$mapName].s;
    offsetX = mapData[$mapName].x;
    offsetY = mapData[$mapName].y;
  }

  $: if (heat) {
    heat.max(density); // If density changes redraw
    if (displaySetting === 'heat') heat.draw();
  }

</script>

<div>
  <canvas width=500 height=500 bind:this={canvas}
  style="background-image: {mapData[$mapName] ? `url(./images/${$mapName}.jpg)` : 'none'};"></canvas>
</div>

<div class="settings">
  <select name="display" bind:value={displaySetting}>
    <option value="heat">Heatmap</option>
    <option value="points">Points</option>
  </select>
  {#if displaySetting === 'heat'}
  <button on:click="{() => density += 1}">Gain Down</button>
  <button on:click="{() => density = Math.max(density - 1, 2)}">Gain Up</button>
  {/if}
</div>

<div id="scales">
  <label for="scale">Scale:</label><input type="number" id="scale" bind:value={scale}>
  <label for="offset-x">Offset X:</label><input type="number" id="offset-x" bind:value={offsetX}>
  <label for="offset-y">Offset Y:</label><input type="number" id="offset-y" bind:value={offsetY}>
  <label for="density">Density:</label><input type="number" id="density" bind:value={density}>
</div>

<style>
  canvas {
    background-size: cover;
    background-color: black;
  }

  #scales {
    display: none;
  }

  #scales input {
    width: 5em;
    margin-right: 1em;
    text-align: center;
  }

  #scales label {
    display: inline-block;
    padding-right: 0.3em;
  }
</style>

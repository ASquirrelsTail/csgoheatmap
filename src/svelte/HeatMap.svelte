<script>
  import simpleheat from 'simpleheat';
  import { onMount } from 'svelte';
  import mapData from '../mapdata.js';
  import { points, mapName } from '../store.js'

  let canvas;
  let heat;

  let displaySetting = 'heat'
  let gain = {heat: 3, shots: 8};

  let scale = 10;
  let offsetX = 204;
  let offsetY = 387;

  function translateCoords(position) {
    return [Math.floor(position[0]/scale + offsetX),
            Math.floor(-position[1]/scale + offsetY)]
  }

  onMount(() => {
    heat = simpleheat(canvas);
    heat.radius(5, 2);
    heat.max(gain);
  });

  function drawPoints() {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, 500, 500);
    $points.forEach(point => {
      ctx.fillRect(...translateCoords(point.pp), 1, 1);
    });
  }

  function drawShots() {
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, 500, 500);
    $points.forEach(point => {
      ctx.globalAlpha = (point.d ? Math.max(point.d/100, 1) : 1) / gain.shots;
      const playerPos = translateCoords(point.pp);
      if (point.ap) {
        const attackerPos = translateCoords(point.ap);
        const gradient = ctx.createLinearGradient(...playerPos, ...attackerPos);
        gradient.addColorStop('0', '#f73503');
        gradient.addColorStop('0.5', '#d8d50f');
        gradient.addColorStop('1' ,'#19c917');
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(...attackerPos);
        ctx.lineTo(...playerPos);
        ctx.stroke();
      } else {
        // Draw grenades as Xs
        ctx.strokeStyle = '#f73503';
        ctx.beginPath();
        ctx.moveTo(playerPos[0] - 2, playerPos[1] - 2);
        ctx.lineTo(playerPos[0] + 2, playerPos[1] + 2);
        ctx.moveTo(playerPos[0] + 2, playerPos[1] - 2);
        ctx.lineTo(playerPos[0] - 2, playerPos[1] + 2);
        ctx.stroke();
      }
    });
  }

  $: if (heat && $points) { // If points changes redraw
    if ($mapName && mapData[$mapName]) { // Update scale and offset
        scale = mapData[$mapName].s;
        offsetX = mapData[$mapName].x;
        offsetY = mapData[$mapName].y;
      }
    if (displaySetting === 'heat') {
      heat.data($points.map(point => [...translateCoords(point.pp),
                                      point.d ? Math.max(point.d/100, 1) : 1]));
      heat.draw();
    } else if (displaySetting === 'points') drawPoints();
    else drawShots();
  }

  $: if (heat) {
    heat.max(gain.heat); // If gain changes redraw
    if (displaySetting === 'heat') heat.draw();
    if (displaySetting === 'shots') drawShots();
  }

</script>

<div>
  <canvas width=500 height=500 bind:this={canvas}
  style="background-image: {mapData[$mapName] ? `url(./images/${$mapName}.jpg)` : 'none'};"></canvas>
</div>

<div class="settings">
  <select name="display" bind:value={displaySetting}>
    <option value="heat">Heatmap</option>
    <option value="shots">Shots</option>
    <option value="points">Points</option>
  </select>
  <button on:click="{() => gain[displaySetting] += 1}" disabled="{displaySetting === 'points'}">
    Gain Down
  </button>
  <button on:click="{() => gain[displaySetting] = Math.max(gain[displaySetting] - 1, 2)}"
     disabled="{displaySetting === 'points'}">
    Gain Up
  </button>
  <button on:click="{() => gain[displaySetting] = displaySetting === 'heat' ? 3 : 8}"
    disabled="{displaySetting === 'points'}">
    Gain Reset
  </button>
</div>

<div id="scales">
  <label for="scale">Scale:</label><input type="number" id="scale" bind:value={scale}>
  <label for="offset-x">Offset X:</label><input type="number" id="offset-x" bind:value={offsetX}>
  <label for="offset-y">Offset Y:</label><input type="number" id="offset-y" bind:value={offsetY}>
  <label for="gain">Gain:</label><input type="number" id="gain" bind:value={gain}>
</div>

<style>
  canvas {
    background-size: cover;
    background-color: black;
    border-radius: 1rem;
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

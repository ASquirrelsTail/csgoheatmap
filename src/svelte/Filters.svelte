<script>
  import { parsedFiles, points, mapName} from '../store.js'
  import mapData from '../mapdata.js';

  let selectedFiles = [];
  let filesToFilter = [];
  let maps = new Set();
  let players = [];
  let selectedPlayer;
  let group = 0;

  let kills = false;
  let team;

  function filterMaps(files) {
    return files.filter(file => file.mapName === $mapName);
  }

  function filterPlayer(files) {
    if (selectedPlayer) {
      if (group === 0) {
        let  deaths = [].concat(...files.map(file => file.deaths));
        if (kills) return deaths.filter(death => death.killer === selectedPlayer);
        else return deaths.filter(death => death.player === selectedPlayer);
      }else{
        return [].concat(...files.filter(file => selectedPlayer in file.players).map(file => {
          let playerTeam;
          if (group === 1) playerTeam = file.players[selectedPlayer].team;
          else playerTeam = (file.players[selectedPlayer].team + 1) % 2;
          let teamPlayers = Object.keys(file.players)
                                  .filter(playerId => file.players[playerId].team === playerTeam)
                                  .map(playerId => parseInt(playerId));
          if (kills)
            return file.deaths.filter(death => teamPlayers.includes(death.killer))
          else
            return file.deaths.filter(death => teamPlayers.includes(death.player))
        }));
      }
    } else return [].concat(...files.map(file => file.deaths));
  }

  function filterTeam(deaths) {
    if (team === 0 || team === 1) return deaths.filter(death => death.playerTeam === (kills + team) % 2);
    else return deaths;
  }

  function runFilters() {
    filesToFilter = selectedFiles.length ? selectedFiles : $parsedFiles;
    $points = filterTeam(filterPlayer(filterMaps(filesToFilter)))
                .map(death => death.position)
  }

  $: {
    filesToFilter = selectedFiles.length ? selectedFiles : $parsedFiles;
    maps = new Set(filesToFilter.map(file => file.mapName));
    if ((!$mapName || !maps.has($mapName)) && filesToFilter.length > 0) $mapName = filesToFilter[0].mapName;
    players = Object.entries(Object.assign({}, ...filesToFilter.map(file => file.players)))
      .map(player => { return {id: parseInt(player[0]), name: player[1].name}})
      .filter(player => player.id > 40);
    if (!players.some(player => player.id === selectedPlayer)) selectedPlayer = false;
    runFilters();
  }

</script>

<label for="files">Demo Files</label>
<select multiple id="files" bind:value={selectedFiles} on:change={runFilters}>
  {#each $parsedFiles as file}
    <option value={file}>
      {file.fileName} - {file.mapName}
    </option>
  {/each}
</select>

<label for="map">Map:</label>
<select id="map" bind:value={$mapName} on:change={runFilters}>
  {#each Object.keys(mapData) as map}
    <option value={map} disabled={!maps.has(map)}>
      {map}
    </option>
  {/each}
</select>

<br>

<label for="players">Players</label>
<select id="players" bind:value={selectedPlayer} on:change={runFilters}>
  <option value={false}>All</option>
  {#each players as player}
    <option value={player.id}>
      {player.name}
    </option>
  {/each}
</select>
<button on:click="{() => {group = 0; runFilters()}}" disabled={!selectedPlayer}
  class:selected="{selectedPlayer && group === 0}">Solo</button>
<button on:click="{() => {group = 1; runFilters()}}" disabled={!selectedPlayer}
  class:selected="{selectedPlayer && group === 1}">Team</button>
<button on:click="{() => {group = 2; runFilters()}}" disabled={!selectedPlayer}
  class:selected="{selectedPlayer && group === 2}">Opponents</button>

<br>

<button on:click="{() => {kills = true; runFilters()}}" class:selected={kills}>Kills</button>
<button on:click="{() => {kills = false; runFilters()}}" class:selected={!kills}>Deaths</button>

<br>

<button on:click="{() => {team = 0; runFilters()}}" class:selected="{team === 0}">T</button>
<button on:click="{() => {team = 1; runFilters()}}" class:selected="{team === 1}">CT</button>
<button on:click="{() => {team = null; runFilters()}}" class:selected="{team !== 0 && team !== 1}">All</button>

<style>
  .selected {
    background-color: #99ff66;
  }
</style>
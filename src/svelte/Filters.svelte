<script>
  import HeatMap from './HeatMap.svelte';
  import { parsedFiles, points, mapName} from '../store.js'
  import mapData from '../mapdata.js';

  let selectedFiles = [];
  let filesToFilter = [];
  let maps = new Set();
  let players = [];
  let selectedPlayer;
  let group = 0;

  let metric = 2;
  let team = false;

  let total = 0;
  let games = 0;
  let wins = 0;
  let rounds = 0;
  let roundWins = 0;

  function runFilters() {
    const metricSet = metric % 2 ? 'hits' : 'deaths';
    const dealt = !Math.floor(metric / 2);
    const role = dealt ? 'a' : 'p';

    const filteredFiles = filesToFilter.filter(file => file.mapName === $mapName &&
                              (!selectedPlayer || selectedPlayer in file.players));
    
    // If a specific player's team or opponents are selected
    if (selectedPlayer && group > 0) {
      $points = [].concat(...filteredFiles.map(file => {
        let playerTeam;
        if (group === 1) playerTeam = file.players[selectedPlayer].team;
        else playerTeam = (file.players[selectedPlayer].team + 1) % 2;
        let teamPlayers = Object.keys(file.players)
                                .filter(playerId => file.players[playerId].team === playerTeam)
                                .map(playerId => parseInt(playerId));
        if (team === false) // Use all team data
          return file[metricSet][0].concat(file[metricSet][1])
                                   .filter(event => teamPlayers.includes(event[role]));
        else // Select team
          return file[metricSet][(dealt + team) % 2].filter(event => teamPlayers.includes(event[role])); 
      }));
    } else {
      // Select events type, deaths/hits and team, t/ct/all
      let events;
      if (team === false) // Use all team data
        events = filteredFiles.map(file => file[metricSet][0].concat(file[metricSet][1]));
      else // Select team
        events = filteredFiles.map(file => file[metricSet][(dealt + team) % 2]); // Invert team if we are looking at damage dealt
      if (selectedPlayer) $points = [].concat(...events).filter(event => event[role] === selectedPlayer);
      else $points = [].concat(...events)
    }
    
    // Pull stats
    total = $points.reduce((acc, point) => acc + (point.d ? point.d : 1), 0);
    games = filteredFiles.length;
    if (!selectedPlayer) {
      rounds = filteredFiles.reduce((acc, game) => acc + game.rounds, 0);
      wins = false;
      roundWins = false;
    } else {
      wins = filteredFiles.reduce((acc, game) =>
                ((game.players[selectedPlayer].team === game.winner && group !== 2) ||
                 (game.players[selectedPlayer].team !== game.winner && group === 2)) ?
                acc + 1 : acc, 0);
      if (team === false) {
        rounds = filteredFiles.reduce((acc, game) => acc + game.rounds, 0);
        roundWins = filteredFiles.reduce((acc, game) => {
          let playerTeam;
          if (group === 2) playerTeam = (game.players[selectedPlayer].team + 1) % 2;
          else playerTeam = game.players[selectedPlayer].team;
          return game.scores[playerTeam].ct + game.scores[playerTeam].t + acc;
        }, 0);
      } else {
        rounds = filteredFiles.reduce((acc, game) => {
          if (game.rounds < 15) {
            if ((team === game.players[selectedPlayer].team && group !== 2) ||
                (team !== game.players[selectedPlayer].team && group === 2))
              return acc + game.rounds;
            else return acc;
          }
          if ((team !== game.players[selectedPlayer].team && group !== 2) ||
              (team === game.players[selectedPlayer].team && group === 2))
            return 15 + acc;
          else return game.rounds - 15 + acc;
        }, 0);
        roundWins = filteredFiles.reduce((acc, game) => {
          let playerTeam;
          if (group === 2) playerTeam = (game.players[selectedPlayer].team + 1) % 2;
          else playerTeam = game.players[selectedPlayer].team;
          return (team === 1 ? game.scores[playerTeam].ct : game.scores[playerTeam].t) + acc;
        }, 0);
      }
    }
  }

  $: {
    filesToFilter = selectedFiles.length ? selectedFiles : $parsedFiles;
    maps = new Set(filesToFilter.map(file => file.mapName));
    if ((!$mapName || !maps.has($mapName)) && filesToFilter.length > 0) $mapName = filesToFilter[0].mapName;
    players = Object.entries(Object.assign({}, ...filesToFilter.filter(file => file.mapName === $mapName)
                                                            .map(file => file.players)))
      .map(player => { return {id: parseInt(player[0]), name: player[1].name}})
      .filter(player => player.id > 40);
    if (!players.some(player => player.id === selectedPlayer)) selectedPlayer = false;
    runFilters();
  }

</script>

<div id="file-list" class="group">
  <label for="files">Demo Files:</label>
  <select multiple id="files" bind:value={selectedFiles}>
    {#each $parsedFiles as file}
      <option value={file}>
        {file.fileName} - {file.mapName}
      </option>
    {/each}
  </select>
</div>

<div class="container">
  <div id="side-bar">
    <div class="group">
      <label for="map">Map:</label>
      <select id="map" bind:value={$mapName}>
        {#each Object.keys(mapData) as map}
          <option value={map} disabled={!maps.has(map)}>
            {map}
          </option>
        {/each}
      </select>
    </div>

    <div class="group">
      <label for="players">Players:</label>
      <select id="players" bind:value={selectedPlayer}>
        <option value={false}>All</option>
        {#each players as player}
          <option value={player.id}>
            {player.name}
          </option>
        {/each}
      </select>
      <div class="sub-group">
        <button on:click="{() => {group = 0; runFilters()}}" disabled={!selectedPlayer}
        class:selected="{selectedPlayer && group === 0}">Solo</button>
        <button on:click="{() => {group = 1; runFilters()}}" disabled={!selectedPlayer}
          class:selected="{selectedPlayer && group === 1}">Team</button>
        <button on:click="{() => {group = 2; runFilters()}}" disabled={!selectedPlayer}
          class:selected="{selectedPlayer && group === 2}">Opponents</button>
      </div>
    </div>

    <div class="group">
      <span class="label">Metrics:</span>
      <div class="v-sub-group">
        <button on:click="{() => {metric = 0; runFilters()}}" class:selected="{metric === 0}">
          Kills
        </button>
        <button on:click="{() => {metric = 2; runFilters()}}" class:selected="{metric === 2}">
          Deaths
        </button>
      </div>
      <div class="v-sub-group">
        <button on:click="{() => {metric = 1; runFilters()}}" class:selected="{metric === 1}">
          Damage Dealt
        </button>
        <button on:click="{() => {metric = 3; runFilters()}}" class:selected="{metric === 3}">
          Damage Taken
        </button>
      </div>
    </div>

    <div class="group">
      <span class="label">Team:</span>
      <button on:click="{() => {team = 0; runFilters()}}" class:selected="{team === 0}">T</button>
      <button on:click="{() => {team = 1; runFilters()}}" class:selected="{team === 1}">CT</button>
      <button on:click="{() => {team = false; runFilters()}}" class:selected="{team === false}">All</button>
    </div>
    
    <div class="group" id="stats">
      <span class="label">Stats:</span>
      <div class="stat">
        <span class="no">
          {total}
        </span>
        total {['kills', 'damage dealt', 'deaths', 'damage taken'][metric]}
      </div>
      <div class="stat">
        <span class="no">
          {games}
        </span>
        games {#if wins !== false}({wins} win{wins !== 1 ? 's' : ''}){/if}
      </div>
      <div class="stat">
        <span class="no">
          {rounds}
        </span>
        rounds {#if roundWins !== false}({roundWins} win{roundWins !== 1 ? 's' : ''}){/if}
      </div>
    </div>
  </div>

  <HeatMap />
</div>


<style>
  #file-list, #files {
    width: 100%;
  }

  .container {
    display: flex;
    justify-content: center;
  }

  #side-bar {
    min-width: 280px;
    max-width: 500px;
    order: 3;
    flex-shrink: 1;
  }

  @media only screen and (max-width: 820px) {
    .container {
      flex-direction: column;
      align-items: center;
    }

    #side-bar {
      order: 0;
      flex-shrink: 0;
      flex-grow: 2;
    }
  }

  .group, .sub-group {
    width: 100%;
    position: relative;
    display: flex;
    flex-wrap: wrap;
  }

  .group {
    margin-top: 0.8em;
    border: 1px solid #273233;
    border-radius: 0.2rem;
    padding: 0 0.3rem;
    padding-top: 0.7em;
  }

  .group select {
    width: 100%;
    margin-bottom: 0.3em;
  }

  .group button {
    display: block;
    flex-grow: 2;
    margin-bottom: 0.3em;
  }

  .group button:not(:last-child) {
    margin-right: 0.2em;
  }

  .group label, .group .label {
    position: absolute;
    top: -0.8em;
    left: 0.5em;
    padding: 0 0.2em;
    background-color: #374a50;
  }

  .v-sub-group {
    display: flex;
    flex-direction: column;
    flex-grow: 2;
  }

  .v-sub-group:not(:last-child) {
    margin-right: 0.2rem;
  }

  .v-sub-group button {
    width: 100%;
  }

  #stats {
    text-align: center;
    flex-direction: column;
    padding-bottom: 0.4em;
  }

  .stat {
    font-size: 1.2em;
  }

  .stat .no {
    font-size: 1.4em;
    font-weight: bold;
  }
</style>

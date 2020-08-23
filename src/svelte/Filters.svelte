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
    // Filter events and agregate stats

    // Sort metrics
    const metricSet = metric % 2 ? 'hits' : 'deaths';
    const dealt = !Math.floor(metric / 2);
    const role = dealt ? 'a' : 'p';

    // Reduce files to event points and stats
    ({$points, games, wins, rounds, roundWins} = filesToFilter.reduce((results, file) => {
      // Select only files with the selected map and player
      if (file.mapName === $mapName && (!selectedPlayer || selectedPlayer in file.players)) {

        results.games++;

        let events = [];

        let selectedTeam; // If a player is specified, choose the player or opposition team
        if (selectedPlayer) {
          if (group === 2) selectedTeam = (file.players[selectedPlayer].team + 1) % 2; // If opposition is selected invert team
          else selectedTeam = file.players[selectedPlayer].team;

          if (file.winner === selectedTeam) results.wins++; // If the selected team won add a win

          // Choose players, either just selected player, or the entire selected team
          let selectedPlayers = Object.keys(file.players)
                                  .reduce((players, id) => {
            if ((group === 0 && parseInt(id) === selectedPlayer) ||
                (group > 0 && file.players[id].team === selectedTeam))
                  players.push(parseInt(id));
            return players;
          }, []);

          if (team !== false) {// If a team is selected choose just the player's events from that team
            events = file[metricSet][(dealt + team) % 2]
                         .filter(event => selectedPlayers.includes(event[role]));

            // If the game abandoned before team switch only add that teams rounds if they played that side
            if (file.rounds < 15 && team === selectedTeam)
                results.rounds +=  file.rounds;
            else if (team !== selectedTeam) // If the selected team played that side first add 15 rounds
              results.rounds += 15;
            else results.rounds += file.rounds - 15; // Otherwise the remaining rounds
            results.roundWins += (team === 1 ? file.scores[selectedTeam].ct : file.scores[selectedTeam].t);

          } else {
            events = file[metricSet][0] // Otherwise select from both
                         .concat(file[metricSet][1])
                         .filter(event => selectedPlayers.includes(event[role]));

            results.rounds += file.rounds; // Use all rounds and wins for that team
            results.roundWins += file.scores[selectedTeam].ct + file.scores[selectedTeam].t;
          }
          
        } else {
          results.rounds += file.rounds; // Otherwise use all rounds
          if (team !== false)
            events = file[metricSet][(dealt + team) % 2]; // And selected team events
          else
            events = file[metricSet][0]
                         .concat(file[metricSet][1]); // Or all events
        }
        results.$points = results.$points.concat(events);

      }
      return results;
    }, {$points: [],
        games: 0,
        wins: selectedPlayer ? 0 : false, // Wins false if both teams included
        rounds: 0,
        roundWins:  selectedPlayer ? 0 : false
    }));

    total = $points.reduce((acc, point) => acc + (point.d ? point.d : 1), 0);
  }

  $: {
    filesToFilter = selectedFiles.length ? selectedFiles : $parsedFiles; // Use selected files, or all if none selected
    maps = new Set(filesToFilter.map(file => file.mapName)); // Allow only available maps
    //select the first file's map if nothing selected
    if ((!$mapName || !maps.has($mapName)) && filesToFilter.length > 0) $mapName = filesToFilter[0].mapName;

    // Filter available players by those in selected files/maps
    players = Object.entries(Object.assign({}, ...filesToFilter.filter(file => file.mapName === $mapName)
                                                            .map(file => file.players)))
      .map(player => { return {id: parseInt(player[0]), name: player[1].name}})
      .filter(player => player.id > 40);

    // Default to no player selected if they aren't in filtered players
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
    {:else}
    <option value="" disabled="" class="empty">
      No demo files - Click and drag or select upload demo files to begin.
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

  .empty {
    text-align: center;
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

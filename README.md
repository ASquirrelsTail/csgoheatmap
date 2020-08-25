# CSGO Heatmap

Visualize data from CSGO demos as map overlays showing kills and deaths. Combine information from multiple games to get a better overview of how play unfolds. CSGO Scopes parses demos in the browser to extract shot and kill data, which is aggregated and overlayed on the game maps. Game data can be filtered by player and team to gain insight and improve your play.

[Try it here](https://asquirrelstail.github.io/csgoheatmap/public/)

![alt text](https://raw.githubusercontent.com/ASquirrelsTail/csgoheatmap/blob/master/public/images/screengrab1.jpg "Heatmap overlay")

![alt text](https://raw.githubusercontent.com/ASquirrelsTail/csgoheatmap/blob/master/public/images/screengrab2.jpg "Shots overlay")

## Tech

The project uses [demofile](https://github.com/saul/demofile) to parse demo files and [simpleheat](https://github.com/mourner/simpleheat) to draw the heatmaps. The project is built using the svelte js framework.

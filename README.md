# Digger VR

A browser based 'Minecraft' meets 'Terraria' kind of idea with things like gamepad and VR support thrown in the mix.
![Screenshot](https://devblazer.github.io/Host/Screenshot_2017-04-05-10-10-06.jpg)

**Setup:**

clone the repo then run: 'npm install'

You will need mongo installed and setup.  If you have your own mongo instance running on the default port, then thats fine.
Otherwise you will need to run: 'npm run db'

Now that the db is started, you can run: 'npm run start'

Navigate to localhost:3000 to play.

Please note that for performance reasons, maps need to be pre-generated server side (node) before you can start any new games.
When you click 'new game' for a particular map size, the server picks out an existing pre-generated map of that size and serves a copy of it to the client, rather than generating a new one from scratch, which can take very long.
For this reason you will have to pre-generate at least one map of the size you intend to play, before you can begin.

To generate a map: 'node ./src/node/mapGen.js --gen=64'
Substitute 64 for the map size in question.  Currently tested and working: 64, 128, 256, 512
  
**Current working feature set:**

+ Movement, 'stepping' and jumping
+ Collision detection
+ Digging
+ Grass / Dirt / Rocks - block types
+ World edges working, except for top
+ World size upto 512 x 512 x 512
+ Mouse and keyboard support
+ Gamepad / Controller support
+ Google cardboard with head tracking support
+ Server side map pre-generation
+ New game, Loading, Deleting and 'live' save game syncing
+ Local save of world data for fast loading (indexedDB)
+ Basic UI + menu (already touch enabled)
+ Variable block break strength
+ Basic sounds effects
+ Basic new/load game progress indicator

**Roadmap:**

+ User accounts + Login
+ Add camera tilt for VR mode
+ Add switch between torch/pickaxe
+ Turn god lighting into sun lighting
+ Add rudimentary diffuse lighting
+ Add digging visuals
+ Inventory
+ Add torch placement
+ Block placement
+ Touch controls (already work for menu)
+ More block types
+ Water
+ Lava
+ Hp implementation
+ More to be decided on...

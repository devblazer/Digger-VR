# Digger VR

A browser based 'Minecraft' meets 'Terraria' kind of idea with things like gamepad and VR support thrown in the mix.

**To run:**
clone the repo then run:

npm install
npm start

Navigate to localhost:3000
  
**Current working feature set:**

+ Movement, 'stepping' and jumping
+ Collision detection
+ Digging
+ Grass / Dirt / Rocks - block types
+ World edges work fixed, except for top
+ World size upto 1024 x 1024 x 1024 (currently set to 64 for testing)
+ Mouse and keyboard support
+ Gamepad / Controller support
+ Google cardboard with head tracking support
(Runs in VR mode automatically if on a device with direction sensor)
(You will need a controller to move while in VR mode)

**Roadmap:**

+ ~~Cardboard barrel distortion~~
+ ~~Impenetrable blocks at bottom of map~~
+ ~~Perform 'area' directional digging if hold down dig button~~
+ ~~Support upto 2048 maps (browser cant handle more than 1024)~~
+ Map generation progress indicator
+ Saving and loading of maps to a server
+ Keeping map changes (digging) in sync with a server

+ ~~Code refactor~~
+ Unit tests

+ Add camera tilt for VR mode
+ Block break strength
+ Add switch between torch/pickaxe
+ Turn god lighting into sun lighting
+ Add rudimentary diffuse lighting
+ Add torch placement
+ Block placement

+ UI + menu

+ More to be decided on...

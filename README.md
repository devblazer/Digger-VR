# Digger VR

A browser based 'Minecraft' meets 'Terraria' kind of idea with things like gamepad and VR support thrown in the mix.
![Screenshot](drive.google.com/uc?export=view&id=0B4R1dtfUm4ypZFVRTDFMYll4ZVE)

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
+ Perform 'area' directional digging if hold down dig button
+ Mouse and keyboard support
+ Gamepad / Controller support
+ Google cardboard VR mode with head tracking support
(Runs in VR mode automatically if on a device with direction sensor)
(You will need a controller to move while in VR mode)

**Soon to be deployed (almost working) feature set:**

+ Menu system for creating, saving and loading games
+ Ability to define mouse / keyboard / gamepad controls
+ Server side pre-generated maps
+ Client/Server map syncing
+ Offline storage of map data
+ Manual toggle of VR mode

**Roadmap:**

+ Add camera tilt for VR mode
+ Block break strength
+ Block placement
+ Inventory
+ Turn god lighting into sun lighting
+ Add rudimentary diffuse lighting
+ Add torch placement
+ Add switch between torch/pickaxe
+ Add sound effects
+ Add digging visuals
+ More block types
+ Water
+ Lava
+ Hp implementation

+ More to be decided on...

// Copyright (c) 2024 - TheHyundaiSeoul AR Project
//
// app.js is the main entry point. Registers A-Frame components and configures XR8 image targets.

import './index.css'
import {imageTargetComponent} from './image-target-component'
import {sphereAnimationComponent} from './sphere-animation'

// Register custom A-Frame components before the scene loads
AFRAME.registerComponent('named-image-target', imageTargetComponent)
AFRAME.registerComponent('sphere-animation', sphereAnimationComponent)

// Configure XR8 image targets after engine loads
const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/poster/poster.json'),
      require('../image-targets/marker_front_long/marker_front_long.json'),
      require('../image-targets/marker_inside_top_small/marker_inside_top_small.json'),
      require('../image-targets/marker_inside_top_long/marker_inside_top_long.json'),
      require('../image-targets/marker_inside_bottom_small/marker_inside_bottom_small.json'),
      require('../image-targets/marker_inside_bottom_long/marker_inside_bottom_long.json'),
      require('../image-targets/marker_inside_bottom_same/marker_inside_bottom_same.json'),
    ],
  })
}
window.addEventListener('xrloaded', onxrloaded)

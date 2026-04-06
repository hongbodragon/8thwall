// Sphere animation component for A-Frame
// Applies rotation and floating (sine wave) animation

export const sphereAnimationComponent = {
  schema: {
    speed: {type: 'number', default: 1},
    floatHeight: {type: 'number', default: 0.3},
  },

  init() {
    this.startY = this.el.object3D.position.y
    this.time = 0
  },

  tick(time, delta) {
    if (!this.el.object3D.parent || !this.el.object3D.parent.visible) return
    this.time += delta / 1000

    // Rotate around Y axis
    this.el.object3D.rotation.y += delta * 0.001 * this.data.speed

    // Float up and down with sine wave
    this.el.object3D.position.y =
      this.startY + Math.sin(this.time * this.data.speed) * this.data.floatHeight
  },
}

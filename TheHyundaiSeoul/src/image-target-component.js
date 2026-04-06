// Image target component for A-Frame
// Handles xrimagefound / xrimageupdated / xrimagelost events

const HIDE_DELAY_MS = 400

export const imageTargetComponent = {
  schema: {
    name: {type: 'string'},
  },

  init() {
    const object3D = this.el.object3D
    const {name} = this.data
    object3D.visible = false
    let hideTimer = null

    const showImage = ({detail}) => {
      if (detail.name !== name) return
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
    }

    const hideImage = ({detail}) => {
      if (detail.name !== name) return
      hideTimer = setTimeout(() => {
        object3D.visible = false
        hideTimer = null
      }, HIDE_DELAY_MS)
    }

    this.el.sceneEl.addEventListener('xrimagefound', showImage)
    this.el.sceneEl.addEventListener('xrimageupdated', showImage)
    this.el.sceneEl.addEventListener('xrimagelost', hideImage)
  },
}

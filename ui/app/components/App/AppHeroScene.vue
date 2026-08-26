<script setup lang="ts">
type SceneLayer = {
  name: string
  src: string
  depth: number
  driftY: string
  tilt: string
  period: number
  delay: string
}

const LAYERS: SceneLayer[] = [
  {
    name: 'far',
    src: '/hero/clouds-1.png',
    depth: 0.16,
    driftY: '-10px',
    tilt: '0deg',
    period: 2.6,
    delay: '-4s',
  },
  {
    name: 'aircraft',
    src: '/hero/plane-1.png',
    depth: 1,
    driftY: '0px',
    tilt: '1.6deg',
    period: 1,
    delay: '0s',
  },
  {
    name: 'near',
    src: '/hero/clouds-near.png',
    depth: 0.48,
    driftY: '10px',
    tilt: '0deg',
    period: 1.8,
    delay: '-1.5s',
  },
]

const MAX_SHIFT = 64

const SPRING = {
  stiffness: 90,
  damping: 20,
  mass: 0.6,
} as const

const { x, y, sourceType } = useMouse({ type: 'client' })
const { width, height } = useWindowSize()
const reducedMotion = usePreferredReducedMotion()

const pointerX = useMotionValue(0)
const pointerY = useMotionValue(0)
const easedX = useSpring(pointerX, SPRING)
const easedY = useSpring(pointerY, SPRING)

watchEffect(() => {
  const idle = sourceType.value !== 'mouse' || reducedMotion.value === 'reduce'

  if (idle || !width.value || !height.value) {
    pointerX.set(0)
    pointerY.set(0)
    return
  }

  pointerX.set(x.value / width.value - 0.5)
  pointerY.set(y.value / height.value - 0.5)
})

const sceneLayers = LAYERS.map((layer) => ({
  ...layer,
  x: useTransform(easedX, (v) => v * MAX_SHIFT * layer.depth),
  y: useTransform(easedY, (v) => v * MAX_SHIFT * layer.depth),
}))

const broken = ref(new Set<string>())
const layers = computed(() =>
  sceneLayers.filter((l) => !broken.value.has(l.src)),
)
</script>

<template>
  <div class="hero-scene" aria-hidden="true">
    <Motion
      v-for="layer in layers"
      :key="layer.src"
      class="scene-layer"
      :class="`scene-${layer.name}`"
      :style="{ x: layer.x, y: layer.y }"
    >
      <img
        class="scene-art"
        :src="layer.src"
        alt=""
        :style="{
          '--drift-y': layer.driftY,
          '--tilt': layer.tilt,
          animationDuration: `calc(var(--duration-float) * ${layer.period})`,
          animationDelay: layer.delay,
        }"
        @error="broken.add(layer.src)"
      />
    </Motion>
  </div>
</template>

<style scoped>
.hero-scene {
  position: absolute;
  inset: 0;
  z-index: var(--z-sticky);
  overflow: hidden;
  pointer-events: none;
}

.scene-layer {
  position: absolute;
  will-change: transform;
}

.scene-art {
  display: block;
  width: 100%;
  height: auto;
  will-change: transform;
  animation-name: scene-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.scene-far {
  top: 20%;
  inset-inline-end: -4%;
  width: clamp(320px, 46vw, 720px);
  opacity: 0.45;
}

.scene-near {
  top: 35%;
  inset-inline-end: 2%;
  width: clamp(260px, 38vw, 560px);
  opacity: 0.75;
}

.scene-aircraft {
  top: 34%;
  inset-inline-end: 6%;
  width: clamp(220px, 30vw, 440px);
}

@keyframes scene-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(0, var(--drift-y), 0) rotate(var(--tilt));
  }
}

@media (prefers-reduced-motion: reduce) {
  .scene-art {
    animation: none;
  }
}

@media (max-width: 900px) {
  .hero-scene {
    display: none;
  }
}
</style>

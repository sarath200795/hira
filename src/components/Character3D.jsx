import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

const SKIN = '#e8b48f', HAT = '#f4b400', HAT_D = '#c98a00'
const VEST = '#2563eb', STRIPE = '#fde047', TROUSER = '#1e3a8a', TROUSER_D = '#172e6b', DARK = '#0b1220'

// Original low-poly "Sam" rigged from primitives + procedurally animated per state.
function Rig({ mode = 'idle' }) {
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  const root = useRef()
  const torso = useRef()
  const head = useRef()
  const eyes = useRef()
  const sL = useRef(), eL = useRef(), sR = useRef(), eR = useRef()
  const hL = useRef(), hR = useRef()
  const clip = useRef(), pen = useRef()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const k = 1 - Math.exp(-9 * Math.min(delta, 0.05))
    const m = modeRef.current
    const set = (ref, axis, target) => { if (ref.current) ref.current.rotation[axis] += (target - ref.current.rotation[axis]) * k }

    let sLx = 0, eLx = -0.05, sRx = 0, eRx = -0.05, hLx = 0, hRx = 0, hdx = 0, lean = 0, sRz = 0

    if (m === 'walk') {
      const s = Math.sin(t * 7)
      hLx = s * 0.5; hRx = -s * 0.5; sLx = -s * 0.45; sRx = s * 0.45; eLx = -0.25; eRx = -0.25
      if (root.current) root.current.position.y = Math.abs(Math.sin(t * 7)) * 0.04
    } else {
      if (root.current) root.current.position.y += (0 - root.current.position.y) * k
      if (m === 'think') { sRx = -0.6; eRx = -2.2; hdx = -0.18 }
      else if (m === 'write') { sLx = -1.0; eLx = -1.35; sRx = -0.95; eRx = -1.25 + Math.sin(t * 8) * 0.14; hdx = 0.34 }
      else if (m === 'scratch') { sRx = -2.7; eRx = -1.4 + Math.sin(t * 11) * 0.2; hdx = -0.1 }
      else if (m === 'wave') { sRx = -2.7; sRz = 0.25; eRx = -0.2 + Math.sin(t * 9) * 0.55 }
      else if (m === 'sleep') { hdx = 0.5; lean = 0.25 }
      else { sLx = Math.sin(t * 1.4) * 0.05; sRx = -Math.sin(t * 1.4) * 0.05 } // idle
    }

    set(sL, 'x', sLx); set(eL, 'x', eLx); set(sR, 'x', sRx); set(eR, 'x', eRx)
    if (sR.current) sR.current.rotation.z += (sRz - sR.current.rotation.z) * k
    set(hL, 'x', hLx); set(hR, 'x', hRx); set(head, 'x', hdx)
    if (torso.current) {
      torso.current.rotation.x += (lean - torso.current.rotation.x) * k
      torso.current.scale.y = 1 + Math.sin(t * (m === 'sleep' ? 1.2 : 2)) * 0.02
    }
    if (clip.current) clip.current.visible = m === 'write'
    if (pen.current) pen.current.visible = m === 'write'
    if (eyes.current) eyes.current.scale.y = m === 'sleep' ? 0.12 : (t % 4 < 0.13 ? 0.12 : 1)
    if (root.current) {
      const turn = m === 'idle' ? Math.sin(t * 0.5) * 0.18 : 0
      root.current.rotation.y += (turn - root.current.rotation.y) * k
    }
  })

  return (
    <group position={[0, -0.95, 0]}>
      <group ref={root}>
        {/* legs */}
        <group ref={hL} position={[-0.14, 0.92, 0]}>
          <mesh position={[0, -0.42, 0]}><boxGeometry args={[0.17, 0.84, 0.17]} /><meshStandardMaterial color={TROUSER} /></mesh>
          <mesh position={[0, -0.86, 0.05]}><boxGeometry args={[0.18, 0.12, 0.3]} /><meshStandardMaterial color={DARK} /></mesh>
        </group>
        <group ref={hR} position={[0.14, 0.92, 0]}>
          <mesh position={[0, -0.42, 0]}><boxGeometry args={[0.17, 0.84, 0.17]} /><meshStandardMaterial color={TROUSER_D} /></mesh>
          <mesh position={[0, -0.86, 0.05]}><boxGeometry args={[0.18, 0.12, 0.3]} /><meshStandardMaterial color={DARK} /></mesh>
        </group>

        {/* torso / vest */}
        <group ref={torso} position={[0, 1.27, 0]}>
          <mesh><boxGeometry args={[0.56, 0.74, 0.34]} /><meshStandardMaterial color={VEST} /></mesh>
          <mesh position={[0, 0, 0.18]}><boxGeometry args={[0.5, 0.08, 0.02]} /><meshStandardMaterial color={STRIPE} /></mesh>
          <mesh position={[-0.13, 0, 0.18]}><boxGeometry args={[0.07, 0.62, 0.02]} /><meshStandardMaterial color={STRIPE} /></mesh>
          <mesh position={[0.13, 0, 0.18]}><boxGeometry args={[0.07, 0.62, 0.02]} /><meshStandardMaterial color={STRIPE} /></mesh>
          {/* clipboard (write) */}
          <group ref={clip} position={[0, -0.16, 0.4]} rotation={[-0.55, 0, 0]}>
            <mesh><boxGeometry args={[0.34, 0.44, 0.02]} /><meshStandardMaterial color="#c8d2e0" /></mesh>
            <mesh position={[0, 0, 0.012]}><boxGeometry args={[0.28, 0.36, 0.006]} /><meshStandardMaterial color="#ffffff" /></mesh>
          </group>
        </group>

        {/* head */}
        <group ref={head} position={[0, 1.68, 0]}>
          <mesh position={[0, 0.06, 0]}><sphereGeometry args={[0.22, 24, 24]} /><meshStandardMaterial color={SKIN} /></mesh>
          <group ref={eyes}>
            <mesh position={[-0.08, 0.06, 0.2]}><sphereGeometry args={[0.032, 12, 12]} /><meshStandardMaterial color="#1f2937" /></mesh>
            <mesh position={[0.08, 0.06, 0.2]}><sphereGeometry args={[0.032, 12, 12]} /><meshStandardMaterial color="#1f2937" /></mesh>
          </group>
          {/* hard hat: dome + brim + ridge */}
          <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.245, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={HAT} /></mesh>
          <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.05, 24]} /><meshStandardMaterial color={HAT_D} /></mesh>
          <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.06, 0.16, 0.5]} /><meshStandardMaterial color={HAT_D} /></mesh>
        </group>

        {/* left arm */}
        <group ref={sL} position={[-0.34, 1.52, 0]}>
          <mesh position={[0, -0.19, 0]}><boxGeometry args={[0.13, 0.4, 0.13]} /><meshStandardMaterial color={VEST} /></mesh>
          <group ref={eL} position={[0, -0.39, 0]}>
            <mesh position={[0, -0.17, 0]}><boxGeometry args={[0.12, 0.36, 0.12]} /><meshStandardMaterial color={VEST} /></mesh>
            <mesh position={[0, -0.39, 0]}><sphereGeometry args={[0.075, 14, 14]} /><meshStandardMaterial color={SKIN} /></mesh>
          </group>
        </group>

        {/* right arm (pen) */}
        <group ref={sR} position={[0.34, 1.52, 0]}>
          <mesh position={[0, -0.19, 0]}><boxGeometry args={[0.13, 0.4, 0.13]} /><meshStandardMaterial color={VEST} /></mesh>
          <group ref={eR} position={[0, -0.39, 0]}>
            <mesh position={[0, -0.17, 0]}><boxGeometry args={[0.12, 0.36, 0.12]} /><meshStandardMaterial color={VEST} /></mesh>
            <mesh position={[0, -0.39, 0]}><sphereGeometry args={[0.075, 14, 14]} /><meshStandardMaterial color={SKIN} /></mesh>
            <mesh ref={pen} position={[0.02, -0.46, 0.05]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.02, 0.16, 0.02]} /><meshStandardMaterial color={DARK} /></mesh>
          </group>
        </group>
      </group>
      {/* soft ground shadow */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.45, 24]} /><meshBasicMaterial color="#000000" transparent opacity={0.12} /></mesh>
    </group>
  )
}

export default function Character3D({ mode = 'idle' }) {
  return (
    <div style={{ width: 124, height: 168, pointerEvents: 'none' }}>
      <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.05, 3.4], fov: 30 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        <Rig mode={mode} />
      </Canvas>
    </div>
  )
}

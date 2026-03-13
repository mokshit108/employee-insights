import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEmployeeData } from '../contexts/DataContext'
import { normalizeRecord } from '../utils/normalize'

export default function DetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employees, setEmployeeAuditImage } = useEmployeeData()
  const employee =
    employees.find((e) => e.id === String(id)) ?? normalizeRecord({ id }, Number(id) || 1)

  const videoRef = useRef(null)
  const photoCanvasRef = useRef(null)
  const signatureCanvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraState, setCameraState] = useState('idle') // idle | loading | ready | denied
  const [capturedPhoto, setCapturedPhoto] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [mergeStatus, setMergeStatus] = useState('')

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  async function startCamera() {
    try {
      setCameraState('loading')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraState('ready')
    } catch {
      setCameraState('denied')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraState('idle')
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = photoCanvasRef.current
    if (!video || !canvas) return

    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, width, height)
    setCapturedPhoto(canvas.toDataURL('image/png'))
    setMergeStatus('')
    stopCamera()
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCapturedPhoto(event.target.result)
      setMergeStatus('')
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  // Translates a mouse / touch event into canvas-local coordinates
  function getPoint(event) {
    const canvas = signatureCanvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const source =
      'touches' in event && event.touches.length > 0 ? event.touches[0] : event

    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function beginDrawing(event) {
    event.preventDefault()
    const canvas = signatureCanvasRef.current
    const point = getPoint(event)
    if (!canvas || !point) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  function draw(event) {
    event.preventDefault()
    if (!isDrawing) return

    const canvas = signatureCanvasRef.current
    const point = getPoint(event)
    if (!canvas || !point) return

    const ctx = canvas.getContext('2d')
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function endDrawing() {
    setIsDrawing(false)
  }

  function clearSignature() {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setMergeStatus('')
  }

  async function mergeAuditImage() {
    if (!capturedPhoto || !hasSignature) {
      setMergeStatus('Capture a photo and add a signature first.')
      return
    }

    const signatureCanvas = signatureCanvasRef.current
    if (!signatureCanvas) return

    const photo = new Image()
    photo.src = capturedPhoto

    await new Promise((resolve) => {
      photo.onload = resolve
    })

    const exportCanvas = document.createElement('canvas')
    // Set internal resolution based on original photo dimensions if available
    exportCanvas.width = photo.naturalWidth || 640
    exportCanvas.height = photo.naturalHeight || 480
    const ctx = exportCanvas.getContext('2d')

    // Layer 1: base photo
    ctx.drawImage(photo, 0, 0, exportCanvas.width, exportCanvas.height)
    // Layer 2: signature (scaled to match photo dimensions)
    ctx.drawImage(signatureCanvas, 0, 0, exportCanvas.width, exportCanvas.height)
    // Layer 3: verification watermark
    ctx.fillStyle = 'rgba(17, 24, 39, 0.78)'
    ctx.fillRect(16, exportCanvas.height - 70, 320, 48)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`✓ Verified: ${employee.name}`, 28, exportCanvas.height - 38)

    const merged = exportCanvas.toDataURL('image/png')
    setEmployeeAuditImage(employee.id, merged)
    setMergeStatus('Audit image merged successfully.')
    navigate('/analytics')
  }

  return (
    <section className="page" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Verification Protocol</p>
          <h2>Identity Verification Terminal</h2>
          <p className="muted">
            Execute secure biometric capture or upload a file, then provide an electronic signature to generate 
            merged audit asset.
          </p>
        </div>
        <Link className="secondary-button" to="/list" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px' }}>←</span> Return to Registry
        </Link>
      </div>

      <div className="panel detail-summary" style={{ background: 'rgba(255, 255, 255, 0.02)', marginBottom: 'var(--sp-8)' }}>
        <div className="summary-field">
          <span>Employee Identity</span>
          <strong># {employee.id}</strong>
        </div>
        <div className="summary-field">
          <span>Legal Name</span>
          <strong>{employee.name}</strong>
        </div>
        <div className="summary-field">
          <span>Operational Hub</span>
          <strong>{employee.city}</strong>
        </div>
        <div className="summary-field">
          <span>Unit / Division</span>
          <strong>{employee.department}</strong>
        </div>
      </div>

      <div className="detail-layout">
        <div className="panel media-panel" style={{ padding: 'var(--sp-8)' }}>
          <div className="media-header" style={{ marginBottom: 'var(--sp-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Biometric Capture Stage</h3>
              <p className="muted">Capture via camera or upload an existing legal document image.</p>
            </div>
            {!capturedPhoto && (
              <button 
                className="secondary-button" 
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: '0.75rem' }}
              >
                Upload File
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>

          <div className="camera-stage" style={{ background: '#000', borderRadius: 'var(--radius-xl)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)', position: 'relative' }}>
            {!capturedPhoto ? (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="camera-video" />
                {cameraState === 'idle' && (
                  <div className="camera-placeholder">
                    <div className="camera-icon" style={{ fontSize: '4rem', marginBottom: '16px' }}>❂</div>
                    <p style={{ fontSize: '1.1rem' }}>Optical Sensor <strong>STANDBY</strong></p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button className="primary-button" onClick={startCamera}>
                        Initialize Camera
                      </button>
                    </div>
                  </div>
                )}
                {cameraState === 'loading' && (
                  <div className="camera-placeholder">
                    <span className="loading-spinner" />
                    <p style={{ marginTop: '16px' }}>Requesting peripheral access...</p>
                  </div>
                )}
                {cameraState === 'denied' && (
                  <div className="camera-placeholder camera-denied">
                    <p style={{ fontWeight: 600 }}>[ ACCESS_DENIED ]</p>
                    <p className="muted">Please authorize camera access or use the "Upload File" option.</p>
                  </div>
                )}
                {cameraState === 'ready' && (
                  <div className="capture-overlay">
                    <button className="capture-trigger" onClick={capturePhoto}>
                      <div className="trigger-inner" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="capture-wrapper" style={{ animation: 'popIn 0.4s cubic-bezier(0,0,0.2,1.2)', width: '100%', height: '100%', overflow: 'hidden' }}>
                <img className="captured-photo" src={capturedPhoto} alt="Captured audit frame" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div className="signature-overlay-label">Electronic Signature Overlay</div>
                <canvas
                  className="signature-overlay"
                  ref={signatureCanvasRef}
                  width="640"
                  height="480"
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                  onMouseDown={beginDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchEnd={endDrawing}
                  onTouchMove={draw}
                  onTouchStart={beginDrawing}
                />
              </div>
            )}
            <canvas className="hidden-canvas" ref={photoCanvasRef} />
          </div>

          <div className="status-row" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-4)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
            <div className="status-indicator">
              <span>Source:</span>
              <strong style={{ color: capturedPhoto ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {capturedPhoto ? 'ASSET_LOADED' : 'PENDING'}
              </strong>
            </div>
            <div className="status-indicator">
              <span>Auth Signature:</span>
              <strong className={hasSignature ? 'sig-present' : 'sig-missing'}>
                {hasSignature ? 'VERIFIED' : 'PENDING'}
              </strong>
            </div>
          </div>

          <div className="media-actions" style={{ marginTop: 'var(--sp-6)' }}>
            <button className="secondary-button" onClick={() => { setCapturedPhoto(''); setHasSignature(false); stopCamera(); }} style={{ flex: 1 }}>
              Reset All
            </button>
            <button
              className="primary-button"
              onClick={mergeAuditImage}
              style={{ flex: 2, background: 'var(--color-success)', color: '#fff' }}
              disabled={!capturedPhoto || !hasSignature}
            >
              Finalize Audit & Merge ➔
            </button>
          </div>

          {mergeStatus ? <p className="info-text" style={{ marginTop: 'var(--sp-4)' }}>{mergeStatus}</p> : null}
        </div>

        <div className="panel instructions-panel" style={{ border: '1px solid var(--color-accent-subtle)' }}>
          <h3 style={{ color: 'var(--color-accent)' }}>Audit Workflow</h3>
          <ul className="audit-workflow-list">
            <li>
              <strong>01. Asset Acquisition</strong>
              <p>Initialize camera sensor or upload high-resolution image file.</p>
            </li>
            <li>
              <strong>02. Signature Assertion</strong>
              <p>Manual signature input required over the acquired asset layer.</p>
            </li>
            <li>
              <strong>03. Ledger Processing</strong>
              <p>Bit-level merging and storage into the local encrypted manifest.</p>
            </li>
          </ul>

          <div className="tip-box" style={{ background: 'var(--color-surface-2)', borderLeft: '4px solid var(--color-accent)', padding: 'var(--sp-4)' }}>
            <strong>System Note:</strong> The final composited manifest will be stored and linked to this employee's record across the platform.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .summary-field { display: flex; flex-direction: column; gap: 4px; }
        .summary-field span { font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-field strong { font-size: 1.1rem; }
        
        .audit-workflow-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--sp-6); margin: var(--sp-6) 0; }
        .audit-workflow-list li strong { font-size: 0.85rem; color: var(--color-text-primary); display: block; margin-bottom: 4px; }
        .audit-workflow-list li p { font-size: 0.8rem; color: var(--color-text-muted); margin: 0; }
        
        .status-row { display: flex; justify-content: space-between; }
        .status-indicator { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; }
        .status-indicator span { color: var(--color-text-muted); }
        
        .capture-overlay { position: absolute; bottom: 30px; left: 0; right: 0; display: flex; justify-content: center; }
        .capture-trigger { width: 64px; height: 64px; border-radius: 50%; border: 4px solid #fff; background: transparent; padding: 4px; cursor: pointer; transition: transform 0.2s ease; }
        .capture-trigger:hover { transform: scale(1.1); }
        .trigger-inner { width: 100%; height: 100%; border-radius: 50%; background: #fff; }
        
        .signature-overlay { width: 100%; height: 100%; cursor: crosshair; }
        .signature-overlay-label { position: absolute; top: 12px; left: 12px; font-size: 0.65rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; pointer-events: none; }
        
        .sig-present { color: var(--color-success); }
        .sig-missing { color: var(--color-warning); }

        button:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>
    </section>
  )
}

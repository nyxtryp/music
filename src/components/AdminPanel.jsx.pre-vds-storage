import { useEffect, useMemo, useRef, useState } from 'react'
import { upload as uploadBlob } from '@vercel/blob/client'

const TYPES = [
  { id: 'tracks', label: 'TRACKS', accept: 'audio/*', icon: '♪', kind: 'AUDIO' },
  { id: 'radio', label: 'RADIO', accept: 'audio/*', icon: '◉', kind: 'AUDIO' },
  { id: 'mixes', label: 'MIXES', accept: 'audio/*', icon: '◒', kind: 'AUDIO' },
  { id: 'photos', label: 'PHOTOS', accept: 'image/*', icon: '▧', kind: 'IMAGE' }
]

const prettyName = name => name.replace(/\.[^.]+$/, '')
const extension = name => (name.match(/\.[^.]+$/) || [''])[0]

async function preparePhoto(file) {
  const MAX_BYTES = 2.8 * 1024 * 1024
  const MAX_DIMENSION = 2400
  if (file.size <= MAX_BYTES) return { file, name: file.name }

  let bitmap = null
  let objectUrl = null
  try {
    if ('createImageBitmap' in window) {
      bitmap = await createImageBitmap(file)
    } else {
      objectUrl = URL.createObjectURL(file)
      bitmap = await new Promise((resolve, reject) => {
        const img = new Image()
        const timer = setTimeout(() => reject(new Error('Изображение слишком долго готовится')), 8000)
        img.onload = () => { clearTimeout(timer); resolve(img) }
        img.onerror = () => { clearTimeout(timer); reject(new Error(`Не удалось прочитать изображение «${file.name}»`)) }
        img.src = objectUrl
      })
    }

    const sourceWidth = bitmap.width || bitmap.naturalWidth
    const sourceHeight = bitmap.height || bitmap.naturalHeight
    if (!sourceWidth || !sourceHeight) throw new Error(`Не удалось определить размер изображения «${file.name}»`)

    const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Не удалось подготовить изображение')
    ctx.drawImage(bitmap, 0, 0, width, height)

    if (bitmap.close) bitmap.close()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = null

    const makeBlob = quality => new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Не удалось сжать изображение')), 'image/jpeg', quality)
    })

    let quality = 0.88
    let blob = await makeBlob(quality)
    while (blob.size > MAX_BYTES && quality > 0.55) {
      quality -= 0.07
      blob = await makeBlob(quality)
    }
    if (blob.size > MAX_BYTES) throw new Error(`«${file.name}» не удалось уменьшить до допустимого размера`)

    const base = prettyName(file.name).trim() || 'photo'
    return { file: new File([blob], `${base}.jpg`, { type: 'image/jpeg' }), name: `${base}.jpg` }
  } catch (error) {
    if (bitmap?.close) bitmap.close()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    throw error
  }
}

function fileMeta(name, type) {
  const ext = (extension(name).replace('.', '') || (type === 'photos' ? 'image' : 'audio')).toUpperCase()
  return ext
}

export default function AdminPanel() {
  const [key, setKey] = useState(() => sessionStorage.getItem('nyxtryp-admin-key') || '')
  const [ok, setOk] = useState(false)
  const [active, setActive] = useState('tracks')
  const [files, setFiles] = useState({ tracks: [], radio: [], mixes: [], photos: [] })
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null)
  const [rename, setRename] = useState(null)
  const [replaceName, setReplaceName] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [previewUrls, setPreviewUrls] = useState({})
  const input = useRef(null)
  const type = useMemo(() => TYPES.find(x => x.id === active), [active])

  const load = async () => {
    try {
      const r = await fetch('/api/admin', { cache: 'no-store' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Не удалось загрузить список')
      setFiles(data)
      setOk(true)
      setError('')
    } catch (e) {
      setOk(false)
      setError(e.message || 'Ошибка подключения')
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('nyxtryp-admin-key')
    if (!saved) return
    ;(async () => {
      try {
        const r = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'auth', adminKey: saved })
        })
        if (!r.ok) throw new Error('Неверный admin key')
        await load()
      } catch {
        sessionStorage.removeItem('nyxtryp-admin-key')
        setKey('')
        setOk(false)
      }
    })()
  }, [])

  const api = async (method, body) => {
    const r = await fetch('/api/admin', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, adminKey: key })
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || `Ошибка ${r.status}`)
    return data
  }

  const login = async e => {
    e.preventDefault()
    if (!key.trim()) return
    setStatus('ПРОВЕРКА…')
    setError('')
    try {
      await api('POST', { action: 'auth' })
      sessionStorage.setItem('nyxtryp-admin-key', key.trim())
      await load()
      setStatus('')
    } catch (e) {
      setOk(false)
      setError(e.message || 'Неверный admin key')
      setStatus('')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('nyxtryp-admin-key')
    setKey('')
    setOk(false)
  }

  const chooseFile = mode => {
    setReplaceName(mode || null)
    setStatus('ВЫБЕРИТЕ ФАЙЛ…')
    setError('')
    setProgress(null)
    if (input.current) input.current.value = ''
    requestAnimationFrame(() => input.current?.click())
  }

  const upload = async e => {
    const inputElement = e.currentTarget
    const selected = Array.from(inputElement.files || [])
    if (!selected.length) {
      setStatus('ФАЙЛ НЕ ВЫБРАН')
      return
    }

    setBusy(true)
    setError('')
    setProgress({ total: selected.length, current: 0, step: 'prepare', name: selected[0].name })
    setStatus('1/4 · ПОДГОТОВКА')

    try {
      for (let i = 0; i < selected.length; i += 1) {
        const original = selected[i]
        setProgress({ total: selected.length, current: i + 1, step: 'prepare', name: original.name })
        setStatus(`${i + 1}/${selected.length} · ПОДГОТОВКА`)
        if (active !== 'photos') {
          const name = replaceName || original.name
          setProgress({ total: selected.length, current: i + 1, step: 'send', name })
          setStatus(`${i + 1}/${selected.length} · ОТПРАВКА В STORAGE`)
          await uploadBlob(`${active}/${name}`, original, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            multipart: true,
            clientPayload: JSON.stringify({ adminKey: key, type: active, name }),
            onUploadProgress: ({ percentage }) => {
              setProgress({ total: selected.length, current: i + 1, step: 'send', name, percentage: Math.round(percentage) })
              setStatus(`${i + 1}/${selected.length} · ЗАГРУЗКА ${Math.round(percentage)}%`)
            }
          })
          setProgress({ total: selected.length, current: i + 1, step: 'done', name })
          setStatus(`${i + 1}/${selected.length} · СОХРАНЕНО`)
          continue
        }

        const prepared = await preparePhoto(original)
        const file = prepared.file
        const name = replaceName || prepared.name

        setProgress({ total: selected.length, current: i + 1, step: 'encode', name })
        setStatus(`${i + 1}/${selected.length} · ЧТЕНИЕ ФАЙЛА`)
        const content = await (async fileToEncode => {
          const buffer = await fileToEncode.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          let binary = ''
          const chunkSize = 0x8000
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)))
          }
          return btoa(binary)
        })(file)

        setProgress({ total: selected.length, current: i + 1, step: 'send', name })
        setStatus(`${i + 1}/${selected.length} · ОТПРАВКА В GITHUB`)
        await api('POST', { type: active, name, content })

        setProgress({ total: selected.length, current: i + 1, step: 'done', name })
        setStatus(`${i + 1}/${selected.length} · СОХРАНЕНО`)
      }
      setReplaceName(null)
      setProgress({ total: selected.length, current: selected.length, step: 'done', name: selected[selected.length - 1].name })
      await load()
      setStatus(selected.length > 1 ? `ГОТОВО · СОХРАНЕНО ${selected.length}` : 'ГОТОВО · ФАЙЛ СОХРАНЁН')
    } catch (e) {
      setError(e.message || 'Ошибка сохранения')
      setStatus('ОШИБКА ЗАГРУЗКИ')
    } finally {
      setBusy(false)
      inputElement.value = ''
    }
  }

  const remove = async name => {
    setConfirmDelete(null)
    setBusy(true)
    setError('')
    setStatus('УДАЛЕНИЕ…')
    try {
      await api('DELETE', { type: active, name })
      await load()
      setStatus('УДАЛЕНО')
    } catch (e) {
      setError(e.message || 'Ошибка удаления')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const saveRename = async () => {
    if (!rename?.newName.trim()) return
    setBusy(true)
    setError('')
    setStatus('ПЕРЕИМЕНОВАНИЕ…')
    try {
      await api('PATCH', {
        type: active,
        oldName: rename.oldName,
        newName: `${rename.newName.trim()}${extension(rename.oldName)}`
      })
      setRename(null)
      await load()
      setStatus('ИМЯ ИЗМЕНЕНО')
    } catch (e) {
      setError(e.message || 'Ошибка переименования')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const visibleFiles = useMemo(() => {
    const source = files[active] || []
    const filtered = query.trim()
      ? source.filter(name => name.toLowerCase().includes(query.trim().toLowerCase()))
      : source
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      if (sort === 'type') return fileMeta(a, active).localeCompare(fileMeta(b, active)) || a.localeCompare(b)
      return 0
    })
  }, [files, active, query, sort])

  useEffect(() => {
    if (active !== 'photos') return undefined
    const next = {}
    ;(files.photos || []).forEach(name => {
      next[name] = `/photos/${encodeURIComponent(name)}`
    })
    setPreviewUrls(next)
    return undefined
  }, [active, files.photos])

  if (!ok) return <div className="nyx-admin-shell"><style>{CSS}</style><form className="nyx-admin-login" onSubmit={login}><div className="brand-mark">NYX</div><div className="kicker">NYXTRYP / PRIVATE</div><h1>MEDIA CONTROL</h1><div className="sub">ADMIN ACCESS</div><input autoFocus type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Admin key"/><button disabled={busy}>{busy ? 'CHECKING…' : 'ENTER'}</button>{status && <p className="status">{status}</p>}{error && <p className="err">{error}</p>}</form></div>

  const activeCount = files[active]?.length || 0
  const progressStep = progress?.step || ''

  return <div className="nyx-admin-shell"><style>{CSS}</style><main className="nyx-admin-panel">
    <header className="topbar">
      <div className="brand-block"><div className="brand-mark">NYX</div><div><div className="kicker">NYXTRYP / PRIVATE</div><h1>MEDIA CONTROL</h1><p>CONTENT MANAGEMENT</p></div></div>
      <button className="plain exit" disabled={busy} onClick={logout}>EXIT <span>↗</span></button>
    </header>

    <section className="overview">
      <div><div className="section-label">MEDIA LIBRARY</div><div className="headline">YOUR UNIVERSE, <span>ORGANIZED.</span></div></div>
      <div className="total"><strong>{Object.values(files).reduce((sum, list) => sum + (list?.length || 0), 0)}</strong><span>TOTAL FILES</span></div>
    </section>

    <nav className="tabs">{TYPES.map(t => <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => { setActive(t.id); setStatus(''); setError(''); setProgress(null); setQuery(''); setSort('name') }}><i>{t.icon}</i><span>{t.label}</span><b>{files[t.id]?.length || 0}</b></button>)}</nav>

    <section className="toolbar">
      <button className="add" disabled={busy} onClick={() => chooseFile(null)}><span>＋</span>{active === 'photos' ? 'UPLOAD PHOTOS' : `ADD ${type.label.slice(0, -1)}`}</button>
      <div className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`SEARCH ${type.label.toLowerCase()}…`}/>{query && <button onClick={() => setQuery('')}>×</button>}</div>
      <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort files"><option value="name">NAME</option><option value="type">TYPE</option></select>
    </section>

    <input ref={input} className="upload-input" id="nyx-media-upload" type="file" accept={type.accept} multiple={active === 'photos'} onChange={upload}/>

    {progress && <section className="upload-progress"><div className="progress-head"><div><div className="kicker">UPLOAD PROCESS</div><strong>{progress.name}</strong></div><span>{progress.total > 1 ? `${progress.current}/${progress.total}` : progressStep.toUpperCase()}</span></div><div className="progress-steps"><div className={['prepare','encode','send','done'].indexOf(progressStep) >= 0 ? 'done' : ''}><b>1</b><span>PREPARE</span></div><i/><div className={['encode','send','done'].indexOf(progressStep) >= 0 ? 'done' : ''}><b>2</b><span>READ</span></div><i/><div className={['send','done'].indexOf(progressStep) >= 0 ? 'done' : ''}><b>3</b><span>SEND</span></div><i/><div className={progressStep === 'done' ? 'done' : ''}><b>4</b><span>DONE</span></div></div>{status && <div className="progress-status">{status}</div>}{error && <div className="progress-error">{error}</div>}</section>}

    <section className="media-grid">{visibleFiles.map(name => <article className="media-card" key={name}>{active === 'photos' ? <button className="thumb" onClick={() => setPhotoPreview(previewUrls[name])}><img src={previewUrls[name]} alt={name}/></button> : <div className="audio-icon">{type.icon}</div>}<div className="media-info"><strong title={name}>{name}</strong><span>{fileMeta(name, active)} · {activeCount} TOTAL</span></div><div className="media-actions"><button className="plain" disabled={busy} onClick={() => setRename({ oldName: name, newName: prettyName(name) })}>RENAME</button><button className="danger" disabled={busy} onClick={() => setConfirmDelete(name)}>DELETE</button>{active !== 'photos' && <button className="plain" disabled={busy} onClick={() => chooseFile(name)}>REPLACE</button>}</div></article>)}</section>

    {visibleFiles.length === 0 && <div className="empty">NO FILES FOUND</div>}

    {rename && <div className="modal-backdrop"><form className="modal" onSubmit={e => { e.preventDefault(); saveRename() }}><div className="kicker">EDIT MEDIA</div><h2>RENAME FILE</h2><input autoFocus value={rename.newName} onChange={e => setRename({ ...rename, newName: e.target.value })}/><div className="modal-actions"><button type="button" className="plain" onClick={() => setRename(null)}>CANCEL</button><button type="submit" disabled={busy}>SAVE</button></div></form></div>}

    {confirmDelete && <div className="modal-backdrop"><div className="modal"><div className="kicker">DANGER ZONE</div><h2>DELETE FILE?</h2><p>{confirmDelete}</p><div className="modal-actions"><button className="plain" onClick={() => setConfirmDelete(null)}>CANCEL</button><button className="danger" disabled={busy} onClick={() => remove(confirmDelete)}>DELETE</button></div></div></div>}

    {photoPreview && <div className="modal-backdrop photo-modal" onClick={() => setPhotoPreview(null)}><img src={photoPreview} alt="Preview"/></div>}

    <footer><span>{activeCount} FILES</span><span>GITHUB STORAGE</span><span>VIA NYXTRYP ADMIN</span></footer>
  </main></div>
}

const CSS = `
:root{color-scheme:dark}*{box-sizing:border-box}.nyx-admin-shell{min-height:100vh;background:#070a0e;color:#e8f6ff;font-family:Inter,system-ui,sans-serif}.nyx-admin-panel{max-width:1180px;margin:0 auto;padding:28px 24px 22px}.topbar{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(160,220,255,.12);padding-bottom:18px}.brand-block{display:flex;align-items:center;gap:14px}.brand-mark{font-weight:900;letter-spacing:.16em;font-size:20px}.kicker,.section-label{font-size:10px;letter-spacing:.2em;color:#6d9bb4}.topbar h1{margin:2px 0;font-size:20px;letter-spacing:.08em}.topbar p{margin:0;color:#6e8796;font-size:10px;letter-spacing:.14em}.plain,.danger,.add,.modal-actions button,.nyx-admin-login button{border:1px solid rgba(160,220,255,.16);background:rgba(255,255,255,.025);color:#dff4ff;padding:9px 12px;border-radius:7px;font-size:10px;letter-spacing:.12em;font-weight:700}.danger{color:#ff9a9a;border-color:rgba(255,90,90,.2)}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}.overview{display:flex;justify-content:space-between;align-items:end;padding:26px 0 18px}.headline{font-size:27px;font-weight:800;letter-spacing:.02em}.headline span{color:#77d6ff}.total{text-align:right}.total strong{display:block;font-size:27px}.total span{font-size:9px;letter-spacing:.16em;color:#6d8795}.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}.tabs button{display:flex;align-items:center;gap:9px;padding:12px;border:1px solid rgba(160,220,255,.1);background:rgba(255,255,255,.02);color:#78909e;border-radius:7px}.tabs button.active{color:#e8f8ff;border-color:rgba(119,214,255,.34);background:rgba(119,214,255,.06)}.tabs i{font-style:normal;font-size:17px}.tabs b{margin-left:auto;font-size:10px}.toolbar{display:grid;grid-template-columns:auto 1fr auto;gap:8px;margin-bottom:10px}.add{background:rgba(119,214,255,.08);border-color:rgba(119,214,255,.25);color:#bfeeff}.add span{font-size:16px}.search{display:flex;align-items:center;border:1px solid rgba(160,220,255,.1);border-radius:7px;padding:0 10px;background:rgba(255,255,255,.02)}.search input{flex:1;background:none;border:0;outline:0;color:#e8f6ff;padding:10px;font-size:12px}.search>span{color:#6d9bb4}.search button{border:0;background:none;color:#78909e;font-size:18px}.toolbar select{background:#0d1318;color:#cfe8f4;border:1px solid rgba(160,220,255,.12);border-radius:7px;padding:0 10px}.upload-input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}.upload-progress{border:1px solid rgba(119,214,255,.18);background:rgba(119,214,255,.035);border-radius:8px;padding:13px;margin-bottom:10px}.progress-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.progress-head strong{display:block;margin-top:4px;max-width:70vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.progress-head>span{font-size:9px;letter-spacing:.14em;color:#77d6ff}.progress-steps{display:grid;grid-template-columns:1fr 24px 1fr 24px 1fr 24px 1fr;align-items:center;gap:5px;margin-top:13px}.progress-steps div{display:flex;align-items:center;gap:6px;color:#506572;font-size:8px;letter-spacing:.1em}.progress-steps div.done{color:#9de4ff}.progress-steps b{width:19px;height:19px;display:grid;place-items:center;border:1px solid currentColor;border-radius:50%;font-size:9px}.progress-steps i{height:1px;background:rgba(160,220,255,.1)}.progress-status{margin-top:10px;font-size:9px;letter-spacing:.1em;color:#78a9bd}.progress-error{margin-top:8px;color:#ff8f8f;font-size:11px}.media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;max-height:calc(100vh - 355px);min-height:180px;overflow-y:auto;overflow-x:hidden;padding:2px 7px 2px 1px;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:rgba(125,205,255,.38) rgba(255,255,255,.04)}.media-grid::-webkit-scrollbar{width:8px}.media-grid::-webkit-scrollbar-track{background:rgba(255,255,255,.035);border-radius:8px}.media-grid::-webkit-scrollbar-thumb{background:rgba(125,205,255,.38);border-radius:8px;border:2px solid transparent;background-clip:padding-box}.media-card{min-width:0;border:1px solid rgba(160,220,255,.09);background:rgba(255,255,255,.018);border-radius:8px;padding:9px}.thumb{width:100%;aspect-ratio:16/10;display:block;padding:0;border:0;background:#0a0f13;overflow:hidden;border-radius:6px}.thumb img{width:100%;height:100%;object-fit:cover;display:block}.audio-icon{height:92px;display:grid;place-items:center;font-size:35px;color:#77d6ff;border-radius:6px;background:rgba(119,214,255,.035)}.media-info{padding:9px 2px 6px}.media-info strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.media-info span{display:block;margin-top:4px;color:#617b89;font-size:8px;letter-spacing:.1em}.media-actions{display:flex;gap:5px;flex-wrap:wrap}.media-actions button{font-size:8px;padding:7px 8px}.empty{text-align:center;padding:50px;color:#4f6875;font-size:10px;letter-spacing:.16em}.nyx-admin-login{width:min(380px,calc(100% - 32px));margin:18vh auto 0;padding:28px;border:1px solid rgba(160,220,255,.12);background:rgba(255,255,255,.02);border-radius:10px}.nyx-admin-login h1{margin:8px 0 2px}.nyx-admin-login .sub{color:#698391;font-size:10px;letter-spacing:.16em;margin-bottom:20px}.nyx-admin-login input{width:100%;padding:12px;background:#0b1116;border:1px solid rgba(160,220,255,.13);border-radius:7px;color:white;outline:0}.nyx-admin-login button{width:100%;margin-top:9px}.status,.err{font-size:10px;line-height:1.5}.err{color:#ff8f8f}.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px;z-index:20}.modal{width:min(430px,100%);background:#0b1116;border:1px solid rgba(160,220,255,.15);border-radius:10px;padding:22px}.modal h2{margin:6px 0 15px;font-size:20px}.modal input{width:100%;padding:11px;background:#070b0f;color:white;border:1px solid rgba(160,220,255,.13);border-radius:6px}.modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:15px}.photo-modal img{max-width:94vw;max-height:90vh;object-fit:contain;border-radius:8px}footer{display:flex;justify-content:space-between;padding-top:15px;margin-top:10px;border-top:1px solid rgba(160,220,255,.08);font-size:8px;letter-spacing:.12em;color:#506874}@media(max-width:700px){.nyx-admin-panel{padding:18px 12px}.headline{font-size:20px}.overview{padding:20px 0 13px}.tabs{grid-template-columns:repeat(2,1fr)}.toolbar{grid-template-columns:1fr auto}.toolbar .search{grid-column:1/-1;grid-row:2}.media-grid{max-height:calc(100vh - 335px);min-height:160px;padding-right:6px}.media-grid{grid-template-columns:1fr}.progress-steps{grid-template-columns:1fr 10px 1fr 10px 1fr 10px 1fr}.progress-steps span{font-size:7px}.media-actions button{flex:1}.total strong{font-size:20px}}
`

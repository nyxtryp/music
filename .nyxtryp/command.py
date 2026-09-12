from pathlib import Path

p = Path("src/components/TracksPlayer.jsx")
s = p.read_text()

# Remove temporary test text if it ever reappears.
s = s.replace('<div className="nyxtryp-auto-test">ПРИВЕТ</div>', '')
s = s.replace('ПРИВЕТ', '')

# Current layout: move the existing L/R VU windows above the existing bar spectrum.
canvas_marker = '          <canvas ref={canvasRef} className="tracks-visualizer" width={1200} height={240}/>'
vu_marker = '          <div className="nyx-vu"><div className="nyx-meter"><Meter channel="L" value={leftVU}/></div><div className="nyx-meter"><Meter channel="R" value={rightVU}/></div></div>'

if canvas_marker not in s:
    raise SystemExit("tracks-visualizer not found")
if vu_marker not in s:
    raise SystemExit("nyx-vu not found")

# Idempotent reorder: VU first, spectrum second.
old = canvas_marker + '\n' + vu_marker
new = vu_marker + '\n' + canvas_marker
if old in s:
    s = s.replace(old, new, 1)
else:
    # If already in the requested order, leave the file unchanged.
    if new not in s:
        raise SystemExit("VU/spectrum layout pattern not found")

p.write_text(s)
print("NYXTRYP: moved L/R VU above spectrum")

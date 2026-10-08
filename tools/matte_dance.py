"""Make the transparent dancer from public/videos/dance.mp4 (the original is only read).

Local only: RobustVideoMatting (ONNX) on the CPU, then VP9 + alpha WebM with no audio.
  pip install onnxruntime numpy pillow imageio-ffmpeg
  download rvm_mobilenetv3_fp32.onnx from
    https://github.com/PeterL1n/RobustVideoMatting/releases/tag/v1.0.0
  python tools/matte_dance.py path/to/rvm_mobilenetv3_fp32.onnx [path/to/clip.mp4]
Outputs public/videos/processed/dance-alpha.webm, dance-still.webp/.png and
tools/dance-review.png (sample frames on light, dark and checkerboard backgrounds)."""
import os, subprocess, sys
import numpy as np
import onnxruntime as ort
import imageio_ffmpeg
from PIL import Image

FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = sys.argv[1]
SRC = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'public/videos/dance.mp4')
OUT_DIR = os.path.join(ROOT, 'public/videos/processed')
os.makedirs(OUT_DIR, exist_ok=True)
probe = subprocess.run([FF, '-hide_banner', '-i', SRC], capture_output=True, text=True).stderr
import re
W, H = map(int, re.search(r'Video:.*?(\d{2,5})x(\d{2,5})', probe).groups())
OH = 640  # web size: ~2x the largest on-screen height
OW = round(OH * W / H / 2) * 2
STILL_FRAME = 150  # frame used for the reduced-motion / Safari still
REVIEW = {0, 75, 150, 225, 300, 375, 449}

sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ratio = np.array([0.4], np.float32)

dec = subprocess.Popen([FF, '-v', 'error', '-i', SRC, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen([
    FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', '30000/1001', '-i', '-',
    '-vf', f'scale={OW}:{OH}:flags=lanczos', '-an',
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '33', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
    '-auto-alt-ref', '0', '-metadata:s:v:0', 'alpha_mode=1',
    os.path.join(OUT_DIR, 'dance-alpha.webm')], stdin=subprocess.PIPE)

review = {}
n = 0
coverage = []
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    rgb = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    src = (rgb.astype(np.float32) / 255).transpose(2, 0, 1)[None]
    fgr, pha, *rec = sess.run(None, {'src': src, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': ratio})
    a = pha[0, 0]
    # Snap near-certain values: solid body, fully clear background; keep soft hair/motion edges.
    a = np.clip((a - 0.03) / 0.94, 0, 1)
    # fgr is RVM's background-free colour estimate: using it at soft edges removes wardrobe-coloured halos.
    col = np.where(a[..., None] > 0.97, rgb.astype(np.float32) / 255, np.clip(fgr[0].transpose(1, 2, 0), 0, 1))
    rgba = np.dstack([(col * 255).round().astype(np.uint8), (a * 255).round().astype(np.uint8)])
    enc.stdin.write(rgba.tobytes())
    coverage.append((a > 0.5).mean())
    if n in REVIEW:
        review[n] = Image.fromarray(rgba, 'RGBA').resize((OW, OH), Image.LANCZOS)
    if n == STILL_FRAME:
        review[n].save(os.path.join(OUT_DIR, 'dance-still.webp'), lossless=False, quality=88, alpha_quality=100, method=6)
        review[n].save(os.path.join(OUT_DIR, 'dance-still.png'), optimize=True)
    n += 1
    if n % 50 == 0:
        print('frame', n, flush=True)
enc.stdin.close(); enc.wait(); dec.wait()
cov = np.array(coverage)
print('frames', n, 'person coverage min/mean/max %.2f/%.2f/%.2f' % (cov.min(), cov.mean(), cov.max()),
      'largest frame-to-frame jump %.3f' % np.abs(np.diff(cov)).max())

# Review sheet: each sampled frame on light, dark and checkerboard backgrounds.
tw, th = 180, 320
sheet = Image.new('RGB', (tw * len(review), th * 3), 'white')
check = Image.new('RGB', (tw, th))
for y in range(0, th, 16):
    for x in range(0, tw, 16):
        check.paste((200, 200, 200) if (x // 16 + y // 16) % 2 else (255, 255, 255), (x, y, x + 16, y + 16))
for i, k in enumerate(sorted(review)):
    f = review[k].resize((tw, th))
    for row, bg in enumerate([Image.new('RGB', (tw, th), (251, 244, 236)), Image.new('RGB', (tw, th), (40, 28, 34)), check.copy()]):
        bg.paste(f, (0, 0), f)
        sheet.paste(bg, (i * tw, row * th))
sheet.save(os.path.join(ROOT, 'tools', 'dance-review.png'))

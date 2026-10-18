"""GLB 안의 텍스처를 지정 크기 JPEG로 줄인다. usage: python glb_tex.py in.glb out.glb 1024"""
import io, json, struct, sys
from PIL import Image

src, dst, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
b = open(src, 'rb').read()
off = 12; js = None; bn = b''
while off < len(b):
    l, t = struct.unpack('<II', b[off:off + 8]); c = b[off + 8:off + 8 + l]; off += 8 + l
    if t == 0x4E4F534A: js = json.loads(c)
    elif t == 0x004E4942: bn = c

views = js['bufferViews']
image_views = {img['bufferView']: i for i, img in enumerate(js.get('images', [])) if 'bufferView' in img}
new_bin = bytearray()
for vi, v in enumerate(views):
    start = v.get('byteOffset', 0); data = bn[start:start + v['byteLength']]
    if vi in image_views:
        im = Image.open(io.BytesIO(data)).convert('RGB')
        if max(im.size) > size: im = im.resize((size, size), Image.LANCZOS)
        out = io.BytesIO(); im.save(out, 'JPEG', quality=86); data = out.getvalue()
        js['images'][image_views[vi]]['mimeType'] = 'image/jpeg'
    while len(new_bin) % 4: new_bin.append(0)
    v['byteOffset'] = len(new_bin); v['byteLength'] = len(data); new_bin += data
while len(new_bin) % 4: new_bin.append(0)
js['buffers'][0]['byteLength'] = len(new_bin)
jb = json.dumps(js, separators=(',', ':')).encode()
while len(jb) % 4: jb += b' '
total = 12 + 8 + len(jb) + 8 + len(new_bin)
with open(dst, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(jb), 0x4E4F534A)); f.write(jb)
    f.write(struct.pack('<II', len(new_bin), 0x004E4942)); f.write(new_bin)
print(dst, total // 1024, 'KB')

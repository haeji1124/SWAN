# "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b design/3d/swan/swan.blend --python tools/blender/hero_render.py -- <job.json>
# 예 (Phase 7, devlog 24단계): 오리 {"rig": "duckling_v2_rig", "action": "duckling_v2_hop", "mode": "XYZ", "scale": 0.685, "target": [0, 0, 0.35], "shift": [-3, 1]}
#    강사 {"rig": "instructor_rig", "action": "instructor_tilt", "mode": "XYZ", "target": [3.2, 0, 0.35], "shift": [-4, -84], "hide_flag": true}
# 히어로 자리(720², 직교 2.6, 방향 (0.3,-1,0.08))로 캐릭터 동작을 렌더한다. 파일은 저장하지 않는다.
# job: {"out": 폴더, "jobs": [{"rig": ..., "action": ..., "frames": [...], "mode": "XYZ"|"QUATERNION",
#        "target": [x,y,z], "shift": [sx_px, sy_px], "prefix": "...", "hide_flag": true}]}
import json
import sys

import bpy
from mathutils import Vector

job = json.load(open(sys.argv[sys.argv.index('--') + 1], encoding='utf-8'))
scene = bpy.context.scene
cd = bpy.data.cameras.new('tmp_hero_cam')
cam = bpy.data.objects.new('tmp_hero_cam', cd)
scene.collection.objects.link(cam)
cd.type = 'ORTHO'
cd.ortho_scale = 2.6
cd.clip_end = 100
scene.camera = cam
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.film_transparent = True
d = Vector((0.3, -1, 0.08)).normalized()
report = []

for j in job['jobs']:
    rig = bpy.data.objects[j['rig']]
    if 'scale' in j:
        rig.scale = (j['scale'],) * 3  # 히어로에서 오리는 0.68배로 렌더했다 (저장하지 않으니 파일은 그대로)
    keep = {o.name for o in bpy.data.objects if o.parent == rig}
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.hide_render = not (o.name in keep and not (j.get('hide_flag') and o.name.startswith('prop_flag')))
            if o.name in keep and o.name in ('instructor', 'smile_arc0', 'smile_arc1'):
                o.hide_render = True  # 예전 메시와 눈웃음 곡선은 평소 렌더하지 않는다
    t = Vector(j['target'])
    cam.location = t + d * 10
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cd.shift_x = j['shift'][0] / 720
    cd.shift_y = j['shift'][1] / 720
    ad = rig.animation_data
    for tr in ad.nla_tracks:
        tr.mute = True
    for b in rig.pose.bones:
        b.rotation_mode = j['mode']
        b.location = (0, 0, 0)
        b.rotation_euler = (0, 0, 0)
        b.rotation_quaternion = (1, 0, 0, 0)
        b.scale = (1, 1, 1)
    ad.action = bpy.data.actions[j['action']]
    for i, f in enumerate(j['frames']):
        scene.frame_set(f)
        scene.render.filepath = f"{job['out']}/{j['prefix']}{i:03d}.png"
        bpy.ops.render.render(write_still=True)
    report.append({'prefix': j['prefix'], 'count': len(j['frames']), 'range': list(ad.action.frame_range)})

print('HERO_RENDER_DONE', json.dumps(report, ensure_ascii=False))

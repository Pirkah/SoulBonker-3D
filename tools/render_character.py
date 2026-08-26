import bpy
import math
import os
import sys

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. World background
world = bpy.data.worlds.new('StudioWorld')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.72, 0.73, 0.75, 1.0)
    bg.inputs['Strength'].default_value = 1.0
bpy.context.scene.world = world

# 2. Camera setup (Straight Front View)
cam_data = bpy.data.cameras.new('Camera')
cam_data.lens = 50
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0, -4.5, 1.25)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.camera = cam_obj

# 3. Studio Lighting (Three-Point Setup + Ambient)
light_key = bpy.data.lights.new('KeyLight', type='SUN')
light_key.energy = 3.2
light_key_obj = bpy.data.objects.new('KeyLight', light_key)
bpy.context.collection.objects.link(light_key_obj)
light_key_obj.rotation_euler = (math.radians(55), math.radians(-25), math.radians(-30))

light_fill = bpy.data.lights.new('FillLight', type='SUN')
light_fill.energy = 1.8
light_fill_obj = bpy.data.objects.new('FillLight', light_fill)
bpy.context.collection.objects.link(light_fill_obj)
light_fill_obj.rotation_euler = (math.radians(50), math.radians(35), math.radians(40))

light_rim = bpy.data.lights.new('RimLight', type='SUN')
light_rim.energy = 2.5
light_rim_obj = bpy.data.objects.new('RimLight', light_rim)
bpy.context.collection.objects.link(light_rim_obj)
light_rim_obj.rotation_euler = (math.radians(-45), 0, math.radians(180))

# 4. Render Engine settings
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items else 'BLENDER_EEVEE'
scene.render.resolution_x = 800
scene.render.resolution_y = 1066
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 95
scene.render.filepath = sys.argv[-1] if len(sys.argv) > 1 and sys.argv[-1].endswith('.jpg') else 'assets/meshy_references/tests/blender_render.jpg'

# 5. Import OBJ models passed in args
for arg in sys.argv:
    if arg.endswith('.obj') and os.path.exists(arg):
        bpy.ops.wm.obj_import(filepath=arg)

bpy.ops.render.render(write_still=True)
print(f"✅ Render complete: {scene.render.filepath}")

import bpy
import math

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper material
def create_mat(name, color, roughness=0.4, metalness=0.0, emission=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
        if emission:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = 4.0
    return mat

mat_carbon = create_mat('Titan_Carbon', (0.08, 0.09, 0.11, 1.0), roughness=0.28, metalness=0.85)
mat_steel = create_mat('Titan_Steel', (0.28, 0.30, 0.35, 1.0), roughness=0.22, metalness=0.95)
mat_red_trim = create_mat('Titan_RedTrim', (0.85, 0.08, 0.12, 1.0), roughness=0.35, metalness=0.5)
mat_cyan_glow = create_mat('Titan_CyanGlow', (0.0, 0.92, 1.0, 1.0), emission=(0.0, 0.92, 1.0, 1.0))
mat_gold = create_mat('Titan_Gold', (1.0, 0.78, 0.18, 1.0), roughness=0.2, metalness=0.9)

# 1. Heavy Exosuit Torso
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
chest = bpy.context.active_object
chest.scale = (0.75, 0.52, 0.8)
chest.data.materials.append(mat_carbon)

# Chest Armor Plating & Red Trims
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.42, depth=0.15, location=(0, -0.28, 1.55))
plate = bpy.context.active_object
plate.rotation_euler = (math.radians(90), 0, 0)
plate.scale = (1.0, 0.7, 0.9)
plate.data.materials.append(mat_red_trim)

# Arc Energy Core (Luminous Cyan)
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.12, depth=0.18, location=(0, -0.32, 1.55))
core = bpy.context.active_object
core.rotation_euler = (math.radians(90), 0, 0)
core.data.materials.append(mat_cyan_glow)

# 2. Futuristic Cyber Helmet with Horizontal Visor
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.12))
helm = bpy.context.active_object
helm.scale = (0.38, 0.42, 0.44)
helm.data.materials.append(mat_carbon)

# Angular Faceplate
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.24, depth=0.35, location=(0, -0.22, 1.98))
jaw = bpy.context.active_object
jaw.rotation_euler = (math.radians(90), 0, 0)
jaw.data.materials.append(mat_steel)

# Horizontal Glowing HUD Visor Bar
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.22, 2.18))
visor = bpy.context.active_object
visor.scale = (0.32, 0.05, 0.06)
visor.data.materials.append(mat_cyan_glow)

# 3. Angular Segmented Pauldrons (Shoulders)
for side, x in [(-1, -0.58), (1, 0.58)]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 1.75))
    p = bpy.context.active_object
    p.scale = (0.35, 0.48, 0.45)
    p.rotation_euler = (0, side * math.radians(-15), 0)
    p.data.materials.append(mat_carbon)
    
    # Red Trim Edge
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x + side*0.12, 0, 1.78))
    trim = bpy.context.active_object
    trim.scale = (0.08, 0.5, 0.48)
    trim.rotation_euler = (0, side * math.radians(-15), 0)
    trim.data.materials.append(mat_red_trim)

# 4. Heavy Mech Arms & Gauntlets
for side, x in [(-1, -0.62), (1, 0.62)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.14, depth=0.75, location=(x, 0, 1.25))
    arm = bpy.context.active_object
    arm.data.materials.append(mat_carbon)
    
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 0.95))
    hand = bpy.context.active_object
    hand.scale = (0.16, 0.22, 0.22)
    hand.data.materials.append(mat_steel)

# 5. Heavy Greaves & Sabatons (Legs & Boots)
for x in [-0.24, 0.24]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.18, depth=0.85, location=(x, 0, 0.55))
    leg = bpy.context.active_object
    leg.data.materials.append(mat_carbon)
    
    # Kneepad Guard
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -0.18, 0.72))
    knee = bpy.context.active_object
    knee.scale = (0.18, 0.12, 0.16)
    knee.data.materials.append(mat_red_trim)
    
    # Armored Foot
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -0.12, 0.12))
    boot = bpy.context.active_object
    boot.scale = (0.22, 0.48, 0.22)
    boot.data.materials.append(mat_steel)

# 6. High-Tech Plasma Blade (Right Hand)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.45, location=(-0.62, 0, 0.8))
hilt = bpy.context.active_object
hilt.data.materials.append(mat_steel)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.62, -0.15, 0.45))
blade = bpy.context.active_object
blade.scale = (0.04, 0.16, 1.2)
blade.rotation_euler = (math.radians(25), 0, 0)
blade.data.materials.append(mat_cyan_glow)

# 7. Heavy Railgun (Left Hand)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.65, -0.12, 0.85))
gun = bpy.context.active_object
gun.scale = (0.12, 0.75, 0.26)
gun.data.materials.append(mat_carbon)

# Railgun dual energy rails
bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.8, location=(0.65, -0.42, 0.92))
barrel1 = bpy.context.active_object
barrel1.rotation_euler = (math.radians(90), 0, 0)
barrel1.data.materials.append(mat_steel)

bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.8, location=(0.65, -0.42, 0.78))
barrel2 = bpy.context.active_object
barrel2.rotation_euler = (math.radians(90), 0, 0)
barrel2.data.materials.append(mat_steel)

# -------------------------------------------------------------
# CAMERA & STUDIO LIGHTING
# -------------------------------------------------------------
world = bpy.data.worlds.new('StudioWorld')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.72, 0.73, 0.75, 1.0)
    bg.inputs['Strength'].default_value = 1.0
bpy.context.scene.world = world

cam_data = bpy.data.cameras.new('Camera')
cam_data.lens = 50
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0, -4.6, 1.25)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.camera = cam_obj

# Lights
light_key = bpy.data.lights.new('KeyLight', type='SUN')
light_key.energy = 3.5
light_key_obj = bpy.data.objects.new('KeyLight', light_key)
bpy.context.collection.objects.link(light_key_obj)
light_key_obj.rotation_euler = (math.radians(55), math.radians(-25), math.radians(-30))

light_fill = bpy.data.lights.new('FillLight', type='SUN')
light_fill.energy = 2.0
light_fill_obj = bpy.data.objects.new('FillLight', light_fill)
bpy.context.collection.objects.link(light_fill_obj)
light_fill_obj.rotation_euler = (math.radians(50), math.radians(35), math.radians(40))

# Render
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1066
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 95
scene.render.filepath = 'assets/meshy_references/tests/blender_cyber_paladin.jpg'

bpy.ops.render.render(write_still=True)
print("Blender Cyber Paladin render finished!")

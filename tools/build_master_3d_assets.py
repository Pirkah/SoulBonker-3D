import bpy
import math
import os

os.makedirs('assets/models', exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_mat(name, color, roughness=0.5, metalness=0.0, emission=(0,0,0,1)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metalness
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission[:3] + (1.0,)
    return mat

# ==============================================================================
# 1. 🎓 MASTER 3D MODEL: LE PROFESSEUR D'AMPHI (Dark skin, White Sweater, Glasses)
# ==============================================================================
def build_master_professor():
    reset_scene()
    print("🛠️ Modélisation 3D du Professeur d'Amphi (Teint Noir & Tenue Réelle)...")

    # Materials
    mat_sweater = create_mat('Prof_Sweater', (0.96, 0.94, 0.90, 1.0), roughness=0.85) # White knitted sweater
    mat_shirt = create_mat('Prof_Shirt', (0.42, 0.65, 0.94, 1.0), roughness=0.45)     # Sky blue collared shirt
    mat_tie = create_mat('Prof_Tie', (0.12, 0.15, 0.32, 1.0), roughness=0.4)          # Navy necktie
    # Rich deep brown skin tone matching the lecturer photo
    mat_skin = create_mat('Prof_Skin', (0.24, 0.15, 0.10, 1.0), roughness=0.55)
    mat_hair = create_mat('Prof_Hair', (0.05, 0.04, 0.03, 1.0), roughness=0.95)       # Jet black hair
    mat_glasses = create_mat('Prof_Glasses', (0.04, 0.04, 0.04, 1.0), roughness=0.2, metalness=0.9)
    mat_pants = create_mat('Prof_Pants', (0.06, 0.08, 0.14, 1.0), roughness=0.7)      # Dark navy trousers
    mat_belt = create_mat('Prof_Belt', (0.12, 0.08, 0.06, 1.0), roughness=0.4, metalness=0.3)
    mat_buckle = create_mat('Prof_Buckle', (0.95, 0.80, 0.20, 1.0), roughness=0.2, metalness=0.95)
    mat_shoes = create_mat('Prof_Shoes', (0.72, 0.60, 0.46, 1.0), roughness=0.85)     # Beige suede shoes
    mat_pen = create_mat('Prof_PenBody', (0.88, 0.08, 0.15, 1.0), roughness=0.25, metalness=0.6)
    mat_nib = create_mat('Prof_PenNib', (1.0, 0.0, 0.2, 1.0), emission=(1.0, 0.0, 0.2, 1.0))
    mat_gold = create_mat('Prof_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.9)

    # 1.1 Torso & Knitted Sweater
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.52, depth=1.1, location=(0, 0, 1.9))
    torso = bpy.context.active_object
    torso.scale = (1.15, 0.85, 1.0)
    torso.data.materials.append(mat_sweater)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.06, location=(0, 0, 1.35))
    rib = bpy.context.active_object
    rib.scale = (1.15, 0.85, 0.8)
    rib.data.materials.append(mat_sweater)

    # 1.2 Shirt Collar & Necktie
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.28, radius2=0.18, depth=0.32, location=(0, -0.22, 2.45))
    collar = bpy.context.active_object
    collar.rotation_euler = (math.radians(20), 0, 0)
    collar.data.materials.append(mat_shirt)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.36, 2.15))
    tie = bpy.context.active_object
    tie.scale = (0.09, 0.04, 0.45)
    tie.rotation_euler = (math.radians(10), 0, 0)
    tie.data.materials.append(mat_tie)

    # 1.3 Neck, Head & Face (Black Skin Tone & Black Hair)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.15, depth=0.3, location=(0, 0, 2.55))
    neck = bpy.context.active_object
    neck.data.materials.append(mat_skin)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=16, radius=0.30, location=(0, 0, 2.85))
    head = bpy.context.active_object
    head.scale = (0.88, 0.95, 1.1)
    head.data.materials.append(mat_skin)

    # Hair (Trimmed dark curls)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=16, radius=0.32, location=(0, 0.04, 2.96))
    hair = bpy.context.active_object
    hair.scale = (0.90, 0.98, 0.85)
    hair.data.materials.append(mat_hair)

    bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.06, depth=0.12, location=(0, -0.32, 2.82))
    nose = bpy.context.active_object
    nose.rotation_euler = (math.radians(-80), 0, 0)
    nose.data.materials.append(mat_skin)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(-0.28, 0, 2.85))
    ear_l = bpy.context.active_object
    ear_l.scale = (0.4, 0.8, 1.2)
    ear_l.data.materials.append(mat_skin)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0.28, 0, 2.85))
    ear_r = bpy.context.active_object
    ear_r.scale = (0.4, 0.8, 1.2)
    ear_r.data.materials.append(mat_skin)

    # Glasses
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.015, location=(-0.12, -0.28, 2.88))
    g_l = bpy.context.active_object
    g_l.rotation_euler = (math.radians(90), 0, 0)
    g_l.data.materials.append(mat_glasses)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.015, location=(0.12, -0.28, 2.88))
    g_r = bpy.context.active_object
    g_r.rotation_euler = (math.radians(90), 0, 0)
    g_r.data.materials.append(mat_glasses)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.1, location=(0, -0.28, 2.88))
    g_bridge = bpy.context.active_object
    g_bridge.rotation_euler = (0, math.radians(90), 0)
    g_bridge.data.materials.append(mat_glasses)

    # 1.4 Arms & Hands
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.65, location=(-0.58, 0, 2.05))
    arm_lu = bpy.context.active_object
    arm_lu.rotation_euler = (math.radians(12), 0, math.radians(15))
    arm_lu.data.materials.append(mat_sweater)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.6, location=(-0.45, -0.15, 1.55))
    arm_lf = bpy.context.active_object
    arm_lf.rotation_euler = (math.radians(-35), 0, math.radians(-25))
    arm_lf.data.materials.append(mat_sweater)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.65, location=(0.58, 0, 2.05))
    arm_ru = bpy.context.active_object
    arm_ru.rotation_euler = (math.radians(15), 0, math.radians(-20))
    arm_ru.data.materials.append(mat_sweater)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.65, location=(0.75, -0.25, 1.65))
    arm_rf = bpy.context.active_object
    arm_rf.rotation_euler = (math.radians(45), math.radians(15), math.radians(-10))
    arm_rf.data.materials.append(mat_sweater)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, location=(0.85, -0.5, 1.45))
    hand_r = bpy.context.active_object
    hand_r.data.materials.append(mat_skin)

    # 1.5 Belt & Trousers
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.12, location=(0, 0, 1.3))
    belt = bpy.context.active_object
    belt.scale = (1.1, 0.8, 1.0)
    belt.data.materials.append(mat_belt)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.38, 1.3))
    buckle = bpy.context.active_object
    buckle.scale = (0.15, 0.05, 0.12)
    buckle.data.materials.append(mat_buckle)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=1.2, location=(-0.24, 0, 0.7))
    leg_l = bpy.context.active_object
    leg_l.rotation_euler = (math.radians(3), 0, math.radians(3))
    leg_l.data.materials.append(mat_pants)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=1.2, location=(0.24, 0, 0.7))
    leg_r = bpy.context.active_object
    leg_r.rotation_euler = (math.radians(-3), 0, math.radians(-3))
    leg_r.data.materials.append(mat_pants)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.26, -0.12, 0.09))
    shoe_l = bpy.context.active_object
    shoe_l.scale = (0.20, 0.46, 0.16)
    shoe_l.data.materials.append(mat_shoes)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.26, -0.12, 0.09))
    shoe_r = bpy.context.active_object
    shoe_r.scale = (0.20, 0.46, 0.16)
    shoe_r.data.materials.append(mat_shoes)

    # 1.6 Colossal Red Grading Pen ("STYLO ROUGE 0/20")
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=3.0, location=(1.1, -0.6, 1.8))
    pen_body = bpy.context.active_object
    pen_body.rotation_euler = (math.radians(-30), 0, math.radians(-15))
    pen_body.data.materials.append(mat_pen)

    bpy.ops.mesh.primitive_cone_add(radius1=0.14, depth=0.65, location=(1.35, -1.05, 3.1))
    pen_nib = bpy.context.active_object
    pen_nib.rotation_euler = (math.radians(-30), 0, math.radians(-15))
    pen_nib.data.materials.append(mat_nib)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.25, -0.9, 2.65))
    pen_clip = bpy.context.active_object
    pen_clip.scale = (0.04, 0.12, 0.6)
    pen_clip.rotation_euler = (math.radians(-30), 0, math.radians(-15))
    pen_clip.data.materials.append(mat_gold)

    bpy.ops.export_scene.gltf(filepath='assets/models/prof_boss.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/prof_boss.obj')
    print("✅ Professeur Boss 3D exporté avec succès !")

# ==============================================================================
# 2. 🚪 MASTER 3D MODEL: LA PORTE D'AMPHI ("PRENEZ LA PORTE !")
# ==============================================================================
def build_amphi_door():
    reset_scene()
    print("🛠️ Modélisation 3D de la Porte d'Amphi ('Prenez la porte !')...")

    mat_wood = create_mat('Door_Wood', (0.38, 0.22, 0.12, 1.0), roughness=0.7)
    mat_frame = create_mat('Door_Frame', (0.18, 0.12, 0.08, 1.0), roughness=0.8)
    mat_brass = create_mat('Door_Brass', (0.95, 0.80, 0.20, 1.0), roughness=0.25, metalness=0.9)
    mat_sign = create_mat('Door_Sign', (0.95, 0.95, 0.95, 1.0), roughness=0.3)

    # 2.1 Door Frame
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.5))
    frame = bpy.context.active_object
    frame.scale = (2.4, 0.35, 4.8)
    frame.data.materials.append(mat_frame)

    # 2.2 Door Left Leaf
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.55, 0, 2.4))
    door_l = bpy.context.active_object
    door_l.scale = (1.0, 0.18, 4.4)
    door_l.data.materials.append(mat_wood)

    # 2.3 Door Right Leaf
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.55, 0, 2.4))
    door_r = bpy.context.active_object
    door_r.scale = (1.0, 0.18, 4.4)
    door_r.data.materials.append(mat_wood)

    # Brass Door Handles
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.4, location=(-0.15, -0.15, 2.2))
    handle_l = bpy.context.active_object
    handle_l.rotation_euler = (0, math.radians(90), 0)
    handle_l.data.materials.append(mat_brass)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.4, location=(0.15, -0.15, 2.2))
    handle_r = bpy.context.active_object
    handle_r.rotation_euler = (0, math.radians(90), 0)
    handle_r.data.materials.append(mat_brass)

    # "AMPHI A - SORTIE" Sign on top
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 4.5))
    sign = bpy.context.active_object
    sign.scale = (1.2, 0.05, 0.35)
    sign.data.materials.append(mat_sign)

    bpy.ops.export_scene.gltf(filepath='assets/models/amphi_door.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/amphi_door.obj')
    print("✅ Porte d'Amphi 3D exportée avec succès !")

if __name__ == '__main__':
    print("🚀 Lancement de la génération Master Blender 3D...")
    build_master_professor()
    build_amphi_door()
    print("✨ Tous les modèles ont été construits et exportés avec succès !")

import bpy
import bmesh
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

def join_all_in_scene(name):
    # Select all mesh objects and join into a single master mesh
    bpy.ops.object.select_all(action='DESELECT')
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not meshes:
        return None
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    master = bpy.context.active_object
    master.name = name
    return master

# ==============================================================================
# 1. 🎓 MASTER 3D MODEL: LE PROFESSEUR D'AMPHI (Detailed Anatomy & Clothes)
# ==============================================================================
def build_master_professor():
    reset_scene()
    print("🛠️ Modélisation 3D du Professeur d'Amphi dans Blender...")

    # Palette
    mat_sweater = create_mat('Prof_Sweater', (0.96, 0.94, 0.89, 1.0), roughness=0.85) # White knitted sweater
    mat_shirt = create_mat('Prof_Shirt', (0.40, 0.65, 0.92, 1.0), roughness=0.45)     # Sky blue collared shirt
    mat_tie = create_mat('Prof_Tie', (0.15, 0.20, 0.40, 1.0), roughness=0.4)          # Navy necktie
    mat_skin = create_mat('Prof_Skin', (0.82, 0.68, 0.55, 1.0), roughness=0.55)       # Skin tone
    mat_hair = create_mat('Prof_Hair', (0.10, 0.07, 0.05, 1.0), roughness=0.9)        # Dark hair
    mat_glasses = create_mat('Prof_Glasses', (0.05, 0.05, 0.05, 1.0), roughness=0.2, metalness=0.9)
    mat_pants = create_mat('Prof_Pants', (0.07, 0.09, 0.16, 1.0), roughness=0.7)      # Dark navy trousers
    mat_belt = create_mat('Prof_Belt', (0.15, 0.10, 0.08, 1.0), roughness=0.4, metalness=0.3)
    mat_buckle = create_mat('Prof_Buckle', (0.95, 0.80, 0.20, 1.0), roughness=0.2, metalness=0.95)
    mat_shoes = create_mat('Prof_Shoes', (0.70, 0.58, 0.45, 1.0), roughness=0.85)     # Beige suede shoes
    mat_pen = create_mat('Prof_PenBody', (0.88, 0.08, 0.15, 1.0), roughness=0.25, metalness=0.6)
    mat_nib = create_mat('Prof_PenNib', (1.0, 0.0, 0.2, 1.0), emission=(1.0, 0.0, 0.2, 1.0))
    mat_gold = create_mat('Prof_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.9)

    # 1.1 Torso & Knitted Sweater
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.52, depth=1.1, location=(0, 0, 1.9))
    torso = bpy.context.active_object
    torso.scale = (1.15, 0.85, 1.0)
    torso.data.materials.append(mat_sweater)

    # Sweater Bottom Ribbing Band
    bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.06, location=(0, 0, 1.35))
    rib = bpy.context.active_object
    rib.scale = (1.15, 0.85, 0.8)
    rib.data.materials.append(mat_sweater)

    # 1.2 Shirt Collar & Necktie
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.28, radius2=0.18, depth=0.32, location=(0, -0.22, 2.45))
    collar = bpy.context.active_object
    collar.rotation_euler = (math.radians(20), 0, 0)
    collar.data.materials.append(mat_shirt)

    # Necktie
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.36, 2.15))
    tie = bpy.context.active_object
    tie.scale = (0.09, 0.04, 0.45)
    tie.rotation_euler = (math.radians(10), 0, 0)
    tie.data.materials.append(mat_tie)

    # 1.3 Neck, Head & Face
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.15, depth=0.3, location=(0, 0, 2.55))
    neck = bpy.context.active_object
    neck.data.materials.append(mat_skin)

    # Head (Sculpted Oval)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=16, radius=0.30, location=(0, 0, 2.85))
    head = bpy.context.active_object
    head.scale = (0.88, 0.95, 1.1)
    head.data.materials.append(mat_skin)

    # Hair (Styled crop on top and sides)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=16, radius=0.32, location=(0, 0.04, 2.96))
    hair = bpy.context.active_object
    hair.scale = (0.90, 0.98, 0.85)
    hair.data.materials.append(mat_hair)

    # Hair Fade on Sides
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.12, 2.9))
    hair_back = bpy.context.active_object
    hair_back.scale = (0.55, 0.25, 0.3)
    hair_back.data.materials.append(mat_hair)

    # Nose & Ears
    bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.05, depth=0.12, location=(0, -0.32, 2.82))
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

    # Glasses (Rim, bridge, temples)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.015, location=(-0.12, -0.28, 2.88))
    g_l = bpy.context.active_object
    g_l.rotation_euler = (math.radians(90), 0, 0)
    g_l.data.materials.append(mat_glasses)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.015, location=(0.12, -0.28, 2.88))
    g_r = bpy.context.active_object
    g_r.rotation_euler = (math.radians(90), 0, 0)
    g_r.data.materials.append(mat_glasses)

    # Bridge between glasses
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.1, location=(0, -0.28, 2.88))
    g_bridge = bpy.context.active_object
    g_bridge.rotation_euler = (0, math.radians(90), 0)
    g_bridge.data.materials.append(mat_glasses)

    # 1.4 Arms (Natural posture: left hand in pocket, right hand holding colossal pen)
    # Left Upper Arm
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.65, location=(-0.58, 0, 2.05))
    arm_lu = bpy.context.active_object
    arm_lu.rotation_euler = (math.radians(12), 0, math.radians(15))
    arm_lu.data.materials.append(mat_sweater)

    # Left Forearm (Angled down into pocket)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.6, location=(-0.45, -0.15, 1.55))
    arm_lf = bpy.context.active_object
    arm_lf.rotation_euler = (math.radians(-35), 0, math.radians(-25))
    arm_lf.data.materials.append(mat_sweater)

    # Right Upper Arm
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.65, location=(0.58, 0, 2.05))
    arm_ru = bpy.context.active_object
    arm_ru.rotation_euler = (math.radians(15), 0, math.radians(-20))
    arm_ru.data.materials.append(mat_sweater)

    # Right Forearm (Holding giant pen forward)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.65, location=(0.75, -0.25, 1.65))
    arm_rf = bpy.context.active_object
    arm_rf.rotation_euler = (math.radians(45), math.radians(15), math.radians(-10))
    arm_rf.data.materials.append(mat_sweater)

    # Right Hand
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, location=(0.85, -0.5, 1.45))
    hand_r = bpy.context.active_object
    hand_r.data.materials.append(mat_skin)

    # 1.5 Belt & Buckle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.12, location=(0, 0, 1.3))
    belt = bpy.context.active_object
    belt.scale = (1.1, 0.8, 1.0)
    belt.data.materials.append(mat_belt)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.38, 1.3))
    buckle = bpy.context.active_object
    buckle.scale = (0.15, 0.05, 0.12)
    buckle.data.materials.append(mat_buckle)

    # 1.6 Trousers & Legs (Creased tailored pants)
    # Left Leg
    bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=1.2, location=(-0.24, 0, 0.7))
    leg_l = bpy.context.active_object
    leg_l.rotation_euler = (math.radians(3), 0, math.radians(3))
    leg_l.data.materials.append(mat_pants)

    # Right Leg
    bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=1.2, location=(0.24, 0, 0.7))
    leg_r = bpy.context.active_object
    leg_r.rotation_euler = (math.radians(-3), 0, math.radians(-3))
    leg_r.data.materials.append(mat_pants)

    # 1.7 Suede Dress Shoes
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.26, -0.12, 0.09))
    shoe_l = bpy.context.active_object
    shoe_l.scale = (0.20, 0.46, 0.16)
    shoe_l.data.materials.append(mat_shoes)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.26, -0.12, 0.09))
    shoe_r = bpy.context.active_object
    shoe_r.scale = (0.20, 0.46, 0.16)
    shoe_r.data.materials.append(mat_shoes)

    # 1.8 Colossal Red Grading Pen ("STYLO ROUGE 0/20")
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

    # Export
    bpy.ops.export_scene.gltf(filepath='assets/models/prof_boss.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/prof_boss.obj')
    print("✅ Professeur Boss 3D master exporté avec succès !")

# ==============================================================================
# 2. ⚔️ MASTER 3D MODEL: PLAYER KNIGHT
# ==============================================================================
def build_master_player():
    reset_scene()
    print("🛠️ Modélisation 3D du Joueur dans Blender...")

    mat_armor = create_mat('Plyr_Plate', (0.16, 0.20, 0.28, 1.0), roughness=0.35, metalness=0.8)
    mat_gold = create_mat('Plyr_GoldTrim', (1.0, 0.80, 0.15, 1.0), roughness=0.25, metalness=0.95)
    mat_visor = create_mat('Plyr_CyanVisor', (0.0, 0.95, 1.0, 1.0), emission=(0.0, 0.95, 1.0, 1.0))
    mat_cloth = create_mat('Plyr_Cape', (0.75, 0.10, 0.18, 1.0), roughness=0.8)
    mat_leather = create_mat('Plyr_Leather', (0.30, 0.18, 0.10, 1.0), roughness=0.7)

    # Torso (Curved Breastplate)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.35))
    breastplate = bpy.context.active_object
    breastplate.scale = (0.72, 0.48, 0.85)
    breastplate.data.materials.append(mat_armor)

    # Gold Trim around chest
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.25, 1.45))
    chest_trim = bpy.context.active_object
    chest_trim.scale = (0.5, 0.04, 0.15)
    chest_trim.data.materials.append(mat_gold)

    # Helmet with V-shape Visor
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.05))
    helm = bpy.context.active_object
    helm.scale = (0.46, 0.48, 0.52)
    helm.data.materials.append(mat_armor)

    # Visor slit (Glowing Neon Cyan)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.25, 2.05))
    visor = bpy.context.active_object
    visor.scale = (0.36, 0.05, 0.12)
    visor.data.materials.append(mat_visor)

    # Helmet Crest / Horns
    bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.45, location=(-0.25, 0, 2.4))
    h_l = bpy.context.active_object
    h_l.rotation_euler = (0, math.radians(-25), 0)
    h_l.data.materials.append(mat_gold)

    bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.45, location=(0.25, 0, 2.4))
    h_r = bpy.context.active_object
    h_r.rotation_euler = (0, math.radians(25), 0)
    h_r.data.materials.append(mat_gold)

    # Pauldrons (Layered Heavy Shoulder Armor)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(-0.52, 0, 1.7))
    p_l = bpy.context.active_object
    p_l.scale = (1.1, 0.85, 0.7)
    p_l.data.materials.append(mat_gold)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0.52, 0, 1.7))
    p_r = bpy.context.active_object
    p_r.scale = (1.1, 0.85, 0.7)
    p_r.data.materials.append(mat_gold)

    # Flowing Cape
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.28, 1.15))
    cape = bpy.context.active_object
    cape.scale = (0.65, 0.06, 1.1)
    cape.rotation_euler = (math.radians(-12), 0, 0)
    cape.data.materials.append(mat_cloth)

    # Armored Arms & Gauntlets
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.8, location=(-0.48, 0, 1.25))
    arm_l = bpy.context.active_object
    arm_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.8, location=(0.48, 0, 1.25))
    arm_r = bpy.context.active_object
    arm_r.data.materials.append(mat_armor)

    # Legs & Greaves
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.9, location=(-0.22, 0, 0.45))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.9, location=(0.22, 0, 0.45))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_armor)

    # Boots
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.22, -0.1, 0.08))
    boot_l = bpy.context.active_object
    boot_l.scale = (0.18, 0.38, 0.16)
    boot_l.data.materials.append(mat_leather)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.22, -0.1, 0.08))
    boot_r = bpy.context.active_object
    boot_r.scale = (0.18, 0.38, 0.16)
    boot_r.data.materials.append(mat_leather)

    bpy.ops.export_scene.gltf(filepath='assets/models/player.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/player.obj')
    print("✅ Player Character 3D master exporté avec succès !")

# ==============================================================================
# 3. 🔨 MASTER 3D MODEL: COLOSSAL MEGABONK CLUB
# ==============================================================================
def build_master_club():
    reset_scene()
    print("🛠️ Modélisation 3D de la Masse Colossale dans Blender...")

    mat_wood = create_mat('Wep_DarkWood', (0.30, 0.18, 0.10, 1.0), roughness=0.8)
    mat_metal = create_mat('Wep_ForgedIron', (0.42, 0.45, 0.52, 1.0), roughness=0.3, metalness=0.88)
    mat_gold = create_mat('Wep_GoldStuds', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.95)
    mat_core = create_mat('Wep_RunicGem', (0.0, 1.0, 0.85, 1.0), emission=(0.0, 1.0, 0.85, 1.0))

    # Heavy Grip & Pommel
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=2.4, location=(0, 0, 1.1))
    shaft = bpy.context.active_object
    shaft.data.materials.append(mat_wood)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0, 0, -0.1))
    pommel = bpy.context.active_object
    pommel.data.materials.append(mat_gold)

    # Massive Club Head (Octagonal Reinforced Striking Surface)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.35, depth=1.2, location=(0, 0, 2.0))
    head = bpy.context.active_object
    head.data.materials.append(mat_metal)

    # 8 Iron Spikes around the head
    for i in range(8):
        angle = i * (math.pi / 4)
        bpy.ops.mesh.primitive_cone_add(radius1=0.10, depth=0.38, location=(math.sin(angle)*0.38, math.cos(angle)*0.38, 1.9 + (i % 2)*0.25))
        spike = bpy.context.active_object
        spike.rotation_euler = (0, 0, -angle + math.pi/2)
        spike.data.materials.append(mat_gold)

    # Inset Glowing Runic Power Core
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.22, subdivisions=2, location=(0, 0, 2.65))
    core = bpy.context.active_object
    core.data.materials.append(mat_core)

    bpy.ops.export_scene.gltf(filepath='assets/models/megabonk_club.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/megabonk_club.obj')
    print("✅ Megabonk Club 3D master exporté avec succès !")

if __name__ == '__main__':
    print("🚀 Début de la construction des assets 3D Master via Blender 5.2.1 LTS...")
    build_master_professor()
    build_master_player()
    build_master_club()
    print("✨ Tous les assets 3D Master ont été générés et exportés avec succès !")

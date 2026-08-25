import bpy
import math
import os

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_material(name, diffuse_color, roughness=0.5, metalness=0.0, emission=(0,0,0,1)):
    mat = bpy.data.materials.new(name=name)
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = diffuse_color
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metalness
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission[:3] + (1.0,)
    return mat

os.makedirs('assets/models', exist_ok=True)

# ==============================================================================
# 1. 🎓 PROFESSEUR D'AMPHI (3D BOSS MODEL)
# ==============================================================================
def build_professor_boss():
    reset_scene()
    
    mat_sweater = create_material('Mat_Sweater', (0.95, 0.93, 0.88, 1.0), roughness=0.8) # White/Cream sweater
    mat_collar = create_material('Mat_Collar', (0.45, 0.65, 0.95, 1.0), roughness=0.5)   # Light blue shirt
    mat_skin = create_material('Mat_Skin', (0.85, 0.72, 0.58, 1.0), roughness=0.6)       # Face skin
    mat_hair = create_material('Mat_Hair', (0.12, 0.08, 0.05, 1.0), roughness=0.9)       # Dark hair
    mat_pants = create_material('Mat_Pants', (0.08, 0.11, 0.18, 1.0), roughness=0.7)     # Navy trousers
    mat_shoes = create_material('Mat_Shoes', (0.75, 0.65, 0.50, 1.0), roughness=0.9)     # Beige shoes
    mat_glasses = create_material('Mat_Glasses', (0.05, 0.05, 0.05, 1.0), roughness=0.2, metalness=0.8)
    mat_pen_body = create_material('Mat_Pen', (0.90, 0.08, 0.15, 1.0), roughness=0.3, metalness=0.5)
    mat_pen_nib = create_material('Mat_PenNib', (1.0, 0.0, 0.2, 1.0), emission=(1.0, 0.0, 0.2, 1.0))
    mat_gold = create_material('Mat_Gold', (1.0, 0.84, 0.0, 1.0), roughness=0.2, metalness=0.9)

    # 1. Torso (Sweater)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=1.3, location=(0, 0, 1.95))
    torso = bpy.context.active_object
    torso.name = "Prof_Torso"
    torso.data.materials.append(mat_sweater)

    # 2. V-Neck Collar & Shirt
    bpy.ops.mesh.primitive_cone_add(radius1=0.35, radius2=0.15, depth=0.35, location=(0, -0.25, 2.45))
    collar = bpy.context.active_object
    collar.name = "Prof_Collar"
    collar.rotation_euler = (math.radians(25), 0, 0)
    collar.data.materials.append(mat_collar)

    # 3. Head & Face
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.32, location=(0, 0, 2.85))
    head = bpy.context.active_object
    head.name = "Prof_Head"
    head.scale = (0.9, 0.95, 1.05)
    head.data.materials.append(mat_skin)

    # Hair
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.33, location=(0, 0.05, 2.95))
    hair = bpy.context.active_object
    hair.name = "Prof_Hair"
    hair.scale = (0.92, 0.98, 0.8)
    hair.data.materials.append(mat_hair)

    # Glasses Frame
    bpy.ops.mesh.primitive_torus_add(major_radius=0.10, minor_radius=0.02, location=(-0.13, -0.30, 2.88))
    g_left = bpy.context.active_object
    g_left.rotation_euler = (math.radians(90), 0, 0)
    g_left.data.materials.append(mat_glasses)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.10, minor_radius=0.02, location=(0.13, -0.30, 2.88))
    g_right = bpy.context.active_object
    g_right.rotation_euler = (math.radians(90), 0, 0)
    g_right.data.materials.append(mat_glasses)

    # 4. Arms
    bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=1.1, location=(-0.65, 0, 1.95))
    arm_l = bpy.context.active_object
    arm_l.name = "Prof_ArmL"
    arm_l.rotation_euler = (math.radians(10), 0, math.radians(15))
    arm_l.data.materials.append(mat_sweater)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=1.1, location=(0.65, 0, 1.95))
    arm_r = bpy.context.active_object
    arm_r.name = "Prof_ArmR"
    arm_r.rotation_euler = (math.radians(10), 0, math.radians(-15))
    arm_r.data.materials.append(mat_sweater)

    # 5. Legs
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=1.3, location=(-0.24, 0, 0.75))
    leg_l = bpy.context.active_object
    leg_l.name = "Prof_LegL"
    leg_l.data.materials.append(mat_pants)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=1.3, location=(0.24, 0, 0.75))
    leg_r = bpy.context.active_object
    leg_r.name = "Prof_LegR"
    leg_r.data.materials.append(mat_pants)

    # 6. Suede Loafers / Shoes
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.24, -0.1, 0.08))
    shoe_l = bpy.context.active_object
    shoe_l.name = "Prof_ShoeL"
    shoe_l.scale = (0.22, 0.45, 0.16)
    shoe_l.data.materials.append(mat_shoes)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.24, -0.1, 0.08))
    shoe_r = bpy.context.active_object
    shoe_r.name = "Prof_ShoeR"
    shoe_r.scale = (0.22, 0.45, 0.16)
    shoe_r.data.materials.append(mat_shoes)

    # 7. Colossal Red Grading Pen ("STYLO ROUGE 0/20")
    bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=2.8, location=(1.1, -0.3, 2.0))
    pen = bpy.context.active_object
    pen.name = "Prof_ColossalPen"
    pen.rotation_euler = (math.radians(-20), 0, math.radians(-15))
    pen.data.materials.append(mat_pen_body)

    bpy.ops.mesh.primitive_cone_add(radius1=0.14, depth=0.6, location=(1.1, -0.3, 3.5))
    nib = bpy.context.active_object
    nib.name = "Prof_PenNib"
    nib.rotation_euler = (math.radians(-20), 0, math.radians(-15))
    nib.data.materials.append(mat_pen_nib)

    # Gold Pen Clip
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.05, -0.4, 3.1))
    clip = bpy.context.active_object
    clip.scale = (0.04, 0.12, 0.5)
    clip.rotation_euler = (math.radians(-20), 0, math.radians(-15))
    clip.data.materials.append(mat_gold)

    bpy.ops.export_scene.gltf(filepath='assets/models/prof_boss.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/prof_boss.obj')
    print("✅ Professeur Boss 3D exporté !")

# ==============================================================================
# 2. ⚔️ PLAYER CHARACTER (SOULS-LIKE MEGABONK KNIGHT)
# ==============================================================================
def build_player_character():
    reset_scene()

    mat_armor = create_material('Mat_Armor', (0.15, 0.18, 0.25, 1.0), roughness=0.4, metalness=0.7)
    mat_gold = create_material('Mat_GoldTrim', (1.0, 0.8, 0.2, 1.0), roughness=0.3, metalness=0.9)
    mat_visor = create_material('Mat_Visor', (0.0, 0.94, 1.0, 1.0), emission=(0.0, 0.94, 1.0, 1.0))
    mat_cape = create_material('Mat_Cape', (0.7, 0.1, 0.15, 1.0), roughness=0.8)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.35))
    chest = bpy.context.active_object
    chest.name = "Player_Chest"
    chest.scale = (0.7, 0.45, 0.8)
    chest.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, location=(-0.52, 0, 1.7))
    p_l = bpy.context.active_object
    p_l.scale = (1.0, 0.8, 0.6)
    p_l.data.materials.append(mat_gold)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, location=(0.52, 0, 1.7))
    p_r = bpy.context.active_object
    p_r.scale = (1.0, 0.8, 0.6)
    p_r.data.materials.append(mat_gold)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.05))
    helmet = bpy.context.active_object
    helmet.scale = (0.45, 0.45, 0.5)
    helmet.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.24, 2.05))
    visor = bpy.context.active_object
    visor.scale = (0.35, 0.06, 0.14)
    visor.data.materials.append(mat_visor)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.26, 1.15))
    cape = bpy.context.active_object
    cape.scale = (0.6, 0.05, 1.0)
    cape.rotation_euler = (math.radians(-10), 0, 0)
    cape.data.materials.append(mat_cape)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.8, location=(-0.48, 0, 1.25))
    arm_l = bpy.context.active_object
    arm_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.8, location=(0.48, 0, 1.25))
    arm_r = bpy.context.active_object
    arm_r.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.9, location=(-0.22, 0, 0.45))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.9, location=(0.22, 0, 0.45))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_armor)

    bpy.ops.export_scene.gltf(filepath='assets/models/player.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/player.obj')
    print("✅ Player Character 3D exporté !")

# ==============================================================================
# 3. 🔨 COLOSSAL MEGABONK CLUB & WEAPONS
# ==============================================================================
def build_weapons():
    reset_scene()

    mat_wood = create_material('Mat_Wood', (0.35, 0.22, 0.12, 1.0), roughness=0.8)
    mat_metal = create_material('Mat_Iron', (0.45, 0.48, 0.55, 1.0), roughness=0.3, metalness=0.85)
    mat_spikes = create_material('Mat_Spikes', (0.85, 0.85, 0.9, 1.0), roughness=0.2, metalness=0.95)
    mat_energy = create_material('Mat_Energy', (0.0, 1.0, 0.8, 1.0), emission=(0.0, 1.0, 0.8, 1.0))

    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=2.4, location=(0, 0, 1.2))
    shaft = bpy.context.active_object
    shaft.name = "Weapon_Shaft"
    shaft.data.materials.append(mat_wood)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.2))
    head = bpy.context.active_object
    head.name = "Weapon_Head"
    head.scale = (0.48, 0.48, 0.8)
    head.data.materials.append(mat_metal)

    for i in range(4):
        angle = i * (math.pi / 2)
        bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.4, location=(math.sin(angle)*0.45, math.cos(angle)*0.45, 2.2))
        spike = bpy.context.active_object
        spike.rotation_euler = (0, 0, -angle)
        spike.data.materials.append(mat_spikes)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.25, subdivisions=2, location=(0, 0, 2.2))
    gem = bpy.context.active_object
    gem.data.materials.append(mat_energy)

    bpy.ops.export_scene.gltf(filepath='assets/models/megabonk_club.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/megabonk_club.obj')
    print("✅ Megabonk Club 3D exporté !")

# ==============================================================================
# 4. 👾 ENEMIES (BONKLING, BRUTE, MAGE)
# ==============================================================================
def build_enemies():
    # 4A. Bonkling Goblin
    reset_scene()
    mat_goblin = create_material('Mat_Goblin', (0.2, 0.7, 0.3, 1.0), roughness=0.6)
    mat_eyes = create_material('Mat_RedEyes', (1.0, 0.0, 0.1, 1.0), emission=(1.0, 0.0, 0.1, 1.0))
    mat_wood = create_material('Mat_Wood', (0.35, 0.22, 0.12, 1.0), roughness=0.8)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.5, subdivisions=2, location=(0, 0, 0.6))
    body = bpy.context.active_object
    body.data.materials.append(mat_goblin)

    # Ears
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.5, location=(-0.45, 0, 0.8))
    ear_l = bpy.context.active_object
    ear_l.rotation_euler = (0, math.radians(-45), 0)
    ear_l.data.materials.append(mat_goblin)

    bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.5, location=(0.45, 0, 0.8))
    ear_r = bpy.context.active_object
    ear_r.rotation_euler = (0, math.radians(45), 0)
    ear_r.data.materials.append(mat_goblin)

    # Eyes
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(-0.18, -0.42, 0.7))
    eye_l = bpy.context.active_object
    eye_l.data.materials.append(mat_eyes)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(0.18, -0.42, 0.7))
    eye_r = bpy.context.active_object
    eye_r.data.materials.append(mat_eyes)

    # Little Club
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.9, location=(0.5, -0.2, 0.6))
    club = bpy.context.active_object
    club.rotation_euler = (math.radians(20), 0, math.radians(-30))
    club.data.materials.append(mat_wood)

    bpy.ops.export_scene.gltf(filepath='assets/models/bonkling.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/bonkling.obj')
    print("✅ Bonkling 3D exporté !")

    # 4B. Hammer Brute (Armored Juggernaut)
    reset_scene()
    mat_stone = create_material('Mat_DarkStone', (0.22, 0.25, 0.32, 1.0), roughness=0.8)
    mat_horns = create_material('Mat_Horns', (0.8, 0.15, 0.15, 1.0), roughness=0.4)
    mat_iron = create_material('Mat_Iron', (0.5, 0.52, 0.58, 1.0), roughness=0.3, metalness=0.8)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.3))
    torso = bpy.context.active_object
    torso.scale = (1.4, 1.0, 1.2)
    torso.data.materials.append(mat_stone)

    # Giant Horns
    bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.8, location=(-0.6, 0, 2.0))
    horn_l = bpy.context.active_object
    horn_l.rotation_euler = (0, 0, math.radians(35))
    horn_l.data.materials.append(mat_horns)

    bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.8, location=(0.6, 0, 2.0))
    horn_r = bpy.context.active_object
    horn_r.rotation_euler = (0, 0, math.radians(-35))
    horn_r.data.materials.append(mat_horns)

    # Colossal Hammer
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=2.4, location=(1.0, -0.2, 1.2))
    h_shaft = bpy.context.active_object
    h_shaft.data.materials.append(mat_stone)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.0, -0.2, 2.3))
    h_head = bpy.context.active_object
    h_head.scale = (0.7, 1.2, 0.7)
    h_head.data.materials.append(mat_iron)

    bpy.ops.export_scene.gltf(filepath='assets/models/hammer_brute.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/hammer_brute.obj')
    print("✅ Hammer Brute 3D exporté !")

    # 4C. Void Mage (Hovering Sorcerer)
    reset_scene()
    mat_robe = create_material('Mat_VoidRobe', (0.28, 0.08, 0.42, 1.0), roughness=0.7)
    mat_void = create_material('Mat_VoidGlow', (0.8, 0.0, 1.0, 1.0), emission=(0.8, 0.0, 1.0, 1.0))
    mat_crystal = create_material('Mat_Crystal', (0.0, 1.0, 1.0, 1.0), emission=(0.0, 1.0, 1.0, 1.0))

    bpy.ops.mesh.primitive_cone_add(radius1=0.7, depth=1.8, location=(0, 0, 1.1))
    robe = bpy.context.active_object
    robe.data.materials.append(mat_robe)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(0, 0, 1.7))
    core = bpy.context.active_object
    core.data.materials.append(mat_void)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.28, subdivisions=2, location=(0.7, -0.3, 1.5))
    cryst = bpy.context.active_object
    cryst.data.materials.append(mat_crystal)

    bpy.ops.export_scene.gltf(filepath='assets/models/void_mage.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/void_mage.obj')
    print("✅ Void Mage 3D exporté !")

# ==============================================================================
# 5. 🏛️ ARENA PILLARS & PROPS
# ==============================================================================
def build_arena_props():
    reset_scene()

    mat_stone = create_material('Mat_AncientStone', (0.28, 0.32, 0.40, 1.0), roughness=0.9)
    mat_runes = create_material('Mat_RuneGlow', (0.0, 0.8, 1.0, 1.0), emission=(0.0, 0.8, 1.0, 1.0))

    bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=0.6, location=(0, 0, 0.3))
    base = bpy.context.active_object
    base.data.materials.append(mat_stone)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.85, depth=5.5, location=(0, 0, 3.2))
    col = bpy.context.active_object
    col.data.materials.append(mat_stone)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.92, minor_radius=0.08, location=(0, 0, 3.2))
    rune = bpy.context.active_object
    rune.data.materials.append(mat_runes)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 6.2))
    top = bpy.context.active_object
    top.scale = (2.0, 2.0, 0.8)
    top.data.materials.append(mat_stone)

    bpy.ops.export_scene.gltf(filepath='assets/models/arena_pillar.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/arena_pillar.obj')
    print("✅ Arena Pillar 3D exporté !")

if __name__ == '__main__':
    print("🚀 Lancement de la suite complète de modélisation 3D avec Blender...")
    build_professor_boss()
    build_player_character()
    build_weapons()
    build_enemies()
    build_arena_props()
    print("✨ Tous les modèles 3D Blender (.glb et .obj) ont été créés et exportés !")

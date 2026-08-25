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
# 1. 🏹 ARCHER (Ranger / Chasseur)
# ==============================================================================
def build_archer():
    reset_scene()
    print("🛠️ Modélisation 3D de l'Archer dans Blender...")

    mat_leather = create_mat('Arch_Leather', (0.28, 0.18, 0.10, 1.0), roughness=0.75)
    mat_green = create_mat('Arch_Tunic', (0.12, 0.35, 0.18, 1.0), roughness=0.85)
    mat_gold = create_mat('Arch_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.9)
    mat_skin = create_mat('Arch_Skin', (0.85, 0.68, 0.55, 1.0), roughness=0.55)
    mat_feather = create_mat('Arch_Feather', (0.95, 0.20, 0.20, 1.0), roughness=0.4)

    # Torso & Tunic
    bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=0.9, location=(0, 0, 1.35))
    torso = bpy.context.active_object
    torso.data.materials.append(mat_green)

    # Leather Belt with Gold Buckle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.12, location=(0, 0, 1.05))
    belt = bpy.context.active_object
    belt.data.materials.append(mat_leather)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.36, 1.05))
    buckle = bpy.context.active_object
    buckle.scale = (0.12, 0.04, 0.1)
    buckle.data.materials.append(mat_gold)

    # Head & Hood
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, location=(0, 0, 2.05))
    head = bpy.context.active_object
    head.scale = (0.9, 0.95, 1.1)
    head.data.materials.append(mat_skin)

    # Hood Cowl
    bpy.ops.mesh.primitive_cone_add(radius1=0.36, radius2=0.08, depth=0.6, location=(0, 0.06, 2.15))
    hood = bpy.context.active_object
    hood.rotation_euler = (math.radians(-15), 0, 0)
    hood.data.materials.append(mat_green)

    # Feather on hood
    bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.45, location=(-0.22, 0.1, 2.45))
    feather = bpy.context.active_object
    feather.rotation_euler = (0, 0, math.radians(-35))
    feather.data.materials.append(mat_feather)

    # Quiver on Back with Arrows
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.85, location=(0.18, 0.35, 1.45))
    quiver = bpy.context.active_object
    quiver.rotation_euler = (math.radians(20), math.radians(-15), 0)
    quiver.data.materials.append(mat_leather)

    # Arrow fletchings in quiver
    for i in range(3):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.4, location=(0.16 + (i*0.04), 0.38, 1.95))
        arr = bpy.context.active_object
        arr.data.materials.append(mat_feather)

    # Arms with Leather Bracers
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.75, location=(-0.45, 0, 1.35))
    arm_l = bpy.context.active_object
    arm_l.data.materials.append(mat_green)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.75, location=(0.45, 0, 1.35))
    arm_r = bpy.context.active_object
    arm_r.data.materials.append(mat_green)

    # Legs & Boots
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.85, location=(-0.2, 0, 0.5))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_leather)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.85, location=(0.2, 0, 0.5))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_leather)

    bpy.ops.export_scene.gltf(filepath='assets/models/archer.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/archer.obj')
    print("✅ Archer 3D exporté avec succès !")

    # 1.2 Bow Weapon
    reset_scene()
    mat_wood = create_mat('Arch_BowWood', (0.35, 0.22, 0.12, 1.0), roughness=0.65)
    mat_gold_bow = create_mat('Arch_GoldString', (1.0, 0.85, 0.2, 1.0), roughness=0.2, metalness=0.9)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.04, location=(0, 0, 0))
    bow = bpy.context.active_object
    bow.scale = (0.25, 1.0, 1.0)
    bow.data.materials.append(mat_wood)

    # Bowstring
    bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=1.45, location=(-0.16, 0, 0))
    string = bpy.context.active_object
    string.data.materials.append(mat_gold_bow)

    bpy.ops.export_scene.gltf(filepath='assets/models/bow_weapon.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/bow_weapon.obj')
    print("✅ Arc 3D exporté avec succès !")

# ==============================================================================
# 2. 🧙 MAGE (Archimage / Sorcier Arcanique)
# ==============================================================================
def build_mage():
    reset_scene()
    print("🛠️ Modélisation 3D du Mage dans Blender...")

    mat_robe = create_mat('Mage_Robe', (0.16, 0.12, 0.35, 1.0), roughness=0.7)
    mat_gold_trim = create_mat('Mage_Gold', (1.0, 0.85, 0.20, 1.0), roughness=0.2, metalness=0.95)
    mat_glow = create_mat('Mage_CrystalGlow', (0.0, 0.95, 1.0, 1.0), emission=(0.0, 0.95, 1.0, 1.0))
    mat_beard = create_mat('Mage_Beard', (0.9, 0.9, 0.95, 1.0), roughness=0.9)

    # Flowing Robe Skirt (Cone down to floor)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.55, radius2=0.35, depth=1.3, location=(0, 0, 0.75))
    skirt = bpy.context.active_object
    skirt.data.materials.append(mat_robe)

    # Torso & Cape
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.36, depth=0.8, location=(0, 0, 1.45))
    torso = bpy.context.active_object
    torso.data.materials.append(mat_robe)

    # Gold sash & Runic Amulet
    bpy.ops.mesh.primitive_torus_add(major_radius=0.38, minor_radius=0.04, location=(0, 0, 1.25))
    sash = bpy.context.active_object
    sash.data.materials.append(mat_gold_trim)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.12, subdivisions=1, location=(0, -0.38, 1.55))
    amulet = bpy.context.active_object
    amulet.data.materials.append(mat_glow)

    # Head, Beard & Pointed Wizard Hat
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0, 0, 2.05))
    head = bpy.context.active_object
    head.data.materials.append(mat_beard)

    # Wizard Hat Brim
    bpy.ops.mesh.primitive_cylinder_add(radius=0.52, depth=0.06, location=(0, 0, 2.22))
    hat_brim = bpy.context.active_object
    hat_brim.data.materials.append(mat_robe)

    # Wizard Hat Cone
    bpy.ops.mesh.primitive_cone_add(radius1=0.35, depth=0.85, location=(0, 0.08, 2.65))
    hat_cone = bpy.context.active_object
    hat_cone.rotation_euler = (math.radians(-18), 0, 0)
    hat_cone.data.materials.append(mat_robe)

    # Hat Band
    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.04, location=(0, 0, 2.26))
    hat_band = bpy.context.active_object
    hat_band.data.materials.append(mat_gold_trim)

    # Draped Sleeves
    bpy.ops.mesh.primitive_cone_add(radius1=0.22, radius2=0.1, depth=0.8, location=(-0.48, 0, 1.35))
    sleeve_l = bpy.context.active_object
    sleeve_l.rotation_euler = (0, 0, math.radians(180))
    sleeve_l.data.materials.append(mat_robe)

    bpy.ops.mesh.primitive_cone_add(radius1=0.22, radius2=0.1, depth=0.8, location=(0.48, 0, 1.35))
    sleeve_r = bpy.context.active_object
    sleeve_r.rotation_euler = (0, 0, math.radians(180))
    sleeve_r.data.materials.append(mat_robe)

    bpy.ops.export_scene.gltf(filepath='assets/models/mage.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/mage.obj')
    print("✅ Mage 3D exporté avec succès !")

    # 2.2 Arcane Staff Weapon
    reset_scene()
    mat_wood = create_mat('Mage_StaffWood', (0.25, 0.15, 0.08, 1.0), roughness=0.8)
    mat_gold_ring = create_mat('Mage_StaffGold', (1.0, 0.85, 0.20, 1.0), roughness=0.2, metalness=0.95)
    mat_glow_crystal = create_mat('Mage_CrystalGlow2', (0.0, 0.95, 1.0, 1.0), emission=(0.0, 0.95, 1.0, 1.0))

    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=2.4, location=(0, 0, 1.1))
    staff_pole = bpy.context.active_object
    staff_pole.data.materials.append(mat_wood)

    # Headpiece Runic Ring
    bpy.ops.mesh.primitive_torus_add(major_radius=0.28, minor_radius=0.05, location=(0, 0, 2.25))
    ring = bpy.context.active_object
    ring.data.materials.append(mat_gold_ring)

    # Floating Arcane Crystal
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.2, subdivisions=1, location=(0, 0, 2.25))
    crystal = bpy.context.active_object
    crystal.data.materials.append(mat_glow_crystal)

    bpy.ops.export_scene.gltf(filepath='assets/models/mage_staff.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/mage_staff.obj')
    print("✅ Bâton de Mage 3D exporté avec succès !")

# ==============================================================================
# 3. ⚔️ SPACE MARINE: BLACK TEMPLARS (Warhammer 40K Heavy Power Armor)
# ==============================================================================
def build_spacemarine():
    reset_scene()
    print("🛠️ Modélisation 3D du Space Marine Black Templar dans Blender...")

    mat_armor = create_mat('BT_BlackArmor', (0.04, 0.04, 0.05, 1.0), roughness=0.3, metalness=0.85)
    mat_white_trim = create_mat('BT_WhiteTrim', (0.94, 0.94, 0.96, 1.0), roughness=0.4)
    mat_gold = create_mat('BT_ImperialGold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.95)
    mat_lenses = create_mat('BT_RedLenses', (1.0, 0.0, 0.1, 1.0), emission=(1.0, 0.0, 0.1, 1.0))

    # 3.1 Massive Mark X Torso / Aquila Chestplate
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
    chest = bpy.context.active_object
    chest.scale = (0.85, 0.62, 0.85)
    chest.data.materials.append(mat_armor)

    # Imperial Aquila / Cross on Chest
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.25, depth=0.1, location=(0, -0.34, 1.55))
    aquila = bpy.context.active_object
    aquila.rotation_euler = (math.radians(90), 0, 0)
    aquila.data.materials.append(mat_gold)

    # 3.2 Iconic Space Marine Power Backpack with Exhaust Vents
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.42, 1.6))
    backpack = bpy.context.active_object
    backpack.scale = (0.75, 0.35, 0.7)
    backpack.data.materials.append(mat_armor)

    # Left & Right Exhaust Spheres / Nozzles
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(-0.45, 0.45, 1.95))
    nozzle_l = bpy.context.active_object
    nozzle_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0.45, 0.45, 1.95))
    nozzle_r = bpy.context.active_object
    nozzle_r.data.materials.append(mat_armor)

    # 3.3 Colossal Shoulder Pauldrons (Black with White Field & Cross)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, location=(-0.65, 0, 1.8))
    pauldron_l = bpy.context.active_object
    pauldron_l.scale = (1.1, 0.9, 0.8)
    pauldron_l.data.materials.append(mat_white_trim)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, location=(0.65, 0, 1.8))
    pauldron_r = bpy.context.active_object
    pauldron_r.scale = (1.1, 0.9, 0.8)
    pauldron_r.data.materials.append(mat_white_trim)

    # 3.4 Space Marine Helmet & Glowing Red Eyepieces
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.15))
    helmet = bpy.context.active_object
    helmet.scale = (0.45, 0.48, 0.5)
    helmet.data.materials.append(mat_armor)

    # Snout / Vox Grill
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.18, depth=0.25, location=(0, -0.26, 2.05))
    grill = bpy.context.active_object
    grill.rotation_euler = (math.radians(-90), 0, 0)
    grill.data.materials.append(mat_gold)

    # Glowing Red Lenses
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.12, -0.24, 2.22))
    eye_l = bpy.context.active_object
    eye_l.scale = (0.1, 0.05, 0.06)
    eye_l.data.materials.append(mat_lenses)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.12, -0.24, 2.22))
    eye_r = bpy.context.active_object
    eye_r.scale = (0.1, 0.05, 0.06)
    eye_r.data.materials.append(mat_lenses)

    # 3.5 Heavy Armored Greaves & Boots
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=0.9, location=(-0.26, 0, 0.5))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=0.9, location=(0.26, 0, 0.5))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_armor)

    # Massive Iron Boots
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.26, -0.12, 0.12))
    boot_l = bpy.context.active_object
    boot_l.scale = (0.26, 0.52, 0.24)
    boot_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.26, -0.12, 0.12))
    boot_r = bpy.context.active_object
    boot_r.scale = (0.26, 0.52, 0.24)
    boot_r.data.materials.append(mat_armor)

    bpy.ops.export_scene.gltf(filepath='assets/models/spacemarine.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/spacemarine.obj')
    print("✅ Space Marine Black Templar 3D exporté avec succès !")

    # 3.6 Space Marine Chainsword Weapon
    reset_scene()
    mat_armor2 = create_mat('BT_ChainswordHandle', (0.05, 0.05, 0.06, 1.0), roughness=0.3, metalness=0.85)
    mat_gold2 = create_mat('BT_ChainswordGold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.95)
    mat_hazard = create_mat('BT_YellowStripes', (0.95, 0.75, 0.05, 1.0), roughness=0.4)
    mat_chainsword = create_mat('BT_ChainswordMetal', (0.45, 0.48, 0.52, 1.0), roughness=0.3, metalness=0.9)

    # Handle & Pommel
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.8, location=(0, 0, 0.35))
    handle = bpy.context.active_object
    handle.data.materials.append(mat_armor2)

    # Handguard
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.8))
    guard = bpy.context.active_object
    guard.scale = (0.45, 0.25, 0.15)
    guard.data.materials.append(mat_gold2)

    # Motor Casing (Yellow Hazard Casing)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.25))
    motor = bpy.context.active_object
    motor.scale = (0.35, 0.22, 0.75)
    motor.data.materials.append(mat_hazard)

    # Toothed Blade
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.1))
    blade = bpy.context.active_object
    blade.scale = (0.22, 0.12, 1.6)
    blade.data.materials.append(mat_chainsword)

    # Rotating Teeth along edge
    for i in range(8):
        bpy.ops.mesh.primitive_cone_add(radius1=0.06, depth=0.18, location=(0.14, 0, 1.4 + i*0.2))
        tooth = bpy.context.active_object
        tooth.rotation_euler = (0, 0, math.radians(-90))
        tooth.data.materials.append(mat_chainsword)

    bpy.ops.export_scene.gltf(filepath='assets/models/chainsword.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/chainsword.obj')
    print("✅ Chainsword 3D exportée avec succès !")

if __name__ == '__main__':
    print("🚀 Début de la construction des 3 nouvelles classes 3D dans Blender...")
    build_archer()
    build_mage()
    build_spacemarine()
    print("✨ Tous les modèles des 4 classes de personnages sont prêts !")

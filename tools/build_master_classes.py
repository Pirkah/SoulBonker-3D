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
# 1. 🛡️ CHEVALIER SOULS-LIKE (Knight of the Round Bonk)
# ==============================================================================
def build_knight():
    reset_scene()
    print("🛠️ Modélisation 3D du Chevalier dans Blender...")

    mat_steel = create_mat('Kni_Steel', (0.35, 0.38, 0.45, 1.0), roughness=0.3, metalness=0.85)
    mat_gold = create_mat('Kni_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.95)
    mat_cloth = create_mat('Kni_CapeBlue', (0.05, 0.18, 0.45, 1.0), roughness=0.85)
    mat_leather = create_mat('Kni_Leather', (0.22, 0.14, 0.08, 1.0), roughness=0.75)
    mat_visor_glow = create_mat('Kni_VisorGlow', (0.0, 0.94, 1.0, 1.0), emission=(0.0, 0.94, 1.0, 1.0))

    # Fluted Steel Breastplate
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.38, depth=0.85, location=(0, 0, 1.35))
    torso = bpy.context.active_object
    torso.scale = (1.0, 0.75, 1.0)
    torso.data.materials.append(mat_steel)

    # Gold Trim Border on Chest
    bpy.ops.mesh.primitive_torus_add(major_radius=0.4, minor_radius=0.035, location=(0, 0, 1.65))
    trim_top = bpy.context.active_object
    trim_top.scale = (1.0, 0.75, 1.0)
    trim_top.data.materials.append(mat_gold)

    # Steel Gorget / Neck Guard
    bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.2, location=(0, 0, 1.82))
    gorget = bpy.context.active_object
    gorget.data.materials.append(mat_steel)

    # Knightly Great Helm
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.26, depth=0.55, location=(0, 0, 2.15))
    helm = bpy.context.active_object
    helm.data.materials.append(mat_steel)

    # Helm Crown / Gold Trim
    bpy.ops.mesh.primitive_torus_add(major_radius=0.27, minor_radius=0.03, location=(0, 0, 2.4))
    helm_crown = bpy.context.active_object
    helm_crown.data.materials.append(mat_gold)

    # Glowing T-Slit Visor
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.26, 2.15))
    visor_h = bpy.context.active_object
    visor_h.scale = (0.28, 0.04, 0.05)
    visor_h.data.materials.append(mat_visor_glow)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.26, 2.05))
    visor_v = bpy.context.active_object
    visor_v.scale = (0.05, 0.04, 0.22)
    visor_v.data.materials.append(mat_visor_glow)

    # Steel Pauldrons (Shoulders)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, location=(-0.52, 0, 1.65))
    pauldron_l = bpy.context.active_object
    pauldron_l.scale = (0.9, 1.1, 0.8)
    pauldron_l.data.materials.append(mat_steel)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, location=(0.52, 0, 1.65))
    pauldron_r = bpy.context.active_object
    pauldron_r.scale = (0.9, 1.1, 0.8)
    pauldron_r.data.materials.append(mat_steel)

    # Flowing Cape
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0.32, 1.25))
    cape = bpy.context.active_object
    cape.scale = (0.6, 0.9, 1.0)
    cape.rotation_euler = (math.radians(12), 0, 0)
    cape.data.materials.append(mat_cloth)

    # Armored Greaves & Iron Sabatons (Legs & Boots)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.8, location=(-0.22, 0, 0.5))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_steel)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.8, location=(0.22, 0, 0.5))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_steel)

    bpy.ops.export_scene.gltf(filepath='assets/models/player.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/player.obj')
    print("✅ Chevalier 3D exporté avec succès !")

    # 1.2 Megabonk Club
    reset_scene()
    mat_darkwood = create_mat('Club_Wood', (0.22, 0.13, 0.08, 1.0), roughness=0.7)
    mat_iron = create_mat('Club_Iron', (0.28, 0.30, 0.35, 1.0), roughness=0.35, metalness=0.9)
    mat_gem = create_mat('Club_Gem', (0.0, 0.95, 1.0, 1.0), emission=(0.0, 0.95, 1.0, 1.0))

    # Shaft
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=1.8, location=(0, 0, 0.9))
    shaft = bpy.context.active_object
    shaft.data.materials.append(mat_darkwood)

    # Colossal Octagonal Spiked Head
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.38, depth=1.0, location=(0, 0, 2.0))
    head = bpy.context.active_object
    head.data.materials.append(mat_iron)

    # 8 Iron Spikes
    for i in range(8):
        angle = i * (math.pi / 4)
        x = math.cos(angle) * 0.42
        y = math.sin(angle) * 0.42
        bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.3, location=(x, y, 2.0))
        spike = bpy.context.active_object
        spike.rotation_euler = (math.sin(angle) * math.radians(90), -math.cos(angle) * math.radians(90), 0)
        spike.data.materials.append(mat_iron)

    # Runic Energy Gem at Tip
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.18, subdivisions=1, location=(0, 0, 2.55))
    gem = bpy.context.active_object
    gem.data.materials.append(mat_gem)

    bpy.ops.export_scene.gltf(filepath='assets/models/megabonk_club.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/megabonk_club.obj')
    print("✅ Massue Megabonk exportée avec succès !")

# ==============================================================================
# 2. 🏹 ARCHER / RANGER (Forest Hunter)
# ==============================================================================
def build_archer():
    reset_scene()
    print("🛠️ Modélisation 3D de l'Archer dans Blender...")

    mat_green = create_mat('Arch_GreenTunic', (0.10, 0.38, 0.16, 1.0), roughness=0.85)
    mat_leather = create_mat('Arch_Leather', (0.28, 0.18, 0.10, 1.0), roughness=0.75)
    mat_gold = create_mat('Arch_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.9)
    mat_skin = create_mat('Arch_Skin', (0.85, 0.68, 0.55, 1.0), roughness=0.55)
    mat_feather = create_mat('Arch_Feather', (0.95, 0.20, 0.20, 1.0), roughness=0.4)

    # Torso with Forest Green Leather Jerkin
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.32, depth=0.85, location=(0, 0, 1.35))
    torso = bpy.context.active_object
    torso.scale = (1.0, 0.75, 1.0)
    torso.data.materials.append(mat_green)

    # Crossed Leather Straps
    bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=0.12, location=(0, 0, 1.05))
    belt = bpy.context.active_object
    belt.data.materials.append(mat_leather)

    # Head & Hood
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0, 0, 2.05))
    head = bpy.context.active_object
    head.data.materials.append(mat_skin)

    # Pointed Archer Hood
    bpy.ops.mesh.primitive_cone_add(radius1=0.36, depth=0.65, location=(0, 0.08, 2.25))
    hood = bpy.context.active_object
    hood.rotation_euler = (math.radians(-18), 0, 0)
    hood.data.materials.append(mat_green)

    # Red Eagle Feather on Hood
    bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.48, location=(-0.24, 0.12, 2.45))
    feather = bpy.context.active_object
    feather.rotation_euler = (0, 0, math.radians(-40))
    feather.data.materials.append(mat_feather)

    # Full Back Quiver with Arrows
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.9, location=(0.2, 0.34, 1.45))
    quiver = bpy.context.active_object
    quiver.rotation_euler = (math.radians(22), math.radians(-18), 0)
    quiver.data.materials.append(mat_leather)

    for i in range(4):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.45, location=(0.16 + (i*0.035), 0.38, 1.95))
        arr = bpy.context.active_object
        arr.data.materials.append(mat_feather)

    # Leather Bracers on Arms
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.7, location=(-0.45, 0, 1.35))
    arm_l = bpy.context.active_object
    arm_l.data.materials.append(mat_green)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.7, location=(0.45, 0, 1.35))
    arm_r = bpy.context.active_object
    arm_r.data.materials.append(mat_green)

    # Agile Leather Boots
    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.85, location=(-0.18, 0, 0.5))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_leather)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.85, location=(0.18, 0, 0.5))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_leather)

    bpy.ops.export_scene.gltf(filepath='assets/models/archer.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/archer.obj')
    print("✅ Archer 3D exporté avec succès !")

    # 2.2 Composite Recurve Bow
    reset_scene()
    mat_bowwood = create_mat('Bow_Wood', (0.35, 0.22, 0.12, 1.0), roughness=0.65)
    mat_goldstring = create_mat('Bow_Gold', (1.0, 0.85, 0.2, 1.0), roughness=0.2, metalness=0.95)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.045, location=(0, 0, 0))
    bow = bpy.context.active_object
    bow.scale = (0.25, 1.0, 1.0)
    bow.data.materials.append(mat_bowwood)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=1.45, location=(-0.16, 0, 0))
    string = bpy.context.active_object
    string.data.materials.append(mat_goldstring)

    bpy.ops.export_scene.gltf(filepath='assets/models/bow_weapon.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/bow_weapon.obj')
    print("✅ Arc 3D exporté avec succès !")

# ==============================================================================
# 3. 🧙 ARCHIMAGE (Grand Sorcier des Arcanes)
# ==============================================================================
def build_mage():
    reset_scene()
    print("🛠️ Modélisation 3D du Mage dans Blender...")

    mat_robe = create_mat('Mage_Robe', (0.16, 0.10, 0.38, 1.0), roughness=0.7)
    mat_gold = create_mat('Mage_Gold', (1.0, 0.85, 0.20, 1.0), roughness=0.2, metalness=0.95)
    mat_glow = create_mat('Mage_Glow', (0.0, 0.95, 1.0, 1.0), emission=(0.0, 0.95, 1.0, 1.0))
    mat_beard = create_mat('Mage_Beard', (0.92, 0.92, 0.96, 1.0), roughness=0.9)

    # Draped Wizard Robe Skirt
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.55, radius2=0.35, depth=1.3, location=(0, 0, 0.75))
    skirt = bpy.context.active_object
    skirt.data.materials.append(mat_robe)

    # Gold Trim around hem
    bpy.ops.mesh.primitive_torus_add(major_radius=0.54, minor_radius=0.03, location=(0, 0, 0.15))
    hem = bpy.context.active_object
    hem.data.materials.append(mat_gold)

    # Torso & Mystic Mantle
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.36, depth=0.8, location=(0, 0, 1.45))
    torso = bpy.context.active_object
    torso.data.materials.append(mat_robe)

    # Levitating Arcane Chest Amulet
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.14, subdivisions=1, location=(0, -0.38, 1.55))
    amulet = bpy.context.active_object
    amulet.data.materials.append(mat_glow)

    # Head & Long Wizard Beard
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, location=(0, 0, 2.05))
    head = bpy.context.active_object
    head.data.materials.append(mat_beard)

    bpy.ops.mesh.primitive_cone_add(radius1=0.18, depth=0.55, location=(0, -0.16, 1.75))
    beard = bpy.context.active_object
    beard.rotation_euler = (math.radians(-15), 0, 0)
    beard.data.materials.append(mat_beard)

    # Classic Pointed Wizard Hat
    bpy.ops.mesh.primitive_cylinder_add(radius=0.54, depth=0.05, location=(0, 0, 2.22))
    hat_brim = bpy.context.active_object
    hat_brim.data.materials.append(mat_robe)

    bpy.ops.mesh.primitive_cone_add(radius1=0.36, depth=0.9, location=(0, 0.08, 2.68))
    hat_cone = bpy.context.active_object
    hat_cone.rotation_euler = (math.radians(-16), 0, 0)
    hat_cone.data.materials.append(mat_robe)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.035, location=(0, 0, 2.25))
    hat_band = bpy.context.active_object
    hat_band.data.materials.append(mat_gold)

    # Wide Draped Robe Sleeves
    bpy.ops.mesh.primitive_cone_add(radius1=0.24, radius2=0.12, depth=0.75, location=(-0.48, 0, 1.35))
    sleeve_l = bpy.context.active_object
    sleeve_l.rotation_euler = (0, 0, math.radians(180))
    sleeve_l.data.materials.append(mat_robe)

    bpy.ops.mesh.primitive_cone_add(radius1=0.24, radius2=0.12, depth=0.75, location=(0.48, 0, 1.35))
    sleeve_r = bpy.context.active_object
    sleeve_r.rotation_euler = (0, 0, math.radians(180))
    sleeve_r.data.materials.append(mat_robe)

    bpy.ops.export_scene.gltf(filepath='assets/models/mage.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/mage.obj')
    print("✅ Mage 3D exporté avec succès !")

    # 3.2 Floating Crystal Staff
    reset_scene()
    mat_staffwood = create_mat('Staff_Wood', (0.22, 0.14, 0.08, 1.0), roughness=0.8)
    mat_staffgold = create_mat('Staff_Gold', (1.0, 0.85, 0.20, 1.0), roughness=0.2, metalness=0.95)
    mat_staffcrystal = create_mat('Staff_Crystal', (0.0, 0.95, 1.0, 1.0), emission=(0.0, 0.95, 1.0, 1.0))

    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=2.4, location=(0, 0, 1.1))
    pole = bpy.context.active_object
    pole.data.materials.append(mat_staffwood)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.28, minor_radius=0.045, location=(0, 0, 2.25))
    ring = bpy.context.active_object
    ring.data.materials.append(mat_staffgold)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.2, subdivisions=1, location=(0, 0, 2.25))
    crystal = bpy.context.active_object
    crystal.data.materials.append(mat_staffcrystal)

    bpy.ops.export_scene.gltf(filepath='assets/models/mage_staff.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/mage_staff.obj')
    print("✅ Bâton de Mage 3D exporté avec succès !")

# ==============================================================================
# 4. ⚔️ SPACE MARINE: BLACK TEMPLARS (Warhammer 40K Mark X Power Armor)
# ==============================================================================
def build_spacemarine():
    reset_scene()
    print("🛠️ Modélisation 3D du Space Marine Black Templar dans Blender...")

    mat_armor = create_mat('BT_Armor', (0.04, 0.04, 0.05, 1.0), roughness=0.3, metalness=0.85)
    mat_white = create_mat('BT_WhiteTrim', (0.94, 0.94, 0.96, 1.0), roughness=0.4)
    mat_gold = create_mat('BT_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.95)
    mat_lenses = create_mat('BT_RedLenses', (1.0, 0.0, 0.1, 1.0), emission=(1.0, 0.0, 0.1, 1.0))
    mat_cross = create_mat('BT_MalteseCross', (0.85, 0.05, 0.05, 1.0), roughness=0.4)

    # Massive Mark X Heavy Power Armor Chestplate
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
    chest = bpy.context.active_object
    chest.scale = (0.85, 0.62, 0.85)
    chest.data.materials.append(mat_armor)

    # Golden Imperial Aquila / Winged Skull on Chest
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.26, depth=0.1, location=(0, -0.34, 1.55))
    aquila = bpy.context.active_object
    aquila.rotation_euler = (math.radians(90), 0, 0)
    aquila.data.materials.append(mat_gold)

    # Power Backpack Reactor Unit with Dual Exhaust Nozzles
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.42, 1.6))
    backpack = bpy.context.active_object
    backpack.scale = (0.75, 0.35, 0.7)
    backpack.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(-0.45, 0.45, 1.95))
    nozzle_l = bpy.context.active_object
    nozzle_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0.45, 0.45, 1.95))
    nozzle_r = bpy.context.active_object
    nozzle_r.data.materials.append(mat_armor)

    # Colossal Curved Pauldrons (White Field & Maltese Cross)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, location=(-0.65, 0, 1.8))
    pauldron_l = bpy.context.active_object
    pauldron_l.scale = (1.1, 0.9, 0.8)
    pauldron_l.data.materials.append(mat_white)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, location=(0.65, 0, 1.8))
    pauldron_r = bpy.context.active_object
    pauldron_r.scale = (1.1, 0.9, 0.8)
    pauldron_r.data.materials.append(mat_white)

    # Red Maltese Cross relief on Pauldrons
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.18, depth=0.06, location=(-0.82, 0, 1.8))
    cross_l = bpy.context.active_object
    cross_l.rotation_euler = (0, math.radians(90), 0)
    cross_l.data.materials.append(mat_cross)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.18, depth=0.06, location=(0.82, 0, 1.8))
    cross_r = bpy.context.active_object
    cross_r.rotation_euler = (0, math.radians(-90), 0)
    cross_r.data.materials.append(mat_cross)

    # Space Marine Helmet & Angry Red Eyepieces
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.15))
    helmet = bpy.context.active_object
    helmet.scale = (0.45, 0.48, 0.5)
    helmet.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.18, depth=0.25, location=(0, -0.26, 2.05))
    grill = bpy.context.active_object
    grill.rotation_euler = (math.radians(-90), 0, 0)
    grill.data.materials.append(mat_gold)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.12, -0.24, 2.22))
    eye_l = bpy.context.active_object
    eye_l.scale = (0.1, 0.05, 0.06)
    eye_l.data.materials.append(mat_lenses)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.12, -0.24, 2.22))
    eye_r = bpy.context.active_object
    eye_r.scale = (0.1, 0.05, 0.06)
    eye_r.data.materials.append(mat_lenses)

    # Armored Greaves & Heavy Sabatons
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=0.9, location=(-0.26, 0, 0.5))
    leg_l = bpy.context.active_object
    leg_l.data.materials.append(mat_armor)

    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=0.9, location=(0.26, 0, 0.5))
    leg_r = bpy.context.active_object
    leg_r.data.materials.append(mat_armor)

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

    # 4.2 Black Templar Chainsword
    reset_scene()
    mat_ch_armor = create_mat('Chain_Handle', (0.05, 0.05, 0.06, 1.0), roughness=0.3, metalness=0.85)
    mat_ch_gold = create_mat('Chain_Gold', (1.0, 0.82, 0.15, 1.0), roughness=0.2, metalness=0.95)
    mat_ch_hazard = create_mat('Chain_Hazard', (0.95, 0.75, 0.05, 1.0), roughness=0.4)
    mat_ch_steel = create_mat('Chain_Steel', (0.45, 0.48, 0.52, 1.0), roughness=0.3, metalness=0.9)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.8, location=(0, 0, 0.35))
    handle = bpy.context.active_object
    handle.data.materials.append(mat_ch_armor)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.8))
    guard = bpy.context.active_object
    guard.scale = (0.45, 0.25, 0.15)
    guard.data.materials.append(mat_ch_gold)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.25))
    motor = bpy.context.active_object
    motor.scale = (0.35, 0.22, 0.75)
    motor.data.materials.append(mat_ch_hazard)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.1))
    blade = bpy.context.active_object
    blade.scale = (0.22, 0.12, 1.6)
    blade.data.materials.append(mat_ch_steel)

    for i in range(8):
        bpy.ops.mesh.primitive_cone_add(radius1=0.06, depth=0.18, location=(0.14, 0, 1.4 + i*0.2))
        tooth = bpy.context.active_object
        tooth.rotation_euler = (0, 0, math.radians(-90))
        tooth.data.materials.append(mat_ch_steel)

    bpy.ops.export_scene.gltf(filepath='assets/models/chainsword.glb', export_format='GLB')
    bpy.ops.wm.obj_export(filepath='assets/models/chainsword.obj')
    print("✅ Chainsword 3D exportée avec succès !")

if __name__ == '__main__':
    print("🚀 Modélisation des 4 classes de personnages dans Blender...")
    build_knight()
    build_archer()
    build_mage()
    build_spacemarine()
    print("✨ Tous les modèles 3D Blender sont terminés !")

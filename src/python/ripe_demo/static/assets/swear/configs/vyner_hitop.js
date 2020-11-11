const model_data = {
    animations: ["camera_front_pan_1.glb", "mesh_scale_in_1.glb", "mesh_slide_in_1.glb"],
    general: {
        metal: {
            copper: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/metal/copper/diffuse.jpg",
                roughness: 0,
                metalness: 1
            },
            gold: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/metal/gold/diffuse.jpg",
                roughness: 0,
                metalness: 1
            },
            silver: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/metal/silver/diffuse.jpg",
                roughness: 0,
                metalness: 1
            }
        },
        crocodile: {
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/black/diffuse.jpg",
                specularMap: "general/crocodile/black/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg"
            },
            chestnut: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/chestnut/diffuse.jpg",
                specularMap: "general/crocodile/chestnut/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/navy/diffuse.jpg",
                specularMap: "general/crocodile/navy/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg"
            },
            nude: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/nude/diffuse.jpg",
                specularMap: "general/crocodile/nude/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/red/diffuse.jpg",
                specularMap: "general/crocodile/red/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg"
            },
            silver: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/silver/diffuse.jpg",
                specularMap: "general/crocodile/silver/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg",
                shininess: 100
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/crocodile/white/diffuse.jpg",
                specularMap: "general/crocodile/white/specular.jpg",
                normalMap: "general/crocodile/general/normal.jpg"
            }
        },
        python: {
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/black/diffuse.jpg",
                specularMap: "general/python/black/specular.jpg",
                normalMap: "general/python/general/normal.jpg"
            },
            gold: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/gold/diffuse.jpg",
                specularMap: "general/python/gold/specular.jpg",
                shininess: 100,
                normalMap: "general/python/general/normal.jpg"
            },
            grey: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/grey/diffuse.jpg",
                specularMap: "general/python/grey/specular.jpg",
                normalMap: "general/python/general/normal.jpg"
            },
            natural: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/natural/diffuse.jpg",
                specularMap: "general/python/natural/specular.jpg",
                normalMap: "general/python/general/normal.jpg"
            },
            neon_white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/neon_white/diffuse.jpg",
                specularMap: "general/python/neon_white/specular.jpg",
                normalMap: "general/python/general/normal.jpg"
            },
            nude: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/nude/diffuse.jpg",
                specularMap: "general/python/nude/specular.jpg",
                normalMap: "general/python/general/normal.jpg"
            },
            silver: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/silver/diffuse.jpg",
                specularMap: "general/python/silver/specular.jpg",
                shininess: 100,
                normalMap: "general/python/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "general/python/white/diffuse.jpg",
                specularMap: "general/python/white/specular.jpg",
                normalMap: "general/python/general/normal.jpg"
            }
        },
        suede: {
            beige: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/beige/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            black: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/black/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            forest_green: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/forest_green/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            grey: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/grey/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/navy/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/red/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            taupe: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/taupe/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                roughnessMap: "general/suede/general/roughness.jpg",
                map: "general/suede/white/diffuse.jpg",
                normalMap: "general/suede/general/normal.jpg"
            }
        }
    },
    initials: {
        copper: {
            aoMap: "general/ao/main_ao.jpg",
            map: "general/metal/copper/diffuse.jpg",
            roughness: 0,
            metalness: 1
        },
        gold: {
            aoMap: "general/ao/main_ao.jpg",
            map: "general/metal/gold/diffuse.jpg",
            roughness: 0,
            metalness: 1
        },
        silver: {
            aoMap: "general/ao/main_ao.jpg",
            map: "general/metal/silver/diffuse.jpg",
            roughness: 0,
            metalness: 1
        }
    },
    front: {
        grain_metallic: {
            emerald: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/grain_metallic/emerald/diffuse.jpg",
                metalness: 1,
                roughnessMap: "front_part/grain_metallic/general/roughness.jpg",
                normalMap: "front_part/grain_metallic/general/normal.jpg"
            },
            gold: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/grain_metallic/gold/diffuse.jpg",
                metalness: 1,
                roughnessMap: "front_part/grain_metallic/general/roughness.jpg",
                normalMap: "front_part/grain_metallic/general/normal.jpg"
            },
            purple: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/grain_metallic/purple/diffuse.jpg",
                metalness: 1,
                roughnessMap: "front_part/grain_metallic/general/roughness.jpg",
                normalMap: "front_part/grain_metallic/general/normal.jpg"
            },
            silver: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/grain_metallic/silver/diffuse.jpg",
                metalness: 1,
                roughnessMap: "front_part/grain_metallic/general/roughness.jpg",
                normalMap: "front_part/grain_metallic/general/normal.jpg"
            }
        },
        hairy_calf: {
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/hairy_calf/black/diffuse.jpg",
                normalMap: "front_part/hairy_calf/general/normal.jpg"
            },
            camouflage: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/hairy_calf/camouflage/diffuse.jpg",
                normalMap: "front_part/hairy_calf/general/normal.jpg"
            },
            leopard: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/hairy_calf/leopard/diffuse.jpg",
                normalMap: "front_part/hairy_calf/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/hairy_calf/navy/diffuse.jpg",
                normalMap: "front_part/hairy_calf/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/hairy_calf/red/diffuse.jpg",
                normalMap: "front_part/hairy_calf/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/hairy_calf/white/diffuse.jpg",
                normalMap: "front_part/hairy_calf/general/normal.jpg"
            }
        },
        nappa: {
            beige: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/beige/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/black/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            blush: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/blush/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            dark_cherry: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/dark_cherry/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            forest_green: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/forest_green/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            grey: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/grey/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/navy/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/red/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            taupe: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/taupe/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "front_part/nappa/white/diffuse.jpg",
                normalMap: "front_part/nappa/general/normal.jpg"
            }
        }
    },
    hardware: {},
    logo: {},
    laces: {
        nylon: {
            black: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/black/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            blush: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/blush/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            burnt_orange: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/burnt_orange/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            forest_green: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/forest_green/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            cobalt: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/cobalt/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            copper_brown: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/copper_brown/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            dark_cherry: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/dark_cherry/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            fuchsia: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/fuchsia/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            golden_yellow: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/golden_yellow/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            grey: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/grey/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/navy/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/red/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            taupe: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/taupe/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/laces_ao.jpg",
                map: "laces_part/nylon/white/diffuse.jpg",
                normalMap: "laces_part/nylon/general/normal.jpg"
            }
        }
    },
    lining: {
        calf_lining: {
            beige: {
                aoMap: "general/ao/main_ao.jpg",
                map: "lining_part/calf_lining/beige/diffuse.jpg",
                normalMap: "lining_part/calf_lining/general/normal.jpg"
            },
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "lining_part/calf_lining/black/diffuse.jpg",
                normalMap: "lining_part/calf_lining/general/normal.jpg"
            },
            tan: {
                aoMap: "general/ao/main_ao.jpg",
                map: "lining_part/calf_lining/tan/diffuse.jpg",
                normalMap: "lining_part/calf_lining/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "lining_part/calf_lining/white/diffuse.jpg",
                normalMap: "lining_part/calf_lining/general/normal.jpg"
            }
        }
    },
    side: {
        grain_metallic: {
            emerald: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/grain_metallic/emerald/diffuse.jpg",
                metalness: 1,
                roughnessMap: "side_part/grain_metallic/general/roughness.jpg",
                normalMap: "side_part/grain_metallic/general/normal.jpg"
            },
            gold: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/grain_metallic/gold/diffuse.jpg",
                metalness: 1,
                roughnessMap: "side_part/grain_metallic/general/roughness.jpg",
                normalMap: "side_part/grain_metallic/general/normal.jpg"
            },
            purple: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/grain_metallic/purple/diffuse.jpg",
                metalness: 1,
                roughnessMap: "side_part/grain_metallic/general/roughness.jpg",
                normalMap: "side_part/grain_metallic/general/normal.jpg"
            },
            silver: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/grain_metallic/silver/diffuse.jpg",
                metalness: 1,
                roughnessMap: "side_part/grain_metallic/general/roughness.jpg",
                normalMap: "side_part/grain_metallic/general/normal.jpg"
            }
        },
        hairy_calf: {
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/hairy_calf/black/diffuse.jpg",
                normalMap: "side_part/hairy_calf/general/normal.jpg"
            },
            camouflage: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/hairy_calf/camouflage/diffuse.jpg",
                normalMap: "side_part/hairy_calf/general/normal.jpg"
            },
            leopard: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/hairy_calf/leopard/diffuse.jpg",
                normalMap: "side_part/hairy_calf/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/hairy_calf/navy/diffuse.jpg",
                normalMap: "side_part/hairy_calf/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/hairy_calf/red/diffuse.jpg",
                normalMap: "side_part/hairy_calf/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/hairy_calf/white/diffuse.jpg",
                normalMap: "side_part/hairy_calf/general/normal.jpg"
            }
        },
        metallic: {
            copper: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/metallic/copper/diffuse.jpg",
                metalness: 1,
                roughness: 0.7,
                normalMap: "side_part/metallic/general/normal.jpg"
            },
            fuchsia: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/metallic/fuchsia/diffuse.jpg",
                metalness: 1,
                roughness: 0.7,
                normalMap: "side_part/metallic/general/normal.jpg"
            },
            gold: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/metallic/gold/diffuse.jpg",
                metalness: 1,
                roughness: 0.7,
                normalMap: "side_part/metallic/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/metallic/navy/diffuse.jpg",
                metalness: 1,
                roughness: 0.7,
                normalMap: "side_part/metallic/general/normal.jpg"
            },
            silver: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/metallic/silver/diffuse.jpg",
                metalness: 1,
                roughness: 0.7,
                normalMap: "side_part/metallic/general/normal.jpg"
            }
        },
        nappa: {
            beige: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/beige/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/black/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            blush: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/blush/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            dark_cherry: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/dark_cherry/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            forest_green: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/forest_green/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            grey: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/grey/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            navy: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/navy/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/red/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            taupe: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/taupe/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "side_part/nappa/white/diffuse.jpg",
                normalMap: "side_part/nappa/general/normal.jpg"
            }
        }
    },
    sole: {
        rubber: {
            black: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/black/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            },
            grey: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/grey/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            },
            pink: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/pink/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            },
            red: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/red/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            },
            tan: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/tan/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            },
            white: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/white/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            },
            yellow: {
                aoMap: "general/ao/main_ao.jpg",
                map: "sole_part/rubber/yellow/diffuse.jpg",
                normalMap: "sole_part/rubber/general/normal.jpg"
            }
        }
    }
};

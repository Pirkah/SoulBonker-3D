#!/bin/bash
cd "$(dirname "$0")"
echo "================================================="
echo "   Lancement de SoulBonker 3D (Megabonk x Souls)"
echo "   100% Hors-Ligne & Ultra-Optimisé pour Mac"
echo "================================================="
open "http://localhost:8080"
python3 -m http.server 8080

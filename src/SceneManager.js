class SceneManager {
    constructor(containerId, gridWidth, gridHeight) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = 2; // Size of each grid cell in 3D units

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f2f5); // Modern Light Gray

        // Camera (Isometric)
        const aspect = this.width / this.height;
        const d = 20;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(20, 20, 20); // Isometric angle
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(15, 25, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Grid Visuals
        this.createGridVisuals();

        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.highlightMesh = null;
        this.rangeMesh = null; // Range indicator
        this.createHighlightCursor();

        // Unit Meshes Map (id -> mesh)
        this.unitMeshes = new Map();

        // Floor overlays for facility effect ranges
        this.floorOverlays = new Map(); // unitId -> overlay mesh

        // Floating Texts
        this.floatingTexts = [];

        // Materials (Modern Palette)
        this.materials = {
            engineer: new THREE.MeshStandardMaterial({ color: 0x3b82f6 }), // Bright Blue
            marketing: new THREE.MeshStandardMaterial({ color: 0xf97316 }), // Orange
            server: new THREE.MeshStandardMaterial({ color: 0x10b981 }), // Emerald Green
            pantry: new THREE.MeshStandardMaterial({ color: 0xfacc15 }), // Yellow
            meeting: new THREE.MeshStandardMaterial({ color: 0xa855f7 }),  // Purple
            senior_engineer: new THREE.MeshStandardMaterial({ color: 0x1e3a8a }), // Dark Blue
            pm: new THREE.MeshStandardMaterial({ color: 0x9333ea }), // Purple
            manager_office: new THREE.MeshStandardMaterial({ color: 0xef4444 }), // Red
            plant: new THREE.MeshStandardMaterial({ color: 0x22c55e }) // Green
        };

        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1), // Base size, will scale
            cylinder: new THREE.CylinderGeometry(0.4, 0.4, 0.8, 32) // Staff
        };

        this.staffTypes = ['engineer', 'senior_engineer', 'marketing', 'pm'];

        // Bind resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createGridVisuals() {
        // Floor Plane
        const geometry = new THREE.PlaneGeometry(this.gridWidth * this.cellSize, this.gridHeight * this.cellSize);
        // Lighter floor for contrast
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        this.floor = new THREE.Mesh(geometry, material);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;

        // Visual Offset to center the grid
        this.gridOffset = {
            x: - (this.gridWidth * this.cellSize) / 2 + (this.cellSize / 2),
            z: - (this.gridHeight * this.cellSize) / 2 + (this.cellSize / 2)
        };

        this.floor.position.set(0, -0.1, 0);
        this.scene.add(this.floor);

        // Grid Helper - Subtle
        const gridHelper = new THREE.GridHelper(this.gridWidth * this.cellSize, this.gridWidth, 0xd1d5db, 0xe5e7eb);
        this.scene.add(gridHelper);
    }

    createHighlightCursor() {
        // Cursor
        const geometry = new THREE.PlaneGeometry(1, 1); // Base size
        const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        this.highlightMesh = new THREE.Mesh(geometry, material);
        this.highlightMesh.rotation.x = -Math.PI / 2;
        this.highlightMesh.visible = false;
        this.scene.add(this.highlightMesh);

        // Range Indicator
        const rangeGeo = new THREE.PlaneGeometry(1, 1);
        const rangeMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
        this.rangeMesh = new THREE.Mesh(rangeGeo, rangeMat);
        this.rangeMesh.rotation.x = -Math.PI / 2;
        this.rangeMesh.visible = false;
        this.scene.add(this.rangeMesh);
    }

    gridToWorld(gx, gy) {
        return {
            x: gx * this.cellSize + this.gridOffset.x,
            z: gy * this.cellSize + this.gridOffset.z
        };
    }

    worldToGrid(wx, wz) {
        const gx = Math.round((wx - this.gridOffset.x) / this.cellSize);
        const gy = Math.round((wz - this.gridOffset.z) / this.cellSize);
        return { x: gx, y: gy };
    }

    addUnitVisual(unit) {
        const material = this.materials[unit.type] || this.materials.engineer; // Fallback
        const isStaff = this.staffTypes.includes(unit.type);

        let mesh;
        const w = unit.width || 1;
        const h = unit.height || 1;

        if (isStaff) {
            mesh = new THREE.Mesh(this.geometries.cylinder, material);
            // Cylinder is 1x1 roughly
            mesh.scale.set(this.cellSize, this.cellSize, this.cellSize);
        } else {
            mesh = new THREE.Mesh(this.geometries.box, material);
            // Scale box to fit width/height
            mesh.scale.set(w * this.cellSize * 0.9, 0.8 * this.cellSize, h * this.cellSize * 0.9);
        }

        // Position
        const pos = this.gridToWorld(unit.x, unit.y);
        const offsetX = (w - 1) * this.cellSize / 2;
        const offsetZ = (h - 1) * this.cellSize / 2;

        mesh.position.set(pos.x + offsetX, this.cellSize / 2, pos.z + offsetZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add simple animation data
        mesh.userData = { yBase: mesh.position.y, offset: Math.random() * 100, isStaff: isStaff };

        this.scene.add(mesh);
        this.unitMeshes.set(unit.id, mesh);

        // Add floor overlay for facilities with effect range
        this.addFloorOverlay(unit);
    }

    addFloorOverlay(unit) {
        // Get unit definition to check effectRange
        const unitDef = window.game ? window.game.resourceManager.unitDefinitions[unit.type] : null;
        if (!unitDef || !unitDef.effectRange) return;

        // Calculate effect area
        let rLeft = 0, rRight = 0, rTop = 0, rBottom = 0;
        if (typeof unitDef.effectRange === 'object') {
            rLeft = unitDef.effectRange.left;
            rRight = unitDef.effectRange.right;
            rTop = unitDef.effectRange.top;
            rBottom = unitDef.effectRange.bottom;
        } else {
            const r = unitDef.effectRange;
            rLeft = r; rRight = r; rTop = r; rBottom = r;
        }

        const w = unit.width || 1;
        const h = unit.height || 1;
        const totalW = w + rLeft + rRight;
        const totalH = h + rTop + rBottom;

        // Create semi-transparent floor overlay
        const geometry = new THREE.PlaneGeometry(totalW * this.cellSize, totalH * this.cellSize);

        // Color based on unit type
        let color = 0x10b981; // Default green
        if (unit.type === 'server') color = 0x3b82f6; // Blue
        else if (unit.type === 'pantry') color = 0xfacc15; // Yellow
        else if (unit.type === 'manager_office') color = 0xef4444; // Red

        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const overlay = new THREE.Mesh(geometry, material);
        overlay.rotation.x = -Math.PI / 2;

        // Position overlay
        const pos = this.gridToWorld(unit.x, unit.y);
        const offsetX = (w - 1) * this.cellSize / 2;
        const offsetZ = (h - 1) * this.cellSize / 2;
        const shiftX = (rRight - rLeft) * this.cellSize / 2;
        const shiftZ = (rBottom - rTop) * this.cellSize / 2;

        overlay.position.set(pos.x + offsetX + shiftX, 0.01, pos.z + offsetZ + shiftZ);

        this.scene.add(overlay);
        this.floorOverlays.set(unit.id, overlay);
    }

    removeUnitVisual(unit) {
        const mesh = this.unitMeshes.get(unit.id);
        if (mesh) {
            this.scene.remove(mesh);
            this.unitMeshes.delete(unit.id);
        }

        // Remove floor overlay
        const overlay = this.floorOverlays.get(unit.id);
        if (overlay) {
            this.scene.remove(overlay);
            overlay.geometry.dispose();
            overlay.material.dispose();
            this.floorOverlays.delete(unit.id);
        }
    }

    spawnFloatingText(unit, text, color) {
        const texture = this.createTextTexture(text, color);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);

        const pos = this.gridToWorld(unit.x, unit.y);
        // Adjust for unit size
        const w = unit.width || 1;
        const h = unit.height || 1;
        const offsetX = (w - 1) * this.cellSize / 2;
        const offsetZ = (h - 1) * this.cellSize / 2;

        sprite.position.set(pos.x + offsetX, this.cellSize * 1.5, pos.z + offsetZ);
        sprite.scale.set(3, 1.5, 1); // Adjust scale

        this.scene.add(sprite);

        this.floatingTexts.push({
            sprite: sprite,
            life: 1.5, // 1.5 second life
            speed: 1.5
        });
    }

    createTextTexture(text, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;

        // Text Style
        ctx.fillStyle = color;
        ctx.font = 'bold 50px Inter, Arial'; // Use Inter if available
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    update(deltaTime) {
        // Animate units (bobbing)
        const time = Date.now() * 0.002;
        this.unitMeshes.forEach(mesh => {
            if (mesh.userData.isStaff) {
                // Only staff bob? Or everyone? Let's make everyone bob slightly, staff more.
                mesh.position.y = mesh.userData.yBase + Math.sin(time + mesh.userData.offset) * 0.1;
            }
        });

        // Animate Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= deltaTime;
            ft.sprite.position.y += ft.speed * deltaTime;
            ft.sprite.material.opacity = Math.max(0, ft.life); // Fade out

            if (ft.life <= 0) {
                this.scene.remove(ft.sprite);
                ft.sprite.material.map.dispose();
                ft.sprite.material.dispose();
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        const aspect = this.width / this.height;
        const d = 20;

        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    getGridPositionFromMouse(clientX, clientY) {
        // Normalized Device Coordinates
        this.mouse.x = (clientX / this.width) * 2 - 1;
        this.mouse.y = -(clientY / this.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.floor);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const gridPos = this.worldToGrid(point.x, point.z);
            return gridPos;
        }
        return null;
    }

    updateHighlight(gridPos, width = 1, height = 1, range = 0) {
        if (!gridPos || gridPos.x < 0 || gridPos.x >= this.gridWidth || gridPos.y < 0 || gridPos.y >= this.gridHeight) {
            this.highlightMesh.visible = false;
            this.rangeMesh.visible = false;
            return;
        }

        // Update Cursor
        const worldPos = this.gridToWorld(gridPos.x, gridPos.y);
        const offsetX = (width - 1) * this.cellSize / 2;
        const offsetZ = (height - 1) * this.cellSize / 2;

        this.highlightMesh.position.set(worldPos.x + offsetX, 0.05, worldPos.z + offsetZ);
        this.highlightMesh.scale.set(width * this.cellSize, height * this.cellSize, 1);
        this.highlightMesh.visible = true;

        // Update Range
        let rLeft = 0, rRight = 0, rTop = 0, rBottom = 0;
        if (typeof range === 'object') {
            rLeft = range.left || 0;
            rRight = range.right || 0;
            rTop = range.top || 0;
            rBottom = range.bottom || 0;
        } else if (range > 0) {
            rLeft = range; rRight = range; rTop = range; rBottom = range;
        }

        if (rLeft > 0 || rRight > 0 || rTop > 0 || rBottom > 0) {
            // Range Mesh needs to cover:
            // Width: unitWidth + left + right
            // Height: unitHeight + top + bottom
            // Center Offset:
            // X: (right - left) / 2 * cellSize
            // Z: (bottom - top) / 2 * cellSize

            const totalW = width + rLeft + rRight;
            const totalH = height + rTop + rBottom;

            // Calculate center of the range area relative to unit center
            // Unit center is at worldPos + offsetX, worldPos + offsetZ
            // Range area starts at unitX - left, unitY - top
            // Range area center is start + total/2

            // Let's do it relative to unit center
            const shiftX = (rRight - rLeft) * this.cellSize / 2;
            const shiftZ = (rBottom - rTop) * this.cellSize / 2;

            this.rangeMesh.position.set(
                worldPos.x + offsetX + shiftX,
                0.02,
                worldPos.z + offsetZ + shiftZ
            );
            this.rangeMesh.scale.set(totalW * this.cellSize, totalH * this.cellSize, 1);
            this.rangeMesh.visible = true;
        } else {
            this.rangeMesh.visible = false;
        }
    }

    updateUnitVisuals(units) {
        units.forEach(unit => {
            const mesh = this.unitMeshes.get(unit.id);
            if (mesh && unit.runtime) {
                if (unit.runtime.isZombie) {
                    mesh.material = new THREE.MeshStandardMaterial({ color: 0x888888 }); // Gray for Zombie
                } else {
                    // Reset to original material
                    mesh.material = this.materials[unit.type] || this.materials.engineer;
                }

                // Visual Buffs (Simple particles or color tint? Let's use floating icons or just tint for now)
                // Actually, let's add a child mesh for buffs if not present
                // Or just tint the mesh slightly?
                // Let's use a simple marker above the unit.

                // Clear old markers
                mesh.children.forEach(c => {
                    if (c.userData.isBuffMarker) mesh.remove(c);
                });

                if (unit.runtime.buffs && unit.runtime.buffs.length > 0) {
                    // Add marker
                    const markerGeo = new THREE.SphereGeometry(0.2, 8, 8);
                    let color = 0xffffff;
                    if (unit.runtime.buffs.includes('pantry')) color = 0xfacc15; // Yellow
                    else if (unit.runtime.buffs.includes('server')) color = 0x10b981; // Green
                    else if (unit.runtime.buffs.includes('manager')) color = 0xef4444; // Red

                    const markerMat = new THREE.MeshBasicMaterial({ color: color });
                    const marker = new THREE.Mesh(markerGeo, markerMat);
                    marker.position.set(0, 1.5, 0);
                    marker.userData.isBuffMarker = true;
                    mesh.add(marker);
                }
            }
        });
    }
    resize(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        // Remove old floor and grid helper
        this.scene.remove(this.floor);
        // Find grid helper (it doesn't have a specific property reference other than being in scene)
        // We can find it by type or store it.
        // In createGridVisuals, we didn't store it on 'this'. Let's fix that or find it.
        // Actually, let's just clear and recreate.

        // Better: Store gridHelper in constructor/createGridVisuals
        // Since I can't easily modify constructor without reloading file, I'll find it.
        const helpers = this.scene.children.filter(c => c.type === 'GridHelper');
        helpers.forEach(h => this.scene.remove(h));

        // Recreate visuals
        this.createGridVisuals();

        // Update Camera?
        // Camera sees the whole scene, might need to zoom out if grid gets huge.
        // But user can scroll/zoom (not implemented yet). 
        // For now, let's keep camera as is, or maybe adjust if it gets too big.
        // Let's keep it simple.
    }
}

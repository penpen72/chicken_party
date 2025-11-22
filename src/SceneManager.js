import * as THREE from 'three';

export class SceneManager {
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
        this.createHighlightCursor();

        // Unit Meshes Map (id -> mesh)
        this.unitMeshes = new Map();

        // Floating Texts
        this.floatingTexts = [];

        // Materials (Modern Palette)
        this.materials = {
            engineer: new THREE.MeshStandardMaterial({ color: 0x3b82f6 }), // Bright Blue
            marketing: new THREE.MeshStandardMaterial({ color: 0xf97316 }), // Orange
            server: new THREE.MeshStandardMaterial({ color: 0x10b981 }), // Emerald Green
            pantry: new THREE.MeshStandardMaterial({ color: 0xfacc15 }), // Yellow
            meeting: new THREE.MeshStandardMaterial({ color: 0xa855f7 })  // Purple
        };

        this.geometries = {
            box: new THREE.BoxGeometry(this.cellSize * 0.8, this.cellSize * 0.8, this.cellSize * 0.8)
        };

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
        const geometry = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
        const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        this.highlightMesh = new THREE.Mesh(geometry, material);
        this.highlightMesh.rotation.x = -Math.PI / 2;
        this.highlightMesh.visible = false;
        this.scene.add(this.highlightMesh);
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
        const mesh = new THREE.Mesh(this.geometries.box, this.materials[unit.type]);
        const pos = this.gridToWorld(unit.x, unit.y);
        mesh.position.set(pos.x, this.cellSize / 2, pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add simple animation data
        mesh.userData = { yBase: mesh.position.y, offset: Math.random() * 100 };

        this.scene.add(mesh);
        this.unitMeshes.set(unit.id, mesh);
    }

    removeUnitVisual(unit) {
        const mesh = this.unitMeshes.get(unit.id);
        if (mesh) {
            this.scene.remove(mesh);
            this.unitMeshes.delete(unit.id);
        }
    }

    spawnFloatingText(unit, text, color) {
        const texture = this.createTextTexture(text, color);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);

        const pos = this.gridToWorld(unit.x, unit.y);
        sprite.position.set(pos.x, this.cellSize * 1.5, pos.z);
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
            mesh.position.y = mesh.userData.yBase + Math.sin(time + mesh.userData.offset) * 0.1;
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

            // Update Highlight
            if (gridPos.x >= 0 && gridPos.x < this.gridWidth && gridPos.y >= 0 && gridPos.y < this.gridHeight) {
                const worldPos = this.gridToWorld(gridPos.x, gridPos.y);
                this.highlightMesh.position.set(worldPos.x, 0.05, worldPos.z);
                this.highlightMesh.visible = true;
                return gridPos;
            }
        }
        this.highlightMesh.visible = false;
        return null;
    }
}

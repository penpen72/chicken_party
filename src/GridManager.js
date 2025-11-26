class GridManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = new Array(width * height).fill(null); // Stores unit objects
        this.units = []; // List of active units

        // Reusable scratch structures to avoid per-call allocations when
        // evaluating neighbors every frame.
        this.neighborScratch = [];
        this.neighborScratchSet = new Set();
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isOccupied(x, y, w = 1, h = 1) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                if (!this.isValid(x + dx, y + dy)) return true; // Out of bounds is "occupied"
                if (this.grid[this.getIndex(x + dx, y + dy)] !== null) return true;
            }
        }
        return false;
    }

    placeUnit(x, y, type, width = 1, height = 1) {
        if (this.isOccupied(x, y, width, height)) return false;

        const unit = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y,
            width: width,
            height: height
        };

        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.grid[this.getIndex(x + dx, y + dy)] = unit;
            }
        }

        this.units.push(unit);
        return unit;
    }

    removeUnit(x, y) {
        if (!this.isValid(x, y)) return null;
        const index = this.getIndex(x, y);
        const unit = this.grid[index];

        if (unit) {
            // Clear all cells occupied by this unit
            for (let dy = 0; dy < unit.height; dy++) {
                for (let dx = 0; dx < unit.width; dx++) {
                    const idx = this.getIndex(unit.x + dx, unit.y + dy);
                    if (this.grid[idx] === unit) {
                        this.grid[idx] = null;
                    }
                }
            }
            this.units = this.units.filter(u => u !== unit);
            return unit;
        }
        return null;
    }

    getUnitAt(x, y) {
        if (!this.isValid(x, y)) return null;
        return this.grid[this.getIndex(x, y)];
    }

    getAllUnits() {
        return this.units;
    }

    getNeighbors(x, y, range = 1) {
        // Default symmetric range
        return this.getNeighborsAsymmetric(x, y, range, range, range, range);
    }

    // Returns a reused array of neighbor units (do not mutate or store long-term).
    getNeighborsAsymmetric(x, y, rLeft, rRight, rTop, rBottom) {
        const unit = this.getUnitAt(x, y);
        const w = unit ? unit.width : 1;
        const h = unit ? unit.height : 1;

        this.neighborScratchSet.clear();
        this.neighborScratch.length = 0;

        const startX = x - rLeft;
        const endX = x + w - 1 + rRight;
        const startY = y - rTop;
        const endY = y + h - 1 + rBottom;

        for (let dy = startY; dy <= endY; dy++) {
            for (let dx = startX; dx <= endX; dx++) {
                // Skip the unit's own cells
                if (dx >= x && dx < x + w && dy >= y && dy < y + h) continue;

                if (this.isValid(dx, dy)) {
                    const neighbor = this.getUnitAt(dx, dy);
                    if (neighbor && neighbor !== unit && !this.neighborScratchSet.has(neighbor)) {
                        this.neighborScratchSet.add(neighbor);
                        this.neighborScratch.push(neighbor);
                    }
                }
            }
        }
        return this.neighborScratch;
    }

    getNeighborCount(x, y, range = 1) {
        // Similar logic to getNeighbors
        const unit = this.getUnitAt(x, y);
        const w = unit ? unit.width : 1;
        const h = unit ? unit.height : 1;

        let count = 0;
        // Note: This counts occupied CELLS or UNITS? 
        // Previous implementation counted UNITS (if 1x1). 
        // Actually previous implementation:
        // if (this.isValid(nx, ny) && this.isOccupied(nx, ny)) count++;
        // This counts occupied CELLS.
        // For multi-tile units, this might double count the same neighbor unit if it occupies multiple cells in range.
        // But "crowding" usually implies density.
        // Let's stick to counting distinct UNITS for better balance with large units?
        // Or stick to occupied cells? 
        // "Crowding penalty: -2 per neighbor". If a 2x2 unit is next to you, is it 1 neighbor or 2-4?
        // Let's count distinct UNITS.

        const neighbors = this.getNeighbors(x, y, range);
        return neighbors.length;
    }
    resize(newWidth, newHeight) {
        const oldGrid = this.grid;
        const oldWidth = this.width;
        const oldHeight = this.height;

        this.width = newWidth;
        this.height = newHeight;
        this.grid = new Array(newWidth * newHeight).fill(null);

        // Re-place existing units
        // Note: We only need to move units that are still within bounds (which they should be if we are expanding)
        // If shrinking, we might lose units. But we only expand.

        // We iterate through the units list, which is safer than the grid
        // However, we need to clear the grid first (done above) and re-place them.

        // Important: We must NOT change unit.x/y unless we want to center them?
        // Usually expansion adds space to the right/bottom. So (0,0) stays (0,0).
        // So we just re-place them at their existing coordinates.

        const unitsToKeep = [];

        this.units.forEach(unit => {
            // Check if unit fits in new grid
            if (unit.x + unit.width <= newWidth && unit.y + unit.height <= newHeight) {
                // Re-place in grid
                for (let dy = 0; dy < unit.height; dy++) {
                    for (let dx = 0; dx < unit.width; dx++) {
                        this.grid[this.getIndex(unit.x + dx, unit.y + dy)] = unit;
                    }
                }
                unitsToKeep.push(unit);
            } else {
                // Unit is out of bounds (if shrinking), it is lost.
                // In expansion, this shouldn't happen.
            }
        });

        this.units = unitsToKeep;
    }
}

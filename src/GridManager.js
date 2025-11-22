class GridManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = new Array(width * height).fill(null); // Stores unit objects
        this.units = []; // List of active units
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isOccupied(x, y) {
        if (!this.isValid(x, y)) return true;
        return this.grid[this.getIndex(x, y)] !== null;
    }

    placeUnit(x, y, type) {
        if (this.isOccupied(x, y)) return false;

        const unit = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y
        };

        this.grid[this.getIndex(x, y)] = unit;
        this.units.push(unit);
        return unit;
    }

    removeUnit(x, y) {
        if (!this.isValid(x, y)) return null;
        const index = this.getIndex(x, y);
        const unit = this.grid[index];

        if (unit) {
            this.grid[index] = null;
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
        const neighbors = [];
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValid(nx, ny)) {
                    const unit = this.getUnitAt(nx, ny);
                    if (unit) {
                        neighbors.push(unit);
                    }
                }
            }
        }
        return neighbors;
    }

    getNeighborCount(x, y, range = 1) {
        let count = 0;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValid(nx, ny) && this.isOccupied(nx, ny)) {
                    count++;
                }
            }
        }
        return count;
    }
}

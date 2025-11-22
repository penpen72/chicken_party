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
}

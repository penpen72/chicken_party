# Chicken Party: Unit & Policy Design

## 1. Units (Staff)
Staff units are the core workforce. They require a daily salary and have specific roles.

### 1.1 Jr. Engineer
*   **Role**: Production
*   **Cost**: $100
*   **Salary**: $10/day
*   **Stats**:
    *   R&D Output: 20
*   **Description**: The basic production unit. Produces Tech Stock.

### 1.2 Sr. Engineer
*   **Role**: High Production
*   **Cost**: $300
*   **Salary**: $50/day
*   **Stats**:
    *   R&D Output: 80
*   **Description**: High output but expensive.
*   **Special**: 
    *   **Stresses Juniors**: Neighbors (Jr. Engineers) get -5 Happiness.
    *   **Global Stress**: Each Senior Engineer reduces Global Happiness by -1.

### 1.3 Sales
*   **Role**: Revenue
*   **Cost**: $150
*   **Salary**: $12/day
*   **Stats**:
    *   Sales Power: 20
*   **Description**: Converts Tech Stock into Cash.
*   **Conversion Details**:
    *   **Rate**: 1 Sales Power converts **1 Tech Stock** into **$2**.
    *   **Capacity**: A standard Sales unit (20 Power) can convert up to 20 Stock/day, generating a maximum of **$40 Revenue/day**.
    *   **Constraint**: If Tech Stock is 0, Sales units generate $0 but still cost salary.

### 1.4 Project Manager (PM)
*   **Role**: Amplifier
*   **Cost**: $250
*   **Salary**: $40/day
*   **Stats**:
    *   Tech Conversion: 20/day
*   **Description**: Amplifies Tech production. Converts 1 Tech Stock into 2 Tech Stock (Net +1).
*   **Details**:
    *   **Capacity**: Can convert up to 20 Tech/day.
    *   **Effect**: Acts as a multiplier for existing stock. Does not produce Tech from scratch (requires input).

## 2. Facilities
Facilities are buildings that modify the environment. They do not have a daily salary but have one-time build costs.

### 2.1 Server Rack
*   **Cost**: $500
*   **Size**: 1x1
*   **Effect**:
    *   **Buff**: Neighbors get **+50% R&D Output**.
    *   **Debuff**: Neighbors get **-5 Happiness** (Noise).
*   **Strategy**: Place near engineers, but mitigate the happiness penalty.

### 2.2 Pantry
*   **Cost**: $300
*   **Size**: 2x2
*   **Effect**:
    *   **Buff**: **+5 Happiness** to all units in range.
    *   **Range**: 2 cells (covers a large area, approx 6x6).
*   **Strategy**: Critical for preventing Zombie mode in crowded areas.

### 2.3 Conference Room
*   **Cost**: $1000
*   **Size**: 2x1
*   **Effect**:
    *   **Buff**: **+20% Efficiency** to all units in range.
    *   **Range**: 4x3 area (Left/Right/Top/Bottom 1 cell).
*   **Strategy**: Powerful booster for high-density clusters.

### 2.4 Plant
*   **Cost**: $50
*   **Size**: 1x1
*   **Effect**:
    *   **Buff**: **+2 Happiness** to neighbors (3x3).
*   **Strategy**: Cheap filler to boost happiness slightly.

## 3. Policies
Policies are global upgrades that can be leveled up (Max Level 5).

### 3.1 Responsibility System
*   **Base Cost**: $5000
*   **Effect**:
    *   **+30% R&D Output** per level for Engineers.
    *   **-5 Happiness** per level (Global).
*   **Trade-off**: High productivity at the cost of rapid burnout.

### 3.2 Competitive Salary
*   **Base Cost**: $2000
*   **Effect**:
    *   **+50% Salary Cost** (Global).
    *   **Happiness Locked at 100** (Max).
    *   **+10% Crit Chance** per level (Boosts output).
*   **Trade-off**: Extremely expensive but guarantees maximum efficiency and no Zombies.

### 3.3 Office Expansion
*   **Base Cost**: $10000
*   **Effect**: Expands the office grid size by +2x2 per level.

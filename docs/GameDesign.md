# Chicken Party: Game Design Document

## 1. Game Concept
**Chicken Party: The Last Promise** is a survival management simulation where you play as the CEO of a startup. You must balance internal management pressure (Zombie Employees) with external survival pressure (Partner Trust/HP).

## 2. Core Mechanics

### 2.1 Time & Survival
*   **Time Scale**: 1 real-world second = 1 in-game day.
*   **The Chicken Party**: Occurs every **365 days**. This is the annual performance review.
*   **HP (Partner Trust)**: Starts at **5**. Represents the 5 founding partners.
*   **Game Over**: Occurs when HP reaches 0 or Bankruptcy (Cash <= 0).

### 2.2 The Chicken Party (Annual Settlement)
Every 365 days, the partners evaluate the company's performance based on two criteria:
1.  **Profitability**: Is the annual profit > 0?
2.  **Employee Happiness**: Is the average happiness >= 50?

**Penalty**:
*   If Profit <= 0: **HP -1**
*   If Happiness < 50: **HP -1**

### 2.3 Efficiency & The Zombie Curve
Employee efficiency is non-linearly related to happiness.
*   **Base Happiness**: 50
*   **Efficiency Formula**: `(Current Happiness / 50)^2`
*   **Zombie State**: When Efficiency < 10% (approx. Happiness < 16), the employee becomes a **Zombie**.
    *   **Effect**: Produces nothing (Efficiency = 0) but still consumes full salary.
    *   **Visual**: Turns gray and sleeps (Zzz).

### 2.4 Happiness Factors
*   **Base**: 50
*   **Crowding Penalty**: -2 per neighbor in a 3x3 area.
*   **Environmental Modifiers**:
    *   **Pantry**: +5 Happiness (Range 2).
    *   **Plant**: +2 Happiness (Range 1).
    *   **Server Rack**: -5 Happiness (Noise, Range 1).
    *   **Policies**: Various effects (see Unit Design).

## 3. Economic System

### 3.1 Resources
*   **Cash ($)**: Used for building and salaries.
*   **Tech Stock**: Produced by Engineers. Represents product inventory.
*   **R&D Power**: Daily production rate of Tech Stock.
*   **Sales Power**: Daily capacity to convert Tech Stock into Cash.
*   **Welfare**: Average happiness of all staff.

### 3.2 Profit Loop
1.  **Production**: Engineers produce **R&D Power** -> accumulates into **Tech Stock**.
2.  **Sales**: Sales staff provide **Sales Power**.
3.  **Revenue**: Daily Sales = `Min(Tech Stock, Sales Power)`.
    *   Income = `Daily Sales * $2` (Unit Price).
4.  **Expense**: Sum of all unit salaries.
5.  **Net Profit**: `Income - Expense`.

## 4. Controls
*   **Build**: Select a unit/facility and click on the grid.
*   **Delete**: Remove a unit (refunds 50% of cost).
*   **Inspect**: Hover over units to see range and status.

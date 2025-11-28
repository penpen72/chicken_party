# Chicken Party: UI & Interaction Design

## 1. Overview
The game interface is designed to be clean and informative, split into three main layers:
1.  **Game World (Canvas)**: The 3D isometric grid where gameplay happens.
2.  **Top Bar (Dashboard)**: Real-time statistics and game status.
3.  **Bottom Bar (Controls)**: Build menu, unit info, and management tools.

## 2. Top Bar (Dashboard)
Located at the top of the screen, providing essential metrics.

*   **Partner Trust (HP)**: 🤝 Icon. Shows current HP (Starts at 5).
*   **Time Progress**:
    *   **Year**: Current Year (e.g., 2015).
    *   **Progress Bar**: Visual indicator of the year's progression.
    *   **Day**: Current Day (1-365).
*   **Resources**:
    *   **Cash**: 💰 Current funds.
    *   **Tech Stock**: 🔬 Current inventory of R&D products.
    *   **Sales Power**: 📢 Daily sales capacity.
    *   **Happiness**: ❤️ Average employee welfare (0-100).
*   **Toggles**:
    *   **Production Text** (💸): Toggle floating text for income/expenses.
    *   **Buffs** (✨): Toggle floating text for status effects.

## 3. Bottom Bar (Controls)
The primary interaction area for building and managing the company.

### 3.1 Tab Navigation
Allows switching between different build categories:
*   **Manpower**: Staff units (Engineers, Sales, PM).
*   **Facilities**: Infrastructure (Servers, Pantry, Meeting Rooms).
*   **Policies**: Global upgrades and company policies.

### 3.2 Build Menu
Displays available units for the selected tab.
*   **Unit Button**: Shows Icon, Name, and Cost.
*   **Hover/Click**: Opens the **Purchase Preview Panel**.

### 3.3 Purchase Preview Panel
Appears above the build menu when a unit is selected or hovered.
*   **Info**: Name, Description, Cost.
*   **Stats**: Detailed breakdown of daily effects (e.g., +R&D, -Cost).
*   **Hint**: "Click on grid to build".

### 3.4 Global Controls
*   **Sell Mode (🗑️)**: Toggle delete mode to remove units (refunds 50%).

## 4. Unit Info Panel
Appears when clicking on an existing unit in the game world.
*   **Header**: Unit Icon and Name.
*   **Description**: Unit role and behavior.
*   **Live Stats**: Current performance, including active buffs/debuffs.

## 5. Event Modal (Yearly Settlement)
A popup window that pauses the game for major events.

### 5.1 Visual Style (New v1.1)
*   **Glassmorphism**: Uses `backdrop-filter: blur(10px)` with semi-transparent backgrounds for a modern, premium feel.
*   **Theming**: The modal changes color based on the event outcome:
    *   **Party Theme (Green)**: Used when no partners leave. Features green gradients and confetti.
    *   **Departure Theme (Red)**: Used when a partner leaves. Features red gradients.
*   **Stat Cards**: Key metrics (Profit, Happiness, Departures) are displayed in individual cards with icons instead of a text list.

### 5.2 Content
*   **Header**: "Year X Report".
*   **Summary**: Grid of stat cards showing yearly performance.
*   **Reason Box**:
    *   **Icon**: Animated icon (🍗 or 👋).
    *   **Title**: "Chicken Party!" or "Partner Left".
    *   **Description**: Narrative reason for the event.
*   **Action**: "Continue" button to start the next year.

## 6. Mobile Adaptations
*   **Responsive Layout**: UI elements scale for smaller screens.
*   **Backdrop**: Darkens the background when panels (Unit Info) are open to focus attention.
*   **Touch Controls**: Tap to select/build instead of click.

## 7. Technical Architecture (CSS)
As of v1.2, the CSS architecture has been modularized for better maintainability.

### 7.1 Directory Structure
All styles are located in `src/css/`.

### 7.2 Modules
*   **variables.css**: Global CSS variables (`:root`) for colors, spacing, and theme constants.
*   **base.css**: Reset styles, global typography, and body/html settings.
*   **layout.css**: Core layout structure (`#app`, `#top-bar`, `#bottom-bar`).
*   **components.css**: Reusable UI components (Buttons, Progress Bars, Toggles).
*   **ui-panels.css**: Specific styles for game panels (Unit Info, Policy Info, Purchase Preview).
*   **dashboard.css**: Styles for the Company Dashboard.
*   **modals.css**: Styles for the Event Modal and backdrops.
*   **animations.css**: Keyframes and animation utility classes.

### 7.3 Usage
These files are imported individually in `index.html` in the specific order listed above to ensure correct cascading of styles.

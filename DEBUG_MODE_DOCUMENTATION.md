# Debug Mode Implementation - India Elections Game V2

## Overview
A comprehensive debug mode has been implemented for the India Elections Game V2 to facilitate playtesting and development. The debug mode can be toggled using the keyboard shortcut **Ctrl + Shift + D**.

## Debug Mode Features

### 1. Keyboard Activation
- **Shortcut**: `Ctrl + Shift + D`
- **Visual Feedback**: Status indicator appears in top-right corner showing "Debug Mode: ON/OFF"
- **Persistence**: Debug mode can be toggled on/off during gameplay

### 2. Player Funds Configuration
#### Player 1 (Human Player)
- **Starting Funds**: 50,000 M (vs 250 M in normal mode)
- **Refresh Funds**: 50,000 M per phase (vs 200 M in normal mode)

#### Player 2 (AI Player)
- **Starting Funds**: 0 M (vs 250 M in normal mode)
- **Refresh Funds**: 0 M per phase (vs 200 M in normal mode)

### 3. AI Behavior
- **AI Actions**: Completely paused when debug mode is active
- **Normal Operation**: AI resumes when debug mode is disabled

### 4. Game Timer
- **Phases**: 4 phases (vs 10 phases in normal mode)
- **Phase Duration**: 30 seconds (unchanged)

### 5. State Interaction
- **One-Click Max Popularity**: Single click on any state/UT instantly sets Player 1 popularity to 100%
- **Visual Feedback**: Ripple effect shows when state is clicked
- **Instant Results**: No cost deduction, immediate effect

## Implementation Details

### Files Modified/Created

#### 1. `js/game-config.js` (NEW)
- Centralized configuration management
- Debug mode state management
- Keyboard event handling
- Settings application logic

#### 2. `js/main.js`
- Import game-config module
- Use game config for timer initialization
- Expose global objects for debug access

#### 3. `js/player-info.js`
- Import game-config module
- Use config-based starting funds
- Use config-based refresh amounts
- Added `updateDisplay()` method

#### 4. `js/ai-player-controller.js`
- Import game-config module
- Check AI enabled status before actions
- Respect debug mode AI settings

#### 5. `js/map-controller.js`
- Import game-config module
- Debug mode state click handling
- One-click max popularity feature

#### 6. `js/state-info.js`
- Added `setStatePopularity()` method
- Validation and normalization
- Event dispatching for updates

#### 7. `js/game-timer.js`
- Import game-config module
- Use config-based phase settings

#### 8. `styles/main.css`
- Debug status indicator styles
- Animation effects for debug mode

## Usage Instructions

### Activating Debug Mode
1. Load the game normally
2. Press `Ctrl + Shift + D` at any time
3. Green indicator shows "Debug Mode: ON"
4. Debug settings are applied immediately

### Debug Playtesting
1. **Instant State Control**: Click any state to give Player 1 100% popularity
2. **Unlimited Funds**: Player 1 has 50,000M and gets 50,000M per phase
3. **No AI Interference**: AI player has no funds and takes no actions
4. **Faster Rounds**: Only 4 phases to complete testing

### Deactivating Debug Mode
1. Press `Ctrl + Shift + D` again
2. Red indicator shows "Debug Mode: OFF"
3. Normal game settings are restored
4. AI resumes normal operation

## Configuration Structure

The game config system allows easy modification of:
- Phase counts and durations
- Starting funds for both players
- Refresh amounts per phase
- AI behavior settings
- Debug-specific overrides

## Benefits for Playtesting

1. **Rapid State Testing**: Quickly test different state control scenarios
2. **No Resource Constraints**: Focus on gameplay mechanics without fund management
3. **Isolated Testing**: AI disabled for consistent test conditions
4. **Quick Rounds**: Shorter phases for faster iteration
5. **Easy Toggle**: Switch between debug and normal modes instantly

## Technical Notes

- Debug mode state is maintained in memory (not persistent across page reloads)
- All changes apply immediately without requiring game restart
- Original click handlers are preserved and restored when debug mode is disabled
- Game objects are exposed globally for debug access (`window.player1`, `window.mapController`, etc.)
- Event system ensures UI updates properly reflect debug changes

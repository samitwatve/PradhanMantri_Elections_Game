# Random Events System Documentation

## Overview
The Random Events system adds dynamic, unpredictable events to the India Elections Game that can positively or negatively impact state popularity based on current political standings.

## How It Works

### Activation
- Random events can be enabled/disabled on the welcome screen before starting a game
- Once a game starts, the setting cannot be changed
- The feature is disabled by default

### Timing
- Random events occur every other game phase (phases 2, 4, 6, 8, 10...)
- Each event has a 2-second delay after phase transition to allow the game to settle

### Event Types

#### Positive Events
1. Major infrastructure project announced
2. New tech hub established
3. Agricultural subsidy program launched
4. Educational excellence award received
5. Tourism boost from international recognition
6. Industrial investment secured
7. Healthcare facility modernization completed
8. Sports victory brings national pride
9. Cultural festival celebrates heritage
10. Green energy project inaugurated

#### Negative Events
1. Natural disaster causes widespread damage
2. Economic downturn hits local industries
3. Corruption scandal emerges
4. Infrastructure project faces delays
5. Agricultural crisis affects farmers
6. Healthcare system overwhelmed
7. Environmental concerns raised
8. Educational funding cuts announced
9. Industrial accident sparks safety concerns
10. Religious tensions create unrest

### Impact Mechanics

#### Target Selection
- A random state is selected from all available states
- Events affect popularity based on current political standings in that state

#### Popularity Impact
- **Leading Player**: If one player has clear majority in the state, they receive the full impact
- **Both Players**: If "others" are leading, both players are affected proportionally based on their current share
- **Magnitude**: Random impact between 5-20% popularity change

#### Visual Feedback
- Map effects show green (+) for positive events, red (-) for negative events
- Detailed notifications appear in the top-right corner
- Notifications auto-dismiss after 8 seconds

## Technical Implementation

### Files Added/Modified
- `js/random-events.js` - Main random events system
- `styles/random-events.css` - Notification styling
- `welcome-screen.html` - Added toggle option
- `index.html` - Added CSS import
- `js/main.js` - Integration with game initialization
- `js/state-info.js` - Enhanced state popularity methods
- `js/visual-effects.js` - Added event visual effects

### Debug Functions
Open browser console and use:
- `randomEvents.debugTriggerEvent()` - Trigger a random event
- `randomEvents.debugTriggerEvent('INMH', true)` - Trigger positive event in Maharashtra
- `randomEvents.debugStatus()` - Check current system status

### Events
The system listens for:
- `phaseChanged` - Triggers event evaluation every other phase

The system dispatches:
- `popularityChanged` - When state popularity is modified by events

## Game Balance
- Events provide strategic unpredictability without being overpowering
- 5-20% impact range ensures meaningful but not game-breaking changes
- Every-other-phase frequency maintains game flow
- Proportional impact when "others" lead prevents player stagnation

## Future Enhancements
- State-specific events based on geographical/cultural context
- Multi-state regional events
- Player-triggered events through policy completion
- Historical event callbacks
- Difficulty-based event frequency scaling

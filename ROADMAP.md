# India Elections Game - Project Roadmap

## Instructions
This document provides an overview of the entire project. DO NOT MODIFY UNLESS INSTRUCTED. EVEN THEN BE VERY CAREFUL BEFORE MAKING MAJOR CHANGES.

## Overview
- This game simulates competing in India's LokSabha Elections. The game is designed as a two-player real-time interactive browser-based game. Currently optimized for Desktop but should keep an eye on compatibility with other screen sizes and orientations.
- In the current implementation, Player 1 is always the human player and Player 2 is an AI player.
- Both players compete to win 272 LokSabha seats (out of a total 543 possible) by taking various in-game actions. If neither player succeeds then the game ends in a hung parliament.
- Both players start with an initial campaign funds purse. The human player can contribute funds to any state or UT by clicking on any state or UT region. These regions are represented by an SVG loaded in the main area. Contributing funds increases the popularity of that player in that state (applies to both players).
- You can also increase popularity by contributing funds to various campaign promises.
- Campaigns are held in multiple phases.

## Popularity and seat count scoring
- There are a total of 543 seats in Lok Sabha with each state / UT contributing to the total
- When the game is initialized a random popularity score (between 0-100) for each state / UT is assigned in 3 different buckets
    - Player 1 popularity
    - Player 2 popularity
    - "Others" popularity
- For optimal game balance we need the following:
    - Roughly 100 seats (3-5 territories) where player 1 is leading by default. This is randomly assigned at each game launch. Leading means having a popularity score between 35-60 (also randomly assigned)
    - Roughly 100 seats (3-5 territories) where player 2 is leading by default. This is randomly assigned at each game launch. Leading means having a popularity score between 35-60 (also randomly assigned)
    - All other territories, both player 1 and player 2 must have a popularity score < 35 with "Others" receiving the residual support
- In-game actions constantly change these popularity values for all states, for all players. This is updated and monitored continuously
- At the end of the game seats are awarded proportionally. E.g. Uttar Pradesh has 80 seats. So if
    - Player 1 popularity (40) --> 0.4 * 80 = 32 states
    - Player 2 popularity (30) --> 0.3 * 80 = 24 states
    - "Others" popularity (30) --> 0.3 * 80 = 24 states
would be awarded. This same process is repeated for all territories and winner between P1 and P2 is decided if either one crosses 272.

## Campaign Funds
- Start with a fixed amount per player (set this in a config file)
- This amount is refreshed per phase of election and added to any unspent funds

## Campaign Fund bonuses
Bonuses can be earned by:
- maxxing out on any given campaign promise
- Having >50% popularity in all states for a particular state grouping e.g. "South India" comprises of 5 states and 1 UT (130 seats total)
    - Andhra Pradesh: 25 seats
    - Karnataka: 28 seats
    - Kerala: 20 seats
    - Tamil Nadu: 39 seats
    - Telangana: 17 seats
    - Puducherry: 1 seat
If a player achieves popularity >50 in all these territories, then they receive a one-time bonus proportional to 130 seats (e.g. 65M) as well as a carry-forward bonus of the same amount in every subsequent round if they continue to maintain >50% popularity in all states and UTs in that group

see `states_data.json` for info on LokSabhaSeats and State Groupings

## Boosting popularity
- Any player can boost their popularity in a given territory simply by contributing funds in that territory. 
- Any player can boost their popularity by maxxing out certain campiagn promises (e.g. Hindi Education Mandate) will increase popularity in the "Hindi Heartland" group but decrease popularity in the "South India" group where people don't speak Hindi
- Any player can boost their popularity in a given territory by holding a rally there. Rallies are free but can be held only twice per state and twice per phase. If you don't hold a rally in a phase you lose it, but you always get 2 rally tokens at the start of each phase.


## Election Phases
- Game proceeds in multiple phases (configured in global settings)
- Each phase refreshes campaign funds and rally tokens
- States become available for campaigns based on phase
- Actions in early phases can influence later phase outcomes

## AI Player Mechanics
- AI (Player 2) makes decisions based on:
  - Current popularity in each state
  - Available campaign funds
  - State seat values
  - Campaign promise impacts
- Adapts strategy based on human player's actions
- Prioritizes high-value states and efficient fund allocation

## Victory and End Game
- Primary victory: First to 272 seats (evaluated only at the end of all 8 phases)
- Hung Parliament: Neither reaches 272 at game end
- Victory conditions are no longer checked during gameplay - only at completion
- Coalition possibilities with "Others" based on final numbers

## Campaign Promises

Campaign promises are divided into five major policy categories, each affecting different state groups and voter demographics differently.

### Social Policy
- Hindutva: Impacts religious demographics and cultural identity
- Uniform Civil Code: Affects personal law and social framework
- Hindi Education Mandate: Major impact in Hindi vs non-Hindi speaking regions
- Secularism: Influences religious harmony and minority relations

### Justice & Inclusion
- Mandal Commission: Impacts caste-based reservations and social justice
- Women's Reservation: Affects gender representation and equality
- Tribal Rights: Important for states with significant tribal populations
- Waqf Board Reforms: Influences Muslim community relations

### Infrastructure
- Highways & Airports: National connectivity and development
- Ports Modernisation: Crucial for coastal states
- Smart Cities: Urban development and modernization
- Defense & Border Infrastructure: Important for border states

### Economic Policy
- MGNREGA Expansion: Rural employment and development
- GST: Business and trade implications
- Digital India: Technology and modernization
- Industry & Mining: Industrial development and job creation

### Agriculture & Environment
- Farm Loan Waivers: Critical for agricultural states
- River-Linking Projects: Inter-state water management
- GMOs: Agricultural modernization
- Farm Bills: Agricultural reform and market dynamics

### Impact Mechanics
- Each promise has a progress bar that can be filled by allocating campaign funds
- Maxing out a promise provides campaign fund bonuses
- Different promises have varying impacts in different state groups
- Some promises may boost popularity in one region while decreasing it in others (e.g., Hindi Education Mandate)


## Global Config
- Player 1 and 2 starting funds
- Player 1 and 2 starting political parties
- Player 1 and 2 colors
- Player 1 and 2 rally tokens
- Number of election phases
- Phase duration
- campaign promise cost
- campaign promise maxxing bonus
- campaign contribution popularity boost


## Game Layout

### Main Game Screen
1. Map Area (Central Focus)
   - Interactive SVG map of India
   - State/UT regions with clickable areas
   - Color-coded popularity indicators
   - Hover states for information display

2. Two Player Information Panels (Left Sidebar)
   - Player 1 (Human) status
   - Player 2 (AI) status
   
3. State Information Panel (Left Sidebar)
   - Selected state name
   - Number of Lok Sabha seats
   - Current popularity distribution
   - Available actions
   - Campaign fund allocation options

4. Policy Progress Panel (Right Sidebar)
   - List of campaign promises
   - Progress indicators
   - Fund allocation options
   - Impact visualization

5. Actions logging (Left Sidebar)
    - Logs various in-game actions as they occur

6. Small UTs container (Central Focus)
    - Because many UTs are too small to properly visualize and interact with, There is a separate area overlaid on the main map that links to specific UTs. Clicking / hovering on a specific button should have the exact same impact as clicking / hovering on the area of a larger state.

7. State Groups container (Central Focus)
    - States are divided into logical groups based on various criteria (see states_data.json)
    - Each button corresponds to one particular state grouping

### UI Components
- Tooltips for state information
- Progress bars for popularity
- Fund allocation sliders
- Action confirmation dialogs
- Victory/Defeat screens
- Tutorial overlays

### Responsive Considerations
- Desktop-first design
- Collapsible panels for smaller screens
- Touch-friendly interaction areas
- Scalable SVG map
- Accessible UI elements

## Current Features
- SVG-based map of India with interactive state/UT regions
- Basic HTML/JavaScript interface
- Two-player system (Human vs AI)
- Campaign funds management system
- State-wise popularity tracking
- Win condition: 272 LokSabha seats out of 543
- Policy progress tracking system

## Planned Features

### Phase 1: Core Game Mechanics (Current Focus)
- [ ] Enhanced state selection interaction
  - [ ] Visual feedback on state selection
  - [ ] State information panel
  - [ ] Current popularity indicators
- [ ] Campaign funds system enhancement
  - [ ] Fund allocation visualization
  - [ ] Transaction history
  - [ ] Budget planning tools
- [ ] Basic election result simulation
  - [ ] State-wise seat distribution
  - [ ] Victory/defeat conditions
  - [ ] Hung parliament scenario

### Phase 2: Policy & Strategy System
- [ ] Detailed policy implementation system
  - [ ] State-specific policy impacts
  - [ ] Policy cost-benefit analysis
- [ ] Advanced resource management
  - [ ] Campaign staff management
  - [ ] Rally organization
  - [ ] Media engagement
- [ ] Alliance system
  - [ ] Regional party negotiations
  - [ ] Coalition management
  - [ ] Seat-sharing arrangements
- [ ] State-specific mechanics
  - [ ] Local issues and challenges
  - [ ] Regional sentiment tracking
  - [ ] Demographic considerations

### Phase 3: UI/UX Improvements
- [ ] Add interactive tooltips for states
- [ ] Implement dynamic policy impact visualization
- [ ] Create responsive design for different screen sizes
- [ ] Add sound effects and background music

### Phase 4: Advanced Features
- [ ] Historical election data integration
- [ ] AI opponents with different strategies
- [ ] Multiple campaign scenarios
- [ ] Save/load game functionality

### Phase 5: Polish & Enhancement
- [ ] Add detailed statistics and analytics
- [ ] Implement achievements system
- [ ] Create tutorial system
- [ ] Add multiplayer support (optional)

## Technical Debt & Improvements
- [ ] Code organization and structure
- [ ] Performance optimization
- [ ] Cross-browser compatibility
- [ ] Documentation
- [ ] Unit tests

## Implementation Details

### Current Architecture
- Browser-based implementation
- SVG for map visualization
- Real-time interaction handling
- State-based game logic

### Technical Dependencies
- Core HTML/CSS/JavaScript
- SVG manipulation library
- Policy progress tracking module
- Campaign funds management system

### Performance Considerations
- SVG rendering optimization
- State update efficiency
- Memory management for game state
- Browser compatibility testing

## Timeline
- Phase 1: Q3 2025
- Phase 2: Q4 2025
- Phase 3: Q1 2026
- Phase 4: Q2 2026
- Phase 5: Q3 2026

## Notes
- Priority should be given to core gameplay mechanics
- Regular testing with target audience
- Maintain balance between historical accuracy and gameplay fun
- Consider mobile/tablet support in later phases

## State Groups
Reference: `states_data.json`

### Strategic Groups
- Hindi Heartland: Core Hindi-speaking states
- South India: States with distinct linguistic identity
- North East: States with unique cultural dynamics
- Western Block: Industrial and commerce-focused
- Eastern Region: Agricultural and cultural heritage

### Group Mechanics
- Group bonuses trigger at >50% popularity in all states
- Bonus value proportional to total seats in group
- Cultural policies have group-wide impacts
- Regional party influences within groups

## State Information Display

When hovering over any state or Union Territory on the map, the States Info container displays the following information:
- State/UT Name
- Number of Lok Sabha Seats
- Current Popularity
  - Player 1's popularity percentage
  - Player 2's popularity percentage
  - "Others" popularity percentage
- Number of Rallies held (current phase)
  - Player 1's rallies
  - Player 2's rallies
- State Groups
  - List of all groups the state/UT belongs to (e.g., Coastal India, South India, etc.)

This information helps players make strategic decisions about where to focus their campaign efforts and resources

// Test function to verify home state and campaign bonuses
window.testBonuses = async function() {
  console.log("=== Testing Home State and Campaign Bonuses ===");
  
  // Test home state bonus
  console.log("\n1. Testing Home State Bonus:");
  const { homeStateBonus } = await import("./js/home-state-bonus.js");
  await homeStateBonus.initialize();
  
  const gameConfig = JSON.parse(localStorage.getItem("gameConfig") || "{}");
  console.log("Game Config:", gameConfig);
  
  console.log("Player 1 Home State:", homeStateBonus.getPlayerHomeState(1));
  console.log("Player 2 Home State:", homeStateBonus.getPlayerHomeState(2));
  
  // Test campaign bonuses
  console.log("\n2. Testing Campaign Bonuses:");
  
  // Load politicians data
  const response = await fetch("./politicians-data.json");
  const politiciansData = await response.json();
  
  const player1Data = politiciansData.politicians.find(p => p.name === gameConfig.player1Politician);
  const player2Data = politiciansData.politicians.find(p => p.name === gameConfig.player2Politician);
  
  if (player1Data) {
    console.log("Player 1 Politician:", player1Data.name);
    console.log("Player 1 Policies:", player1Data.policies);
  }
  
  if (player2Data) {
    console.log("Player 2 Politician:", player2Data.name);
    console.log("Player 2 Policies:", player2Data.policies);
  }
  
  // Test a few state costs
  console.log("\n3. Testing State Campaign Costs:");
  const statesResponse = await fetch("./states_data.json");
  const statesData = await statesResponse.json();
  
  // Test Gujarat (Modi's home state)
  const gujarat = statesData.find(s => s.State === "Gujarat");
  if (gujarat) {
    const baseCost = parseInt(gujarat.LokSabhaSeats);
    const p1Cost = homeStateBonus.getCampaignCost(1, gujarat.State, baseCost);
    const p2Cost = homeStateBonus.getCampaignCost(2, gujarat.State, baseCost);
    console.log(`Gujarat - Base: ${baseCost}M, P1: ${p1Cost}M, P2: ${p2Cost}M`);
  }
  
  // Test Uttar Pradesh (Rahul's home state)
  const up = statesData.find(s => s.State === "Uttar Pradesh");
  if (up) {
    const baseCost = parseInt(up.LokSabhaSeats);
    const p1Cost = homeStateBonus.getCampaignCost(1, up.State, baseCost);
    const p2Cost = homeStateBonus.getCampaignCost(2, up.State, baseCost);
    console.log(`Uttar Pradesh - Base: ${baseCost}M, P1: ${p1Cost}M, P2: ${p2Cost}M`);
  }
  
  console.log("\n=== Test Complete ===");
};

console.log("Test function loaded. Run testBonuses() to verify fixes.");

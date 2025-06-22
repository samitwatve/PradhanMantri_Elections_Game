// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBuJixtIbszpmwhF5IzNO_WbPk1wSXUPI",
  authDomain: "pradhanmantrielectionsga-afcca.firebaseapp.com",
  projectId: "pradhanmantrielectionsga-afcca",
  storageBucket: "pradhanmantrielectionsga-afcca.firebasestorage.app",
  messagingSenderId: "865077598916",
  appId: "1:865077598916:web:f72db45b7ecba23ce58791",
  measurementId: "G-7FHNWT960M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Sign-In functionality
const provider = new GoogleAuthProvider();

console.log("Firebase Configuration:", firebaseConfig);
console.log("Auth Object:", auth);
console.log("Provider Object:", provider);

// Variable to track if sign-in is in progress
let isSigningIn = false;

async function signInWithGoogle() {
  // Prevent multiple simultaneous sign-in attempts
  if (isSigningIn) {
    console.log("Sign-in already in progress...");
    return;
  }

  try {
    isSigningIn = true;
    
    // Disable the sign-in button to prevent multiple clicks
    const signInButton = document.getElementById("google-sign-in-btn");
    if (signInButton) {
      signInButton.disabled = true;
      signInButton.textContent = "Signing in...";
    }

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("User signed in successfully:", user);

    // Store user information in localStorage
    localStorage.setItem("user", JSON.stringify({
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    }));    console.log("User information stored in localStorage:", localStorage.getItem("user"));

    // Set up the game after sign-in
    setupGameAfterSignIn(user);

    let politiciansData;
    fetch("./politicians-data.json")
      .then((response) => response.json())
      .then((data) => {
        politiciansData = data;

        const leaders = politiciansData.politicians;        cardStack.innerHTML = leaders
          .map(
            (leader) => `
          <div class="card-container">
            <div class="politician-image-container">
              <img src="${leader.image}" alt="${leader.name}" class="politician-image" />
              <img src="${leader.partyLogo}" alt="${leader.party}" class="party-logo" />
            </div>
            <div class="card-content">
              <h3 class="politician-name">${leader.name}</h3>
              <p class="politician-party">${leader.party}</p>
              <div class="policies-grid">
                ${leader.policies
                  .map(
                    (policy) => `
                      <div class="policy-item-wrapper" style="background: ${leader.primaryColor};">
                        <p class="policy-label">${policy.name}</p>
                        <p class="policy-score">+${policy.bonus}%</p>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        `
          )
          .join("");        let currentIndex = 0;
        let selectedPolitician = null;
        
        const updateCarousel = () => {
          const cards = document.querySelectorAll(".card-container");
          cards.forEach((card, index) => {
            card.classList.remove("active", "prev", "next", "hidden");
            if (index === currentIndex) {
              card.classList.add("active");
            } else if (index === currentIndex - 1) {
              card.classList.add("prev");
            } else if (index === currentIndex + 1) {
              card.classList.add("next");
            } else {
              card.classList.add("hidden");
            }
          });
        };

        document.getElementById("prev-btn").addEventListener("click", () => {
          currentIndex = (currentIndex - 1 + leaders.length) % leaders.length;
          updateCarousel();
        });

        document.getElementById("next-btn").addEventListener("click", () => {
          currentIndex = (currentIndex + 1) % leaders.length;
          updateCarousel();
        });        // Make selectCurrentPolitician globally available
        window.selectCurrentPolitician = () => {
          selectedPolitician = leaders[currentIndex];
          gameConfig.player1Politician = selectedPolitician.name;
          
          // Randomly select AI opponent (different party from player selection)
          const availableOpponents = leaders.filter(leader => 
            leader.name !== selectedPolitician.name && 
            leader.party !== selectedPolitician.party
          );
          
          // If no opponents from different parties, fall back to different politicians
          const finalOpponents = availableOpponents.length > 0 ? 
            availableOpponents : 
            leaders.filter(leader => leader.name !== selectedPolitician.name);
            
          const aiOpponent = finalOpponents[Math.floor(Math.random() * finalOpponents.length)];
          gameConfig.player2Politician = aiOpponent.name;
          
          localStorage.setItem("gameConfig", JSON.stringify(gameConfig));
          console.log("Player selected:", selectedPolitician.name, `(${selectedPolitician.party})`);
          console.log("AI opponent:", aiOpponent.name, `(${aiOpponent.party})`);

          // Update Step 3 with selections
          updateStep3Display(selectedPolitician, aiOpponent);

          // Show game options screen
          document.getElementById("step-2").classList.add("hidden");
          document.getElementById("step-3").classList.remove("hidden");
        };

        updateCarousel();
      })
      .catch((error) => console.error("Error loading politicians data:", error));    console.log("Leader cards set up successfully.");// Redirect to candidate selection screen
    document.getElementById("step-2").classList.remove("hidden");
    document.getElementById("google-sign-in-btn").classList.add("hidden");

    // Set up difficulty selection
    setupDifficultySelection();

    // Set up start game functionality
    setupStartGameFunction();    // Display user information on the screen
    const userInfoDisplay = document.getElementById("user-info-display");
    
    // Debug: Log the photo URL
    console.log("User photo URL:", user.photoURL);
    
    // Create fallback for photo URL
    const photoURL = user.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNEREREREQiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMTIgMTRDOC4xMzQwMSAxNCA1IDE3LjEzNDAxIDUgMjFIMTlDMTkgMTcuMTM0MDEgMTUuODY2IDE0IDEyIDE0WiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4KPC9zdmc+';
    const displayName = user.displayName || "User";
    
    userInfoDisplay.innerHTML = `
      <div class="user-info">
        <img src="${photoURL}" alt="${displayName}" class="user-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="user-photo-fallback" style="display: none; width: 40px; height: 40px; border-radius: 50%; background: #ddd; align-items: center; justify-content: center; font-weight: bold; color: #666;">${displayName.charAt(0).toUpperCase()}</div>
        <p class="user-name">Welcome, ${displayName}!</p>
      </div>
    `;
    userInfoDisplay.style.display = "block";    // Add a variable to indicate sign-in success
    localStorage.setItem("signInSuccessful", true);
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
    
    // Handle specific Firebase auth errors
    let errorMessage = "Failed to sign in. Please try again.";
    
    switch (error.code) {
      case 'auth/cancelled-popup-request':
        errorMessage = "Sign-in was cancelled. Please try again.";
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = "Sign-in popup was closed. Please try again.";
        break;
      case 'auth/popup-blocked':
        errorMessage = "Popup was blocked by your browser. Please allow popups for this site.";
        break;
      case 'auth/network-request-failed':
        errorMessage = "Network error. Please check your internet connection.";
        break;
      default:
        errorMessage = `Sign-in failed: ${error.message}`;
    }
    
    alert(errorMessage);
  } finally {
    // Reset sign-in state and button
    isSigningIn = false;
    const signInButton = document.getElementById("google-sign-in-btn");
    if (signInButton) {
      signInButton.disabled = false;
      signInButton.textContent = "Sign in with Google";
    }
  }
}

// Function to set up difficulty selection
function setupDifficultySelection() {
  const difficultyButtons = document.querySelectorAll(".difficulty-btn");
  const difficultyDescriptions = document.querySelectorAll(".difficulty-desc");
  
  difficultyButtons.forEach(button => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      difficultyButtons.forEach(btn => btn.classList.remove("active"));
      difficultyDescriptions.forEach(desc => desc.classList.remove("active"));
      
      // Add active class to clicked button
      button.classList.add("active");
      
      // Show corresponding description
      const difficulty = button.dataset.difficulty.toLowerCase();
      const description = document.querySelector(`.difficulty-desc.${difficulty}`);
      if (description) {
        description.classList.add("active");
      }
    });
  });
}

// Function to set up start game functionality
function setupStartGameFunction() {
  window.startGame = () => {
    const gameConfig = JSON.parse(localStorage.getItem("gameConfig"));
    const aiDifficulty = document.querySelector(".difficulty-btn.active").dataset.difficulty;
    const randomEventsEnabled = document.getElementById("random-events-checkbox").checked;

    gameConfig.aiDifficulty = aiDifficulty;
    gameConfig.randomEventsEnabled = randomEventsEnabled;
    localStorage.setItem("gameConfig", JSON.stringify(gameConfig));
    console.log("Game options set:", { aiDifficulty, randomEventsEnabled });

    // Redirect to the main game
    window.location.href = "index.html";
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const signInButton = document.getElementById("google-sign-in-btn");
  
  // Remove any existing event listeners and add a single one
  const newSignInButton = signInButton.cloneNode(true);
  signInButton.parentNode.replaceChild(newSignInButton, signInButton);
  
  newSignInButton.addEventListener("click", signInWithGoogle);

  // Check if user is already signed in and should skip to candidate selection
  checkSignInStatus();
});

// Check if user is already signed in and should skip to candidate selection
function checkSignInStatus() {
  const signInSuccessful = localStorage.getItem("signInSuccessful");
  const urlHash = window.location.hash;
    if (signInSuccessful === "true" && urlHash === "#step-2") {
    // User is already signed in and wants to go to candidate selection
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      
      // Debug: Log the user data to see what we have
      console.log("Stored user data:", user);
      
      // Use the correct property name (we stored 'name', not 'displayName')
      const displayName = user.name || user.displayName || "User";
        // Set up the game as if they just signed in
      setupGameAfterSignIn(user);      
      
      // Show candidate selection screen directly
      document.getElementById("step-2").classList.remove("hidden");
      document.getElementById("google-sign-in-btn").classList.add("hidden");
      
      // Set up difficulty selection and start game functionality
      setupDifficultySelection();
      setupStartGameFunction();
        // Display user information
      const userInfoDisplay = document.getElementById("user-info-display");
      
      // Debug: Log the photo URL
      console.log("User photo URL:", user.photoURL);
      
      // Create fallback for photo URL
      const photoURL = user.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNEREREREQiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMTIgMTRDOC4xMzQwMSAxNCA1IDE3LjEzNDAxIDUgMjFIMTlDMTkgMTcuMTM0MDEgMTUuODY2IDE0IDEyIDE0WiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4KPC9zdmc+';
      
      userInfoDisplay.innerHTML = `
        <div class="user-info">
          <img src="${photoURL}" alt="${displayName}" class="user-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="user-photo-fallback" style="display: none; width: 40px; height: 40px; border-radius: 50%; background: #ddd; align-items: center; justify-content: center; font-weight: bold; color: #666;">${displayName.charAt(0).toUpperCase()}</div>
          <p class="user-name">Welcome back, ${displayName}!</p>
        </div>
      `;
      userInfoDisplay.style.display = "block";
    }
  }
}

// Extract common setup logic into a separate function
function setupGameAfterSignIn(user) {
  // Use the correct property name (we stored 'name', not 'displayName')
  const displayName = user.name || user.displayName || "User";
  
  // Initialize game configuration
  const gameConfig = {
    playerName: displayName,
    player1Politician: "Narendra Modi", // Default politician for Player 1
    player2Politician: "Rahul Gandhi", // Default politician for Player 2
    aiDifficulty: "EASY", // Default AI difficulty
    randomEventsEnabled: true // Enable random events by default
  };

  localStorage.setItem("gameConfig", JSON.stringify(gameConfig));
  console.log("Game configuration initialized:", gameConfig);

  // Set up leader cards dynamically
  const cardStack = document.getElementById("card-stack");
  cardStack.style.display = "grid";
  cardStack.style.gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
  cardStack.style.gap = "1rem";

  let politiciansData;
  fetch("./politicians-data.json")
    .then((response) => response.json())
    .then((data) => {
      politiciansData = data;

      const leaders = politiciansData.politicians;      cardStack.innerHTML = leaders
        .map(
          (leader) => `
        <div class="card-container">
          <div class="politician-image-container">
            <img src="${leader.image}" alt="${leader.name}" class="politician-image" />
            <img src="${leader.partyLogo}" alt="${leader.party}" class="party-logo" />
          </div>
          <div class="card-content">
            <h3 class="politician-name">${leader.name}</h3>
            <p class="politician-party">${leader.party}</p>
            <div class="policies-grid">
              ${leader.policies
                .map(
                  (policy) => `
                    <div class="policy-item-wrapper" style="background: ${leader.primaryColor};">
                      <p class="policy-label">${policy.name}</p>
                      <p class="policy-score">+${policy.bonus}%</p>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
      `
        )
        .join("");      let currentIndex = 0;
      let selectedPolitician = null;
      
      const updateCarousel = () => {
        const cards = document.querySelectorAll(".card-container");
        cards.forEach((card, index) => {
          card.classList.remove("active", "prev", "next", "hidden");
          if (index === currentIndex) {
            card.classList.add("active");
          } else if (index === currentIndex - 1) {
            card.classList.add("prev");
          } else if (index === currentIndex + 1) {
            card.classList.add("next");
          } else {
            card.classList.add("hidden");
          }
        });
      };

      document.getElementById("prev-btn").addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + leaders.length) % leaders.length;
        updateCarousel();
      });

      document.getElementById("next-btn").addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % leaders.length;
        updateCarousel();
      });      // Make selectCurrentPolitician globally available
      window.selectCurrentPolitician = () => {
        selectedPolitician = leaders[currentIndex];
        gameConfig.player1Politician = selectedPolitician.name;
        
        // Randomly select AI opponent (different party from player selection)
        const availableOpponents = leaders.filter(leader => 
          leader.name !== selectedPolitician.name && 
          leader.party !== selectedPolitician.party
        );
        
        // If no opponents from different parties, fall back to different politicians
        const finalOpponents = availableOpponents.length > 0 ? 
          availableOpponents : 
          leaders.filter(leader => leader.name !== selectedPolitician.name);
          
        const aiOpponent = finalOpponents[Math.floor(Math.random() * finalOpponents.length)];
        gameConfig.player2Politician = aiOpponent.name;
        
        localStorage.setItem("gameConfig", JSON.stringify(gameConfig));
        console.log("Player selected:", selectedPolitician.name, `(${selectedPolitician.party})`);
        console.log("AI opponent:", aiOpponent.name, `(${aiOpponent.party})`);

        // Update Step 3 with selections
        updateStep3Display(selectedPolitician, aiOpponent);

        // Show game options screen
        document.getElementById("step-2").classList.add("hidden");
        document.getElementById("step-3").classList.remove("hidden");
      };

      updateCarousel();
    })
    .catch((error) => console.error("Error loading politicians data:", error));

  console.log("Leader cards set up successfully.");
}

// Function to update Step 3 display with selected politicians
function updateStep3Display(playerPolitician, aiPolitician) {
  // Update player selection display
  const playerSummary = document.getElementById("player-summary");
  playerSummary.innerHTML = `
    <div class="politician-summary">
      <div class="politician-image-container-small">
        <img src="${playerPolitician.image}" alt="${playerPolitician.name}" class="politician-image-small" />
        <img src="${playerPolitician.partyLogo}" alt="${playerPolitician.party}" class="party-logo-small" />
      </div>
      <div class="politician-info">
        <h4 class="politician-name-small">${playerPolitician.name}</h4>
        <p class="politician-party-small">${playerPolitician.party}</p>
      </div>
    </div>
  `;

  // Update AI opponent display
  const aiSummary = document.getElementById("ai-summary");
  aiSummary.innerHTML = `
    <div class="politician-summary">
      <div class="politician-image-container-small">
        <img src="${aiPolitician.image}" alt="${aiPolitician.name}" class="politician-image-small" />
        <img src="${aiPolitician.partyLogo}" alt="${aiPolitician.party}" class="party-logo-small" />
      </div>
      <div class="politician-info">
        <h4 class="politician-name-small">${aiPolitician.name}</h4>
        <p class="politician-party-small">${aiPolitician.party}</p>
      </div>
    </div>
  `;
}

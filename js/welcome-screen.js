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

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("User signed in successfully:", user);

    // Store user information in localStorage
    localStorage.setItem("user", JSON.stringify({
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    }));

    console.log("User information stored in localStorage:", localStorage.getItem("user"));

    // Initialize game configuration
    const gameConfig = {
      playerName: user.displayName,
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
        });

        // Make selectCurrentPolitician globally available
        window.selectCurrentPolitician = () => {
          selectedPolitician = leaders[currentIndex];
          gameConfig.player1Politician = selectedPolitician.name;
          
          // Randomly select AI opponent (different from player selection)
          const availableOpponents = leaders.filter(leader => leader.name !== selectedPolitician.name);
          const aiOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
          gameConfig.player2Politician = aiOpponent.name;
          
          localStorage.setItem("gameConfig", JSON.stringify(gameConfig));
          console.log("Player selected:", selectedPolitician.name);
          console.log("AI opponent:", aiOpponent.name);

          // Update Step 3 with selections
          updateStep3Display(selectedPolitician, aiOpponent);

          // Show game options screen
          document.getElementById("step-2").classList.add("hidden");
          document.getElementById("step-3").classList.remove("hidden");
        };

        updateCarousel();
      })
      .catch((error) => console.error("Error loading politicians data:", error));

    console.log("Leader cards set up successfully.");    // Redirect to candidate selection screen
    document.getElementById("step-2").classList.remove("hidden");
    document.getElementById("google-sign-in-btn").classList.add("hidden");

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

    // Set up difficulty selection
    setupDifficultySelection();

    // Set up start game functionality
    setupStartGameFunction();
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
    alert(`Failed to sign in. Error: ${error.message}`);
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
  signInButton.addEventListener("click", signInWithGoogle);
});

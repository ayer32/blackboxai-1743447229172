// API Base URL
const API_URL = 'http://localhost:5000/api';

// Players list container
const playersList = document.getElementById('playersList');

// Get players from API
async function getPlayers(filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('name[$regex]', filters.search);
        if (filters.role) queryParams.append('role', filters.role);
        if (filters.team) queryParams.append('teams', filters.team);

        const response = await fetch(`${API_URL}/players?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch players');
        }

        displayPlayers(data.data);
    } catch (error) {
        console.error('Error fetching players:', error);
        showAlert('Failed to load players', 'error');
    }
}

// Display players in cards
function displayPlayers(players) {
    playersList.innerHTML = players.map(player => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold">${player.name}</h3>
                        <p class="text-gray-600">${player.role}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm ${getRoleClass(player.role)}">
                        #${player.jerseyNumber || 'N/A'}
                    </span>
                </div>
                <div class="space-y-2 text-gray-600">
                    <p><i class="fas fa-user mr-2"></i>Age: ${calculateAge(player.dateOfBirth)}</p>
                    <p><i class="fas fa-cricket-bat-ball mr-2"></i>${player.battingStyle} | ${player.bowlingStyle}</p>
                    <p><i class="fas fa-users mr-2"></i>${player.teams[0]?.team.name || 'No Team'}</p>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div class="bg-gray-50 p-2 rounded">
                        <p class="text-gray-500">Matches</p>
                        <p class="font-semibold">${player.stats.matches}</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded">
                        <p class="text-gray-500">Runs</p>
                        <p class="font-semibold">${player.stats.batting.runs}</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded">
                        <p class="text-gray-500">Wickets</p>
                        <p class="font-semibold">${player.stats.bowling.wickets}</p>
                    </div>
                </div>
                <div class="mt-6 flex justify-between items-center">
                    <button onclick="viewPlayerDetails('${player._id}')"
                        class="text-accent hover:text-blue-700 transition">
                        View Details
                    </button>
                    ${isAdmin() || isTeamManager(player.teams[0]?.team) ? `
                        <div class="flex space-x-2">
                            <button onclick="editPlayer('${player._id}')"
                                class="text-gray-600 hover:text-gray-800 transition">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deletePlayer('${player._id}')"
                                class="text-red-500 hover:text-red-700 transition">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Get role class for badge
function getRoleClass(role) {
    switch (role) {
        case 'Batsman':
            return 'bg-blue-100 text-blue-800';
        case 'Bowler':
            return 'bg-green-100 text-green-800';
        case 'All-rounder':
            return 'bg-purple-100 text-purple-800';
        case 'Wicket Keeper':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// View player details
async function viewPlayerDetails(playerId) {
    try {
        const response = await fetch(`${API_URL}/players/${playerId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch player details');
        }

        displayPlayerDetails(data.data);
    } catch (error) {
        console.error('Error fetching player details:', error);
        showAlert('Failed to load player details', 'error');
    }
}

// Display player details in modal
function displayPlayerDetails(player) {
    // Set player title
    document.getElementById('playerDetailsTitle').textContent = player.name;

    // Display player info
    document.getElementById('playerInfo').innerHTML = `
        <p><strong>Role:</strong> ${player.role}</p>
        <p><strong>Age:</strong> ${calculateAge(player.dateOfBirth)} years</p>
        <p><strong>Batting Style:</strong> ${player.battingStyle}</p>
        <p><strong>Bowling Style:</strong> ${player.bowlingStyle}</p>
        <p><strong>Jersey Number:</strong> ${player.jerseyNumber || 'N/A'}</p>
        <p><strong>Current Team:</strong> ${player.teams[0]?.team.name || 'No Team'}</p>
    `;

    // Display player stats
    document.getElementById('playerStats').innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2">Batting</h4>
                <p>Matches: ${player.stats.matches}</p>
                <p>Runs: ${player.stats.batting.runs}</p>
                <p>Average: ${player.stats.batting.average.toFixed(2)}</p>
                <p>Strike Rate: ${player.stats.batting.strikeRate.toFixed(2)}</p>
                <p>50s: ${player.stats.batting.fifties}</p>
                <p>100s: ${player.stats.batting.hundreds}</p>
            </div>
            <div>
                <h4 class="font-semibold mb-2">Bowling</h4>
                <p>Wickets: ${player.stats.bowling.wickets}</p>
                <p>Economy: ${player.stats.bowling.economy.toFixed(2)}</p>
                <p>Average: ${player.stats.bowling.average.toFixed(2)}</p>
                <p>5W: ${player.stats.bowling.fiveWickets}</p>
                <p>Best: ${player.stats.bowling.bestFigures}</p>
            </div>
        </div>
    `;

    // Display recent matches
    document.getElementById('recentMatches').innerHTML = player.recentMatches.map(match => `
        <div class="bg-gray-50 p-3 rounded">
            <div class="flex justify-between items-center mb-2">
                <div class="text-sm">
                    ${match.tournament.name} - ${formatDate(match.date)}
                </div>
                <div class="text-sm text-gray-500">
                    ${match.teams.team1.name} vs ${match.teams.team2.name}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p>Batting: ${match.performance.batting.runs} runs (${match.performance.batting.balls} balls)</p>
                    <p class="text-gray-500">SR: ${((match.performance.batting.runs / match.performance.batting.balls) * 100).toFixed(2)}</p>
                </div>
                <div>
                    <p>Bowling: ${match.performance.bowling.wickets}/${match.performance.bowling.runs} (${match.performance.bowling.overs} ov)</p>
                    <p class="text-gray-500">Econ: ${(match.performance.bowling.runs / match.performance.bowling.overs).toFixed(2)}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Show modal
    document.getElementById('playerDetailsModal').classList.remove('hidden');
}

// Add player
async function addPlayer(playerData) {
    try {
        const response = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(playerData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add player');
        }

        // Refresh players list
        getPlayers();
        
        // Close modal
        closeModal('addPlayerModal');
        
        // Show success message
        showAlert('Player added successfully', 'success');
    } catch (error) {
        console.error('Error adding player:', error);
        document.getElementById('addPlayerError').textContent = error.message;
        document.getElementById('addPlayerError').classList.remove('hidden');
    }
}

// Delete player
async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/players/${playerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete player');
        }

        // Refresh players list
        getPlayers();
        
        // Show success message
        showAlert('Player deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting player:', error);
        showAlert(error.message, 'error');
    }
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white`;
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial players
    getPlayers();

    // Search and filter form submission
    document.getElementById('applyFilters').addEventListener('click', () => {
        const filters = {
            search: document.getElementById('searchPlayers').value,
            role: document.getElementById('roleFilter').value,
            team: document.getElementById('teamFilter').value
        };
        getPlayers(filters);
    });

    // Add player form submission
    document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const playerData = {
            name: e.target.name.value,
            dateOfBirth: e.target.dateOfBirth.value,
            role: e.target.role.value,
            team: e.target.team.value,
            battingStyle: e.target.battingStyle.value,
            bowlingStyle: e.target.bowlingStyle.value,
            jerseyNumber: e.target.jerseyNumber.value
        };
        addPlayer(playerData);
    });

    // Show add player modal
    document.getElementById('addPlayerBtn').addEventListener('click', () => {
        document.getElementById('addPlayerModal').classList.remove('hidden');
    });
});
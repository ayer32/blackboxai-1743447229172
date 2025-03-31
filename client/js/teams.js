// API Base URL
const API_URL = 'http://localhost:5000/api';

// Teams list container
const teamsList = document.getElementById('teamsList');

// Get teams from API
async function getTeams(filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('name[$regex]', filters.search);
        if (filters.sort) queryParams.append('sort', filters.sort);

        const response = await fetch(`${API_URL}/teams?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch teams');
        }

        displayTeams(data.data);
    } catch (error) {
        console.error('Error fetching teams:', error);
        showAlert('Failed to load teams', 'error');
    }
}

// Display teams in cards
function displayTeams(teams) {
    teamsList.innerHTML = teams.map(team => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    ${team.logo ? `
                        <img src="${team.logo}" alt="${team.name}" class="w-16 h-16 rounded-full mr-4 object-cover">
                    ` : `
                        <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                            <span class="text-2xl font-bold text-gray-500">${team.shortName}</span>
                        </div>
                    `}
                    <div>
                        <h3 class="text-xl font-semibold">${team.name}</h3>
                        <p class="text-gray-600">${team.homeGround}</p>
                    </div>
                </div>
                <div class="space-y-2 text-gray-600">
                    <p><i class="fas fa-user-tie mr-2"></i>Manager: ${team.manager.name}</p>
                    <p><i class="fas fa-users mr-2"></i>Players: ${team.players.length}</p>
                    <div class="flex space-x-4">
                        <p><i class="fas fa-trophy mr-1"></i>${team.stats.matchesWon}</p>
                        <p><i class="fas fa-percentage mr-1"></i>${team.winPercentage}%</p>
                    </div>
                </div>
                <div class="mt-6 flex justify-between items-center">
                    <button onclick="viewTeamDetails('${team._id}')"
                        class="text-accent hover:text-blue-700 transition">
                        View Details
                    </button>
                    ${isAdmin() || isTeamManager(team) ? `
                        <div class="flex space-x-2">
                            <button onclick="editTeam('${team._id}')"
                                class="text-gray-600 hover:text-gray-800 transition">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${isAdmin() ? `
                                <button onclick="deleteTeam('${team._id}')"
                                    class="text-red-500 hover:text-red-700 transition">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Check if user is admin
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'Admin';
}

// Check if user is team manager
function isTeamManager(team) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'Team Manager' && team.manager.userId === user._id;
}

// View team details
async function viewTeamDetails(teamId) {
    try {
        const response = await fetch(`${API_URL}/teams/${teamId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch team details');
        }

        displayTeamDetails(data.data);
    } catch (error) {
        console.error('Error fetching team details:', error);
        showAlert('Failed to load team details', 'error');
    }
}

// Display team details in modal
function displayTeamDetails(team) {
    // Set team title
    document.getElementById('teamDetailsTitle').textContent = team.name;

    // Display team info
    document.getElementById('teamInfo').innerHTML = `
        <p><strong>Short Name:</strong> ${team.shortName}</p>
        <p><strong>Home Ground:</strong> ${team.homeGround}</p>
        <p><strong>Manager:</strong> ${team.manager.name}</p>
        <p><strong>Manager Contact:</strong> ${team.manager.contact}</p>
        <p><strong>Coach:</strong> ${team.coach.name}</p>
        <p><strong>Coach Specialization:</strong> ${team.coach.specialization || 'N/A'}</p>
    `;

    // Display team stats
    document.getElementById('teamStats').innerHTML = `
        <p><strong>Matches Played:</strong> ${team.stats.matchesPlayed}</p>
        <p><strong>Matches Won:</strong> ${team.stats.matchesWon}</p>
        <p><strong>Matches Lost:</strong> ${team.stats.matchesLost}</p>
        <p><strong>Matches Drawn:</strong> ${team.stats.matchesDrawn}</p>
        <p><strong>Win Percentage:</strong> ${team.winPercentage}%</p>
    `;

    // Display players list
    document.getElementById('playersList').innerHTML = team.players.map(player => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold">${player.name}</h4>
                    <p class="text-gray-600">${player.role}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-600">Age: ${calculateAge(player.dateOfBirth)}</p>
                    <p class="text-sm text-gray-600">${player.battingStyle} | ${player.bowlingStyle}</p>
                </div>
            </div>
            ${isAdmin() || isTeamManager(team) ? `
                <div class="mt-2 flex justify-end space-x-2">
                    <button onclick="editPlayer('${player._id}')"
                        class="text-gray-600 hover:text-gray-800 transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="removePlayer('${team._id}', '${player._id}')"
                        class="text-red-500 hover:text-red-700 transition">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');

    // Show modal
    document.getElementById('teamDetailsModal').classList.remove('hidden');
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

// Create team
async function createTeam(formData) {
    try {
        const response = await fetch(`${API_URL}/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create team');
        }

        // Refresh teams list
        getTeams();
        
        // Close modal
        closeModal('createTeamModal');
        
        // Show success message
        showAlert('Team created successfully', 'success');
    } catch (error) {
        console.error('Error creating team:', error);
        document.getElementById('createTeamError').textContent = error.message;
        document.getElementById('createTeamError').classList.remove('hidden');
    }
}

// Add player to team
async function addPlayer(teamId, playerData) {
    try {
        const response = await fetch(`${API_URL}/teams/${teamId}/players`, {
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

        // Refresh team details
        viewTeamDetails(teamId);
        
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

// Remove player from team
async function removePlayer(teamId, playerId) {
    if (!confirm('Are you sure you want to remove this player from the team?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/teams/${teamId}/players/${playerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to remove player');
        }

        // Refresh team details
        viewTeamDetails(teamId);
        
        // Show success message
        showAlert('Player removed successfully', 'success');
    } catch (error) {
        console.error('Error removing player:', error);
        showAlert(error.message, 'error');
    }
}

// Delete team
async function deleteTeam(teamId) {
    if (!confirm('Are you sure you want to delete this team?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete team');
        }

        // Refresh teams list
        getTeams();
        
        // Show success message
        showAlert('Team deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting team:', error);
        showAlert(error.message, 'error');
    }
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
    // Load initial teams
    getTeams();

    // Search and filter form submission
    document.getElementById('applyFilters').addEventListener('click', () => {
        const filters = {
            search: document.getElementById('searchTeams').value,
            sort: document.getElementById('sortTeams').value
        };
        getTeams(filters);
    });

    // Create team form submission
    document.getElementById('createTeamForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            name: e.target.name.value,
            shortName: e.target.shortName.value,
            manager: {
                name: e.target['manager.name'].value,
                contact: e.target['manager.contact'].value
            },
            coach: {
                name: e.target['coach.name'].value,
                specialization: e.target['coach.specialization'].value
            },
            homeGround: e.target.homeGround.value,
            logo: e.target.logo.value || null
        };
        createTeam(formData);
    });

    // Add player form submission
    document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const teamId = e.target.dataset.teamId;
        const playerData = {
            name: e.target.name.value,
            dateOfBirth: e.target.dateOfBirth.value,
            role: e.target.role.value,
            battingStyle: e.target.battingStyle.value,
            bowlingStyle: e.target.bowlingStyle.value
        };
        addPlayer(teamId, playerData);
    });

    // Show create team modal
    document.getElementById('createTeamBtn').addEventListener('click', () => {
        document.getElementById('createTeamModal').classList.remove('hidden');
    });

    // Show add player modal
    document.getElementById('addPlayerBtn')?.addEventListener('click', () => {
        const teamId = document.getElementById('teamDetailsTitle').dataset.teamId;
        document.getElementById('addPlayerForm').dataset.teamId = teamId;
        document.getElementById('addPlayerModal').classList.remove('hidden');
    });
});
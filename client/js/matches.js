// API Base URL
const API_URL = 'http://localhost:5000/api';

// Matches list container
const matchesList = document.getElementById('matchesList');

// Get matches from API
async function getMatches(filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.tournament) queryParams.append('tournament', filters.tournament);
        if (filters.team) queryParams.append('teams', filters.team);
        if (filters.date) queryParams.append('schedule.startDate[gte]', filters.date);
        if (filters.status) queryParams.append('status', filters.status);

        const response = await fetch(`${API_URL}/matches?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch matches');
        }

        displayMatches(data.data);
        updateMatchCounts(data.data);
    } catch (error) {
        console.error('Error fetching matches:', error);
        showAlert('Failed to load matches', 'error');
    }
}

// Display matches in list
function displayMatches(matches) {
    matchesList.innerHTML = matches.map(match => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-sm text-gray-600">${formatDate(match.schedule.startDate)}</span>
                        <h3 class="text-xl font-semibold">${match.teams.team1.name} vs ${match.teams.team2.name}</h3>
                        <p class="text-gray-600">${match.venue.ground}, ${match.venue.city}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm ${getStatusClass(match.status)}">
                        ${match.status}
                    </span>
                </div>
                
                ${match.status === 'Completed' ? `
                    <div class="border-t border-b py-4 my-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="font-semibold">${match.teams.team1.name}</p>
                                <p class="text-2xl">${match.innings[0].totalRuns}/${match.innings[0].wickets}
                                    <span class="text-sm text-gray-600">(${match.innings[0].overs} ov)</span>
                                </p>
                            </div>
                            <div>
                                <p class="font-semibold">${match.teams.team2.name}</p>
                                <p class="text-2xl">${match.innings[1].totalRuns}/${match.innings[1].wickets}
                                    <span class="text-sm text-gray-600">(${match.innings[1].overs} ov)</span>
                                </p>
                            </div>
                        </div>
                        <p class="mt-2 text-accent">${match.result.description}</p>
                    </div>
                ` : match.status === 'In Progress' ? `
                    <div class="border-t border-b py-4 my-4">
                        <div class="animate-pulse">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="font-semibold">${match.innings[0].battingTeam.name}</p>
                                    <p class="text-2xl">${match.innings[0].totalRuns}/${match.innings[0].wickets}
                                        <span class="text-sm text-gray-600">(${match.innings[0].overs} ov)</span>
                                    </p>
                                </div>
                                <div class="text-red-500">
                                    <i class="fas fa-circle animate-ping"></i> LIVE
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="border-t border-b py-4 my-4">
                        <p class="text-center text-gray-600">Match starts at ${formatTime(match.schedule.startDate)}</p>
                    </div>
                `}

                <div class="flex justify-between items-center">
                    <button onclick="viewMatchDetails('${match._id}')"
                        class="text-accent hover:text-blue-700 transition">
                        View Details
                    </button>
                    ${isAdmin() && match.status !== 'Completed' ? `
                        <div class="flex space-x-2">
                            ${match.status === 'In Progress' ? `
                                <button onclick="updateScore('${match._id}')"
                                    class="text-green-600 hover:text-green-800 transition">
                                    <i class="fas fa-edit"></i> Update Score
                                </button>
                            ` : match.status === 'Scheduled' ? `
                                <button onclick="startMatch('${match._id}')"
                                    class="text-blue-600 hover:text-blue-800 transition">
                                    <i class="fas fa-play"></i> Start Match
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Update match counts
function updateMatchCounts(matches) {
    const counts = {
        live: matches.filter(m => m.status === 'In Progress').length,
        upcoming: matches.filter(m => m.status === 'Scheduled').length,
        completed: matches.filter(m => m.status === 'Completed').length,
        all: matches.length
    };

    document.getElementById('liveMatchesCount').textContent = `${counts.live} matches`;
    document.getElementById('upcomingMatchesCount').textContent = `${counts.upcoming} matches`;
    document.getElementById('completedMatchesCount').textContent = `${counts.completed} matches`;
    document.getElementById('allMatchesCount').textContent = `${counts.all} matches`;
}

// Get status class for badge
function getStatusClass(status) {
    switch (status) {
        case 'In Progress':
            return 'bg-red-100 text-red-800';
        case 'Scheduled':
            return 'bg-yellow-100 text-yellow-800';
        case 'Completed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Check if user is admin
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'Admin';
}

// View match details
async function viewMatchDetails(matchId) {
    try {
        const response = await fetch(`${API_URL}/matches/${matchId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch match details');
        }

        displayMatchDetails(data.data);
    } catch (error) {
        console.error('Error fetching match details:', error);
        showAlert('Failed to load match details', 'error');
    }
}

// Display match details in modal
function displayMatchDetails(match) {
    // Set match title
    document.getElementById('matchDetailsTitle').textContent = 
        `${match.teams.team1.name} vs ${match.teams.team2.name}`;

    // Display match info
    document.getElementById('matchInfo').innerHTML = `
        <p><strong>Tournament:</strong> ${match.tournament ? match.tournament.name : 'N/A'}</p>
        <p><strong>Match Type:</strong> ${match.matchType}</p>
        <p><strong>Date:</strong> ${formatDate(match.schedule.startDate)}</p>
        <p><strong>Time:</strong> ${formatTime(match.schedule.startDate)}</p>
        <p><strong>Venue:</strong> ${match.venue.ground}, ${match.venue.city}</p>
        <p><strong>Status:</strong> ${match.status}</p>
        ${match.status === 'Completed' ? `
            <p><strong>Result:</strong> ${match.result.description}</p>
        ` : ''}
    `;

    // Display scorecard
    document.getElementById('matchScorecard').innerHTML = match.innings.map((innings, index) => `
        <div class="border rounded-lg p-4">
            <h4 class="font-semibold mb-2">${innings.battingTeam.name} Innings</h4>
            <p class="text-xl mb-4">${innings.totalRuns}/${innings.wickets} (${innings.overs} ov)</p>
            
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-2 text-left">Batsman</th>
                            <th class="px-4 py-2 text-center">R</th>
                            <th class="px-4 py-2 text-center">B</th>
                            <th class="px-4 py-2 text-center">4s</th>
                            <th class="px-4 py-2 text-center">6s</th>
                            <th class="px-4 py-2 text-center">SR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${innings.battingScores.map(score => `
                            <tr class="border-t">
                                <td class="px-4 py-2">
                                    ${score.player.name}
                                    ${score.dismissalType !== 'Not Out' ? `
                                        <span class="text-sm text-gray-600">
                                            (${score.dismissalType}${score.dismissedBy ? 
                                                ` b ${score.dismissedBy.name}` : ''})
                                        </span>
                                    ` : ''}
                                </td>
                                <td class="px-4 py-2 text-center">${score.runs}</td>
                                <td class="px-4 py-2 text-center">${score.balls}</td>
                                <td class="px-4 py-2 text-center">${score.fours}</td>
                                <td class="px-4 py-2 text-center">${score.sixes}</td>
                                <td class="px-4 py-2 text-center">
                                    ${((score.runs / score.balls) * 100).toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <table class="min-w-full mt-4">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-2 text-left">Bowler</th>
                            <th class="px-4 py-2 text-center">O</th>
                            <th class="px-4 py-2 text-center">M</th>
                            <th class="px-4 py-2 text-center">R</th>
                            <th class="px-4 py-2 text-center">W</th>
                            <th class="px-4 py-2 text-center">Econ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${innings.bowlingFigures.map(figure => `
                            <tr class="border-t">
                                <td class="px-4 py-2">${figure.player.name}</td>
                                <td class="px-4 py-2 text-center">${figure.overs}</td>
                                <td class="px-4 py-2 text-center">${figure.maidens}</td>
                                <td class="px-4 py-2 text-center">${figure.runs}</td>
                                <td class="px-4 py-2 text-center">${figure.wickets}</td>
                                <td class="px-4 py-2 text-center">
                                    ${(figure.runs / figure.overs).toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');

    // Show update score section for admin if match is in progress
    if (isAdmin() && match.status === 'In Progress') {
        document.getElementById('updateScoreSection').classList.remove('hidden');
        setupScoreUpdateForm(match);
    } else {
        document.getElementById('updateScoreSection').classList.add('hidden');
    }

    // Show modal
    document.getElementById('matchDetailsModal').classList.remove('hidden');
}

// Setup score update form
function setupScoreUpdateForm(match) {
    const currentInnings = match.innings[match.innings.length - 1];
    const form = document.getElementById('updateScoreForm');
    
    form.innerHTML = `
        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-700 mb-2">Runs</label>
                <input type="number" name="runs" min="0" value="${currentInnings.totalRuns}"
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
            </div>
            <div>
                <label class="block text-gray-700 mb-2">Wickets</label>
                <input type="number" name="wickets" min="0" max="10" value="${currentInnings.wickets}"
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
            </div>
            <div>
                <label class="block text-gray-700 mb-2">Overs</label>
                <input type="number" name="overs" min="0" step="0.1" value="${currentInnings.overs}"
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
            </div>
            <div>
                <label class="block text-gray-700 mb-2">Status</label>
                <select name="status"
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="In Progress" ${match.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${match.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
        <button type="submit"
            class="w-full bg-accent text-white py-2 rounded-lg hover:bg-blue-600 transition mt-4">
            Update Score
        </button>
    `;

    form.dataset.matchId = match._id;
}

// Schedule match
async function scheduleMatch(formData) {
    try {
        const response = await fetch(`${API_URL}/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to schedule match');
        }

        // Refresh matches list
        getMatches();
        
        // Close modal
        closeModal('scheduleMatchModal');
        
        // Show success message
        showAlert('Match scheduled successfully', 'success');
    } catch (error) {
        console.error('Error scheduling match:', error);
        document.getElementById('scheduleMatchError').textContent = error.message;
        document.getElementById('scheduleMatchError').classList.remove('hidden');
    }
}

// Update match score
async function updateMatchScore(matchId, scoreData) {
    try {
        const response = await fetch(`${API_URL}/matches/${matchId}/score`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(scoreData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update score');
        }

        // Refresh match details
        viewMatchDetails(matchId);
        
        // Refresh matches list
        getMatches();
        
        // Show success message
        showAlert('Score updated successfully', 'success');
    } catch (error) {
        console.error('Error updating score:', error);
        showAlert(error.message, 'error');
    }
}

// Start match
async function startMatch(matchId) {
    try {
        const response = await fetch(`${API_URL}/matches/${matchId}/start`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to start match');
        }

        // Refresh matches list
        getMatches();
        
        // Show success message
        showAlert('Match started successfully', 'success');
    } catch (error) {
        console.error('Error starting match:', error);
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
    // Load initial matches
    getMatches();

    // Filter buttons
    document.getElementById('liveMatchesBtn').addEventListener('click', () => {
        getMatches({ status: 'In Progress' });
    });

    document.getElementById('upcomingMatchesBtn').addEventListener('click', () => {
        getMatches({ status: 'Scheduled' });
    });

    document.getElementById('completedMatchesBtn').addEventListener('click', () => {
        getMatches({ status: 'Completed' });
    });

    document.getElementById('allMatchesBtn').addEventListener('click', () => {
        getMatches();
    });

    // Filter form submission
    document.getElementById('applyFilters').addEventListener('click', () => {
        const filters = {
            tournament: document.getElementById('tournamentFilter').value,
            team: document.getElementById('teamFilter').value,
            date: document.getElementById('dateFilter').value
        };
        getMatches(filters);
    });

    // Schedule match form submission
    document.getElementById('scheduleMatchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            tournament: e.target.tournament.value,
            matchType: e.target.matchType.value,
            teams: {
                team1: e.target['teams.team1'].value,
                team2: e.target['teams.team2'].value
            },
            schedule: {
                startDate: new Date(`${e.target['schedule.startDate'].value}T${e.target['schedule.startTime'].value}`).toISOString()
            },
            venue: {
                ground: e.target['venue.ground'].value,
                city: e.target['venue.city'].value
            }
        };
        scheduleMatch(formData);
    });

    // Update score form submission
    document.getElementById('updateScoreForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const matchId = e.target.dataset.matchId;
        const scoreData = {
            runs: parseInt(e.target.runs.value),
            wickets: parseInt(e.target.wickets.value),
            overs: parseFloat(e.target.overs.value),
            status: e.target.status.value
        };
        updateMatchScore(matchId, scoreData);
    });

    // Show schedule match modal
    document.getElementById('createMatchBtn').addEventListener('click', () => {
        document.getElementById('scheduleMatchModal').classList.remove('hidden');
    });
});
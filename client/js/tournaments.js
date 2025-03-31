// API Base URL
const API_URL = 'http://localhost:5000/api';

// Tournament list container
const tournamentsList = document.getElementById('tournamentsList');

// Get tournaments from API
async function getTournaments(filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.format) queryParams.append('format', filters.format);
        if (filters.date) queryParams.append('startDate[gte]', filters.date);

        const response = await fetch(`${API_URL}/tournaments?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch tournaments');
        }

        displayTournaments(data.data);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        // Show error message to user
        showAlert('Failed to load tournaments', 'error');
    }
}

// Display tournaments in cards
function displayTournaments(tournaments) {
    tournamentsList.innerHTML = tournaments.map(tournament => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold">${tournament.name}</h3>
                    <span class="px-3 py-1 rounded-full text-sm ${getStatusClass(tournament.status)}">
                        ${tournament.status}
                    </span>
                </div>
                <div class="space-y-2 text-gray-600">
                    <p><i class="fas fa-calendar-alt mr-2"></i>${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</p>
                    <p><i class="fas fa-trophy mr-2"></i>${tournament.format} | ${tournament.type}</p>
                    <p><i class="fas fa-users mr-2"></i>${tournament.teams.length} Teams</p>
                </div>
                <div class="mt-6 flex justify-between items-center">
                    <button onclick="viewTournamentDetails('${tournament._id}')"
                        class="text-accent hover:text-blue-700 transition">
                        View Details
                    </button>
                    ${isAdmin() ? `
                        <div class="flex space-x-2">
                            <button onclick="editTournament('${tournament._id}')"
                                class="text-gray-600 hover:text-gray-800 transition">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteTournament('${tournament._id}')"
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

// Get status class for badge
function getStatusClass(status) {
    switch (status) {
        case 'Upcoming':
            return 'bg-yellow-100 text-yellow-800';
        case 'Ongoing':
            return 'bg-green-100 text-green-800';
        case 'Completed':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
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

// Check if user is admin
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'Admin';
}

// View tournament details
async function viewTournamentDetails(tournamentId) {
    try {
        const response = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch tournament details');
        }

        displayTournamentDetails(data.data);
    } catch (error) {
        console.error('Error fetching tournament details:', error);
        showAlert('Failed to load tournament details', 'error');
    }
}

// Display tournament details in modal
function displayTournamentDetails(tournament) {
    // Set tournament title
    document.getElementById('tournamentDetailsTitle').textContent = tournament.name;

    // Display tournament info
    document.getElementById('tournamentInfo').innerHTML = `
        <p><strong>Format:</strong> ${tournament.format}</p>
        <p><strong>Type:</strong> ${tournament.type}</p>
        <p><strong>Duration:</strong> ${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</p>
        <p><strong>Status:</strong> ${tournament.status}</p>
        <p><strong>Teams:</strong> ${tournament.teams.map(team => team.name).join(', ')}</p>
    `;

    // Display point table
    document.getElementById('pointTable').innerHTML = `
        <table class="min-w-full">
            <thead>
                <tr class="bg-gray-100">
                    <th class="px-4 py-2 text-left">Team</th>
                    <th class="px-4 py-2 text-center">P</th>
                    <th class="px-4 py-2 text-center">W</th>
                    <th class="px-4 py-2 text-center">L</th>
                    <th class="px-4 py-2 text-center">Pts</th>
                    <th class="px-4 py-2 text-center">NRR</th>
                </tr>
            </thead>
            <tbody>
                ${tournament.pointTable.map(entry => `
                    <tr class="border-t">
                        <td class="px-4 py-2">${entry.team.name}</td>
                        <td class="px-4 py-2 text-center">${entry.played}</td>
                        <td class="px-4 py-2 text-center">${entry.won}</td>
                        <td class="px-4 py-2 text-center">${entry.lost}</td>
                        <td class="px-4 py-2 text-center">${entry.points}</td>
                        <td class="px-4 py-2 text-center">${entry.netRunRate.toFixed(3)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Display matches
    document.getElementById('tournamentMatches').innerHTML = tournament.stages
        .map(stage => `
            <div class="mb-4">
                <h4 class="font-semibold mb-2">${stage.name}</h4>
                <div class="space-y-2">
                    ${stage.matches.map(match => `
                        <div class="bg-gray-50 p-3 rounded">
                            <div class="flex justify-between items-center">
                                <div>${match.teams.team1.name} vs ${match.teams.team2.name}</div>
                                <div class="text-sm text-gray-600">${formatDate(match.schedule.startDate)}</div>
                            </div>
                            ${match.status === 'Completed' ? `
                                <div class="text-sm text-gray-600 mt-1">
                                    Winner: ${match.result.winner.name}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    // Show modal
    document.getElementById('tournamentDetailsModal').classList.remove('hidden');
}

// Create tournament
async function createTournament(formData) {
    try {
        const response = await fetch(`${API_URL}/tournaments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create tournament');
        }

        // Refresh tournaments list
        getTournaments();
        
        // Close modal
        closeModal('createTournamentModal');
        
        // Show success message
        showAlert('Tournament created successfully', 'success');
    } catch (error) {
        console.error('Error creating tournament:', error);
        document.getElementById('createTournamentError').textContent = error.message;
        document.getElementById('createTournamentError').classList.remove('hidden');
    }
}

// Delete tournament
async function deleteTournament(tournamentId) {
    if (!confirm('Are you sure you want to delete this tournament?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete tournament');
        }

        // Refresh tournaments list
        getTournaments();
        
        // Show success message
        showAlert('Tournament deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting tournament:', error);
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
    // Load initial tournaments
    getTournaments();

    // Filter form submission
    document.getElementById('applyFilters').addEventListener('click', () => {
        const filters = {
            status: document.getElementById('statusFilter').value,
            format: document.getElementById('formatFilter').value,
            date: document.getElementById('dateFilter').value
        };
        getTournaments(filters);
    });

    // Create tournament form submission
    document.getElementById('createTournamentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            name: e.target.name.value,
            shortName: e.target.shortName.value,
            startDate: e.target.startDate.value,
            endDate: e.target.endDate.value,
            format: e.target.format.value,
            type: e.target.type.value,
            teams: Array.from(e.target.querySelectorAll('input[name="teams"]:checked'))
                .map(input => input.value)
        };
        createTournament(formData);
    });

    // Show create tournament modal
    document.getElementById('createTournamentBtn').addEventListener('click', () => {
        document.getElementById('createTournamentModal').classList.remove('hidden');
    });
});
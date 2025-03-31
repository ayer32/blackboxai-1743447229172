// API Base URL
const API_URL = 'http://localhost:5000/api';

// Dashboard elements
const activeTournamentsCount = document.getElementById('activeTournamentsCount');
const liveMatchesCount = document.getElementById('liveMatchesCount');
const totalTeamsCount = document.getElementById('totalTeamsCount');
const totalPlayersCount = document.getElementById('totalPlayersCount');
const recentActivity = document.getElementById('recentActivity');
const upcomingMatches = document.getElementById('upcomingMatches');
const tournamentProgress = document.getElementById('tournamentProgress');
const teamPerformance = document.getElementById('teamPerformance');

// Fetch dashboard data
async function fetchDashboardData() {
    try {
        const [
            tournamentsData,
            matchesData,
            teamsData,
            playersData
        ] = await Promise.all([
            fetchTournaments(),
            fetchMatches(),
            fetchTeams(),
            fetchPlayers()
        ]);

        updateDashboardCounts(tournamentsData, matchesData, teamsData, playersData);
        displayRecentActivity(matchesData.recentActivity);
        displayUpcomingMatches(matchesData.upcoming);
        displayTournamentProgress(tournamentsData.active);
        displayTeamPerformance(teamsData.performance);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showAlert('Failed to load dashboard data', 'error');
    }
}

// Fetch tournaments data
async function fetchTournaments() {
    const response = await fetch(`${API_URL}/tournaments`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Fetch matches data
async function fetchMatches() {
    const response = await fetch(`${API_URL}/matches`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Fetch teams data
async function fetchTeams() {
    const response = await fetch(`${API_URL}/teams`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Fetch players data
async function fetchPlayers() {
    const response = await fetch(`${API_URL}/players`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Update dashboard counts
function updateDashboardCounts(tournaments, matches, teams, players) {
    const activeTournaments = tournaments.data.filter(t => t.status === 'Ongoing').length;
    const liveMatches = matches.data.filter(m => m.status === 'In Progress').length;

    activeTournamentsCount.textContent = activeTournaments;
    liveMatchesCount.textContent = liveMatches;
    totalTeamsCount.textContent = teams.count;
    totalPlayersCount.textContent = players.count;
}

// Display recent activity
function displayRecentActivity(activities) {
    recentActivity.innerHTML = activities.map(activity => `
        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div class="w-8 h-8 rounded-full flex items-center justify-center ${getActivityIconClass(activity.type)}">
                <i class="${getActivityIcon(activity.type)}"></i>
            </div>
            <div>
                <p class="text-sm">${activity.description}</p>
                <p class="text-xs text-gray-500">${formatTimeAgo(activity.timestamp)}</p>
            </div>
        </div>
    `).join('');
}

// Display upcoming matches
function displayUpcomingMatches(matches) {
    upcomingMatches.innerHTML = matches.map(match => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-2">
                    <span class="font-semibold">${match.teams.team1.name}</span>
                    <span class="text-gray-500">vs</span>
                    <span class="font-semibold">${match.teams.team2.name}</span>
                </div>
                <span class="text-sm text-gray-500">${formatDate(match.schedule.startDate)}</span>
            </div>
            <div class="text-sm text-gray-600">
                <i class="fas fa-map-marker-alt mr-1"></i> ${match.venue.ground}, ${match.venue.city}
            </div>
        </div>
    `).join('');
}

// Display tournament progress
function displayTournamentProgress(tournaments) {
    tournamentProgress.innerHTML = tournaments.map(tournament => `
        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">${tournament.name}</span>
                <span class="text-sm text-gray-500">${tournament.progress}% Complete</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-accent h-2 rounded-full" style="width: ${tournament.progress}%"></div>
            </div>
        </div>
    `).join('');
}

// Display team performance
function displayTeamPerformance(teams) {
    teamPerformance.innerHTML = teams.map(team => `
        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">${team.name}</span>
                <span class="text-sm text-gray-500">Win Rate: ${team.winRate}%</span>
            </div>
            <div class="flex space-x-1">
                ${team.recentForm.map(result => `
                    <div class="w-6 h-6 rounded-full flex items-center justify-center ${
                        result === 'W' ? 'bg-green-100 text-green-600' :
                        result === 'L' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                    }">
                        ${result}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Helper functions
function getActivityIconClass(type) {
    switch (type) {
        case 'match':
            return 'bg-blue-100 text-blue-500';
        case 'tournament':
            return 'bg-purple-100 text-purple-500';
        case 'team':
            return 'bg-green-100 text-green-500';
        default:
            return 'bg-gray-100 text-gray-500';
    }
}

function getActivityIcon(type) {
    switch (type) {
        case 'match':
            return 'fas fa-cricket-bat-ball';
        case 'tournament':
            return 'fas fa-trophy';
        case 'team':
            return 'fas fa-users';
        default:
            return 'fas fa-info-circle';
    }
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) {
        return 'just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString();
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    // Load initial dashboard data
    fetchDashboardData();

    // Refresh dashboard data every 30 seconds
    setInterval(fetchDashboardData, 30000);
});
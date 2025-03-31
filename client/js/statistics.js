// API Base URL
const API_URL = 'http://localhost:5000/api';

// Statistics containers
const battingStatsBody = document.getElementById('battingStatsBody');
const bowlingStatsBody = document.getElementById('bowlingStatsBody');
const overallRankings = document.getElementById('overallRankings');
const tournamentRankings = document.getElementById('tournamentRankings');
const highestTeamScores = document.getElementById('highestTeamScores');
const bestMatchPerformances = document.getElementById('bestMatchPerformances');

// Fetch statistics data
async function fetchStatistics() {
    try {
        const [
            battingStats,
            bowlingStats,
            teamStats,
            tournamentStats
        ] = await Promise.all([
            fetchBattingStats(),
            fetchBowlingStats(),
            fetchTeamStats(),
            fetchTournamentStats()
        ]);

        displayBattingStats(battingStats);
        displayBowlingStats(bowlingStats);
        displayTeamRankings(teamStats);
        displayTournamentStats(tournamentStats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        showAlert('Failed to load statistics', 'error');
    }
}

// Fetch batting statistics
async function fetchBattingStats() {
    const response = await fetch(`${API_URL}/statistics/batting`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Fetch bowling statistics
async function fetchBowlingStats() {
    const response = await fetch(`${API_URL}/statistics/bowling`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Fetch team statistics
async function fetchTeamStats() {
    const response = await fetch(`${API_URL}/statistics/teams`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Fetch tournament statistics
async function fetchTournamentStats() {
    const response = await fetch(`${API_URL}/statistics/tournaments`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
}

// Display batting statistics
function displayBattingStats(stats) {
    battingStatsBody.innerHTML = stats.data.map(player => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${player.name}</div>
                        <div class="text-sm text-gray-500">${player.team}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.matches}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.runs}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.average.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.strikeRate.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.hundreds}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.fifties}</td>
        </tr>
    `).join('');
}

// Display bowling statistics
function displayBowlingStats(stats) {
    bowlingStatsBody.innerHTML = stats.data.map(player => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${player.name}</div>
                        <div class="text-sm text-gray-500">${player.team}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.matches}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.wickets}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.average.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.economy.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.fiveWickets}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${player.bestFigures}</td>
        </tr>
    `).join('');
}

// Display team rankings
function displayTeamRankings(stats) {
    // Overall Rankings
    overallRankings.innerHTML = stats.overall.map((team, index) => `
        <div class="flex items-center justify-between p-3 ${index % 2 === 0 ? 'bg-gray-50' : ''}">
            <div class="flex items-center space-x-3">
                <span class="font-semibold">#${index + 1}</span>
                <span>${team.name}</span>
            </div>
            <div class="text-sm text-gray-500">
                Rating: ${team.rating}
            </div>
        </div>
    `).join('');

    // Tournament Rankings
    tournamentRankings.innerHTML = stats.tournaments.map(tournament => `
        <div class="mb-4">
            <h4 class="font-semibold mb-2">${tournament.name}</h4>
            ${tournament.teams.map((team, index) => `
                <div class="flex items-center justify-between p-2 ${index % 2 === 0 ? 'bg-gray-50' : ''}">
                    <div class="flex items-center space-x-3">
                        <span class="text-sm">#${index + 1}</span>
                        <span class="text-sm">${team.name}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                        Points: ${team.points}
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Display tournament statistics
function displayTournamentStats(stats) {
    // Highest Team Scores
    highestTeamScores.innerHTML = stats.highestScores.map(score => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <div class="font-semibold">${score.team}</div>
                <div class="text-sm text-gray-500">${score.tournament}</div>
            </div>
            <div class="text-xl font-bold">${score.score}/${score.wickets}</div>
        </div>
    `).join('');

    // Best Match Performances
    bestMatchPerformances.innerHTML = stats.bestPerformances.map(performance => `
        <div class="p-3 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="font-semibold">${performance.player}</div>
                    <div class="text-sm text-gray-500">${performance.team}</div>
                </div>
                <div class="text-sm text-gray-500">${formatDate(performance.date)}</div>
            </div>
            <div class="text-sm">
                ${performance.type === 'batting' 
                    ? `${performance.runs} runs (${performance.balls} balls)`
                    : `${performance.wickets}/${performance.runs} (${performance.overs} overs)`
                }
            </div>
            <div class="text-xs text-gray-500 mt-1">${performance.tournament}</div>
        </div>
    `).join('');
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
    // Load initial statistics
    fetchStatistics();

    // Add click handlers for statistics category buttons
    const categoryButtons = document.querySelectorAll('.grid button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-accent'));
            // Add active class to clicked button
            button.classList.add('ring-2', 'ring-accent');

            // Show/hide corresponding statistics sections
            const sections = {
                'batting': document.getElementById('battingStats'),
                'bowling': document.getElementById('bowlingStats'),
                'teams': document.getElementById('teamRankings'),
                'tournaments': document.getElementById('tournamentStats')
            };

            Object.entries(sections).forEach(([key, section]) => {
                if (button.textContent.toLowerCase().includes(key)) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });

    // Refresh statistics every 5 minutes
    setInterval(fetchStatistics, 300000);
});
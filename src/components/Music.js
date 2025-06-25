import { auth, supabase } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'

export class Music {
    constructor() {
        this.isConnected = false
        this.currentTrack = null
        this.currentPlaylist = null
        this.accessToken = null
        this.spotifyPlayer = null
        this.deviceId = null
        this.focusPlaylists = []
        this.currentMood = null
        this.listeningHistory = []

        // Mood-based playlist recommendations
        this.moodPlaylists = {
            1: { // Very Bad
                name: 'Calm & Healing',
                description: 'Gentle music to lift your spirits',
                genres: ['ambient', 'classical', 'chill'],
                energy: 0.2,
                valence: 0.3
            },
            2: { // Bad
                name: 'Comfort Zone',
                description: 'Soothing sounds for difficult days',
                genres: ['indie', 'folk', 'soft rock'],
                energy: 0.3,
                valence: 0.4
            },
            3: { // Okay
                name: 'Study Focus',
                description: 'Balanced beats for steady work',
                genres: ['lo-fi', 'instrumental', 'electronic'],
                energy: 0.5,
                valence: 0.5
            },
            4: { // Good
                name: 'Productive Flow',
                description: 'Upbeat tracks to keep you moving',
                genres: ['pop', 'indie', 'electronic'],
                energy: 0.7,
                valence: 0.7
            },
            5: { // Excellent
                name: 'Peak Performance',
                description: 'High-energy music for maximum productivity',
                genres: ['electronic', 'pop', 'rock'],
                energy: 0.8,
                valence: 0.8
            }
        }
    }

    async init() {
        console.log('Initializing Music component...')
        await this.loadConnectionStatus()
        await this.loadListeningHistory()
        this.render()
        this.setupEventListeners()

        if (this.isConnected) {
            await this.initializeSpotifyPlayer()
        }
    }

    async loadConnectionStatus() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { data: musicData } = await supabase
                .from('music_connections')
                .select('*')
                .eq('user_id', user.id)
                .eq('provider', 'spotify')
                .single()

            if (musicData) {
                this.isConnected = true
                this.accessToken = musicData.access_token

                // Check if token needs refresh
                if (musicData.expires_at && new Date(musicData.expires_at) < new Date()) {
                    await this.refreshSpotifyToken(musicData.refresh_token)
                }
            }
        } catch (error) {
            if (error.code !== 'PGRST116') {
                console.error('Error loading music connection:', error)
            }
        }
    }

    async loadListeningHistory() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { data: historyData } = await supabase
                .from('listening_history')
                .select('*')
                .eq('user_id', user.id)
                .order('played_at', { ascending: false })
                .limit(50)

            this.listeningHistory = historyData || []
        } catch (error) {
            console.error('Error loading listening history:', error)
        }
    }

    render() {
        const container = document.getElementById('music-container')
        if (!container) return

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6">
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Focus Music</h1>
                    <p class="text-gray-600 dark:text-gray-400">Enhance your productivity with mood-based playlists</p>
                </div>

                ${this.isConnected ? this.renderMusicDashboard() : this.renderConnectionCard()}
            </div>
        `
    }

    renderConnectionCard() {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="p-6 text-center">
                    <div class="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.2.3-.5.4-.8.4-.2 0-.4-.1-.5-.2-1.5-.9-3.4-1.1-5.6-.6-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 2.5-.5 4.6-.3 6.4.7.3.2.4.6.2.8zm1.1-2.7c-.2.4-.6.5-1 .3-1.7-1-4.4-1.3-6.4-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.3-.7 5.4-.4 7.4.8.4.2.5.6.4 1zm.1-2.8c-2.1-1.2-5.5-1.3-7.5-.7-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.3-.7 6.1-.5 8.6.8.4.2.6.8.3 1.2-.2.4-.8.6-1.2.3z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Spotify</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">Connect your Spotify account to get personalized focus playlists based on your mood and productivity patterns.</p>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">What you'll get:</h4>
                        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Mood-based playlist recommendations</li>
                            <li>• Productivity music analysis</li>
                            <li>• Focus session tracking</li>
                            <li>• Personalized music insights</li>
                        </ul>
                    </div>

                    <button id="connect-spotify-btn" class="btn-gradient text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                        Connect Spotify Account
                    </button>
                </div>
            </div>
        `
    }

    renderMusicDashboard() {
        return `
            <!-- Currently Playing -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Now Playing</h2>
                        <button id="disconnect-spotify" class="text-red-600 hover:text-red-700 text-sm">
                            Disconnect
                        </button>
                    </div>
                    <div id="current-track-info">
                        ${this.renderCurrentTrack()}
                    </div>
                </div>
            </div>

            <!-- Mood-Based Recommendations -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="p-6">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mood-Based Playlists</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">Choose a playlist that matches your current mood for optimal focus</p>
                    <div id="mood-playlists" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.renderMoodPlaylists()}
                    </div>
                </div>
            </div>

            <!-- Focus Sessions -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="p-6">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Focus Sessions</h2>
                    <div id="focus-controls" class="flex items-center gap-4 mb-4">
                        <button id="start-focus-session" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Start Focus Session
                        </button>
                        <select id="focus-duration" class="form-select rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                            <option value="25">25 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="90">1.5 hours</option>
                        </select>
                    </div>
                    <div id="focus-session-status" class="hidden">
                        <!-- Focus session UI will be rendered here -->
                    </div>
                </div>
            </div>

            <!-- Music Analytics -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="p-6">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Music Insights</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Most Productive Genres</h3>
                            <div id="productive-genres">
                                ${this.renderProductiveGenres()}
                            </div>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Listening Patterns</h3>
                            <div class="h-32">
                                <canvas id="listening-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderCurrentTrack() {
        if (!this.currentTrack) {
            return `
                <div class="text-center py-8">
                    <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                        </svg>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400">No music playing</p>
                </div>
            `
        }

        return `
            <div class="flex items-center space-x-4">
                <img src="${this.currentTrack.album.images[0]?.url}" alt="Album art" class="w-16 h-16 rounded-lg">
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900 dark:text-white">${this.currentTrack.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400">${this.currentTrack.artists.map(a => a.name).join(', ')}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500">${this.currentTrack.album.name}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="prev-track" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                    </button>
                    <button id="play-pause" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button id="next-track" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `
    }

    renderMoodPlaylists() {
        return Object.entries(this.moodPlaylists).map(([mood, playlist]) => {
            const moodEmojis = ['😞', '😕', '😐', '🙂', '😄']
            const moodLabels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Excellent']

            return `
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors mood-playlist-card" data-mood="${mood}">
                    <div class="flex items-center space-x-3 mb-2">
                        <span class="text-2xl">${moodEmojis[mood - 1]}</span>
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">${playlist.name}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${moodLabels[mood - 1]}</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${playlist.description}</p>
                    <div class="flex flex-wrap gap-1">
                        ${playlist.genres.map(genre => `
                            <span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs rounded-full text-gray-700 dark:text-gray-300">${genre}</span>
                        `).join('')}
                    </div>
                </div>
            `
        }).join('')
    }

    renderProductiveGenres() {
        // Mock data - in real implementation, this would come from analytics
        const genres = [
            { name: 'Lo-fi Hip Hop', productivity: 85, color: 'bg-blue-500' },
            { name: 'Classical', productivity: 78, color: 'bg-green-500' },
            { name: 'Electronic', productivity: 72, color: 'bg-purple-500' },
            { name: 'Ambient', productivity: 68, color: 'bg-indigo-500' }
        ]

        return genres.map(genre => `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-900 dark:text-white">${genre.name}</span>
                <div class="flex items-center space-x-2">
                    <div class="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div class="${genre.color} h-full rounded-full" style="width: ${genre.productivity}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${genre.productivity}%</span>
                </div>
            </div>
        `).join('')
    }

    setupEventListeners() {
        // Connect Spotify
        document.addEventListener('click', (e) => {
            if (e.target.id === 'connect-spotify-btn') {
                this.connectSpotify()
            }

            if (e.target.id === 'disconnect-spotify') {
                this.disconnectSpotify()
            }

            // Mood playlist selection
            if (e.target.closest('.mood-playlist-card')) {
                const mood = e.target.closest('.mood-playlist-card').dataset.mood
                this.selectMoodPlaylist(parseInt(mood))
            }

            // Playback controls
            if (e.target.id === 'play-pause') {
                this.togglePlayback()
            }
            if (e.target.id === 'prev-track') {
                this.previousTrack()
            }
            if (e.target.id === 'next-track') {
                this.nextTrack()
            }

            // Focus session
            if (e.target.id === 'start-focus-session') {
                this.startFocusSession()
            }
        })
    }

    async connectSpotify() {
        try {
            // Generate a random state for security
            const state = Math.random().toString(36).substring(2, 15)
            localStorage.setItem('spotify_auth_state', state)

            const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-library-read user-top-read user-read-recently-played playlist-read-private'

            const authUrl = new URL('https://accounts.spotify.com/authorize')
            authUrl.searchParams.append('response_type', 'code')
            authUrl.searchParams.append('client_id', import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID')
            authUrl.searchParams.append('scope', scope)
            authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/spotify/callback`)
            authUrl.searchParams.append('state', state)

            window.location.href = authUrl.toString()
        } catch (error) {
            console.error('Error connecting to Spotify:', error)
            ui.showMessage('Failed to connect to Spotify', 'error')
        }
    }

    async disconnectSpotify() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            await supabase
                .from('music_connections')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', 'spotify')

            this.isConnected = false
            this.accessToken = null
            this.currentTrack = null

            ui.showMessage('Spotify disconnected successfully', 'success')
            this.render()
        } catch (error) {
            console.error('Error disconnecting Spotify:', error)
            ui.showMessage('Failed to disconnect Spotify', 'error')
        }
    }

    async selectMoodPlaylist(mood) {
        try {
            // Get mood-based recommendations from Spotify
            const recommendations = await this.getMoodBasedRecommendations(mood)

            if (recommendations && recommendations.tracks.length > 0) {
                // Create a temporary playlist or play the first track
                await this.playTrack(recommendations.tracks[0].uri)
                ui.showMessage(`Playing ${this.moodPlaylists[mood].name} playlist`, 'success')

                // Track this selection for analytics
                await this.trackMoodPlaylistSelection(mood)
            }
        } catch (error) {
            console.error('Error selecting mood playlist:', error)
            ui.showMessage('Failed to play mood playlist', 'error')
        }
    }

    async getMoodBasedRecommendations(mood) {
        const playlist = this.moodPlaylists[mood]

        try {
            const response = await fetch(`/api/spotify/recommendations?` + new URLSearchParams({
                seed_genres: playlist.genres.join(','),
                target_energy: playlist.energy,
                target_valence: playlist.valence,
                limit: 20
            }), {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            })

            return await response.json()
        } catch (error) {
            console.error('Error getting recommendations:', error)
            return null
        }
    }

    async startFocusSession() {
        const duration = document.getElementById('focus-duration').value

        // Show focus session UI
        const statusDiv = document.getElementById('focus-session-status')
        statusDiv.classList.remove('hidden')
        statusDiv.innerHTML = `
            <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-medium text-blue-900 dark:text-blue-100">Focus Session Active</h3>
                    <button id="end-focus-session" class="text-blue-600 hover:text-blue-700 text-sm">End Session</button>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2" id="focus-timer">${duration}:00</div>
                    <p class="text-blue-700 dark:text-blue-300">Stay focused! Music will adapt to help you concentrate.</p>
                </div>
            </div>
        `

        // Start the timer and adapt music
        this.runFocusSession(parseInt(duration))
        ui.showMessage(`Focus session started for ${duration} minutes`, 'success')
    }

    async runFocusSession(durationMinutes) {
        const startTime = Date.now()
        const endTime = startTime + (durationMinutes * 60 * 1000)

        const timer = setInterval(() => {
            const remaining = endTime - Date.now()

            if (remaining <= 0) {
                clearInterval(timer)
                this.endFocusSession()
                return
            }

            const minutes = Math.floor(remaining / 60000)
            const seconds = Math.floor((remaining % 60000) / 1000)

            const timerEl = document.getElementById('focus-timer')
            if (timerEl) {
                timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
            }
        }, 1000)

        // Track the focus session start
        await this.trackFocusSession(durationMinutes, 'start')
    }

    async endFocusSession() {
        const statusDiv = document.getElementById('focus-session-status')
        statusDiv.classList.add('hidden')

        ui.showMessage('Focus session completed! Great work!', 'success')
        await this.trackFocusSession(0, 'end')
    }

    async trackMoodPlaylistSelection(mood) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            await supabase
                .from('music_analytics')
                .insert({
                    user_id: user.id,
                    action_type: 'mood_playlist_selection',
                    mood_rating: mood,
                    timestamp: new Date().toISOString()
                })
        } catch (error) {
            console.error('Error tracking mood playlist selection:', error)
        }
    }

    async trackFocusSession(duration, action) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            await supabase
                .from('music_analytics')
                .insert({
                    user_id: user.id,
                    action_type: `focus_session_${action}`,
                    session_duration: duration,
                    timestamp: new Date().toISOString()
                })
        } catch (error) {
            console.error('Error tracking focus session:', error)
        }
    }

    // Spotify API methods would be implemented here
    async initializeSpotifyPlayer() {
        // Initialize Spotify Web Playback SDK
        // This would require loading the Spotify SDK script
    }

    async togglePlayback() {
        // Implement play/pause functionality
    }

    async previousTrack() {
        // Implement previous track functionality
    }

    async nextTrack() {
        // Implement next track functionality
    }

    async playTrack(uri) {
        // Implement track playing functionality
    }

    async refreshSpotifyToken(refreshToken) {
        // Implement token refresh
    }
}
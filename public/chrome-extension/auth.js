// Authentication utilities for Chrome extension

const SUPABASE_URL = 'https://xltqabrlmfalosewvjby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg';

// Sign in with email and password
async function signIn(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.message || 'Failed to sign in');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Get user profile with team_id
async function getUserProfile(userId, accessToken) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,team_id,full_name,role,interests`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

// Get all teams for user (if user is in multiple teams)
async function getUserTeams(userId, accessToken) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=team_id,teams(id,name)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }

    const data = await response.json();
    // Extract unique teams
    const teams = [];
    const teamMap = new Map();
    data.forEach(profile => {
      if (profile.teams && !teamMap.has(profile.teams.id)) {
        teamMap.set(profile.teams.id, profile.teams);
        teams.push(profile.teams);
      }
    });
    return teams;
  } catch (error) {
    console.error('Get teams error:', error);
    return [];
  }
}

// Store auth data in Chrome storage
function storeAuthData(authData, profile, teamId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      authToken: authData.access_token,
      refreshToken: authData.refresh_token,
      userId: authData.user?.id,
      teamId: teamId,
      profile: profile,
    }, () => {
      // Also notify background script
      chrome.runtime.sendMessage({
        action: 'setAuthData',
        data: {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          user: authData.user,
          teamId: teamId,
          profile: profile,
        }
      }, () => {
        resolve();
      });
    });
  });
}

// Get auth data from Chrome storage
function getStoredAuthData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'refreshToken', 'userId', 'teamId', 'profile'], (data) => {
      resolve({
        access_token: data.authToken,
        refresh_token: data.refreshToken,
        user: data.userId ? { id: data.userId } : null,
        teamId: data.teamId,
        profile: data.profile,
      });
    });
  });
}

// Clear auth data
function clearAuthData() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['authToken', 'refreshToken', 'userId', 'teamId', 'profile'], () => {
      chrome.runtime.sendMessage({ action: 'clearAuthData' }, () => {
        resolve();
      });
    });
  });
}

// Update team selection
function updateTeamSelection(teamId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'refreshToken', 'userId', 'profile'], (data) => {
      chrome.storage.local.set({
        ...data,
        teamId: teamId,
      }, () => {
        chrome.runtime.sendMessage({
          action: 'setAuthData',
          data: {
            access_token: data.authToken,
            refresh_token: data.refreshToken,
            user: data.userId ? { id: data.userId } : null,
            teamId: teamId,
            profile: data.profile,
          }
        }, () => {
          resolve();
        });
      });
    });
  });
}



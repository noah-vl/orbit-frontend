// Background service worker for Chrome extension
// Handles messaging between extension and web pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthData') {
    // Get auth data from storage
    chrome.storage.local.get(['authToken', 'refreshToken', 'userId', 'teamId', 'profile'], (data) => {
      sendResponse({
        success: true,
        data: {
          access_token: data.authToken || null,
          refresh_token: data.refreshToken || null,
          user: data.userId ? { id: data.userId } : null,
          teamId: data.teamId || null,
          profile: data.profile || null,
        }
      });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'setAuthData') {
    // Store auth data
    chrome.storage.local.set({
      authToken: request.data.access_token,
      refreshToken: request.data.refresh_token,
      userId: request.data.user?.id,
      teamId: request.data.teamId,
      profile: request.data.profile,
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'clearAuthData') {
    // Clear auth data
    chrome.storage.local.remove(['authToken', 'refreshToken', 'userId', 'teamId', 'profile'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});



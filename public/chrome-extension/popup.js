document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    
    // Hide both screens initially to prevent flash
    if (authScreen) authScreen.style.display = 'none';
    if (mainScreen) mainScreen.style.display = 'none';
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const authStatus = document.getElementById('authStatus');

    const peopleInput = document.getElementById('peopleInput');
    const mentionSuggestions = document.getElementById('mentionSuggestions');
    const noteInput = document.getElementById('note');
    const ingestBtn = document.getElementById('ingestBtn');
    const statusDiv = document.getElementById('status');

    // Configuration
    const SUPABASE_URL = 'https://xltqabrlmfalosewvjby.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg';
    const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ingest_article`;

    // State
    let currentTeamId = null;
    let accessToken = null;
    let teamMembers = [];
    let mentionMap = new Map();
    let showSuggestions = false;
    let mentionQuery = '';
    let mentionPosition = { start: 0, end: 0 };
    let selectedSuggestionIndex = 0;

    // Fetch team members
    async function fetchTeamMembers() {
        if (!currentTeamId || !accessToken) return;

        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/profiles?team_id=eq.${currentTeamId}&select=id,full_name,role`,
                {
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );
            const data = await response.json();
            teamMembers = data || [];
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    }

    // Check authentication on load
    async function checkAuth() {
        try {
            if (typeof getStoredAuthData !== 'function') {
                console.error('getStoredAuthData not available');
                showAuthScreen();
                return;
            }

            const authData = await getStoredAuthData();
            console.log('Stored auth data:', authData);

            if (authData && authData.access_token && authData.teamId) {
                // Validate token by trying to fetch profile
                try {
                    const profile = await getUserProfile(authData.user.id, authData.access_token);
                    if (profile) {
                        // Token is valid, use stored data
                        accessToken = authData.access_token;
                        currentTeamId = authData.teamId;
                        showMainScreen();
                        await fetchTeamMembers();
                        return;
                    }
                } catch (error) {
                    console.error('Token validation failed, need to re-login:', error);
                    // Token expired or invalid, clear storage
                    if (typeof clearAuthData === 'function') {
                        await clearAuthData();
                    }
                }
            }

            // No valid auth data, show login screen
            showAuthScreen();
        } catch (error) {
            console.error('Error in checkAuth:', error);
            showAuthScreen();
        }
    }

    function showAuthScreen() {
        if (authScreen) {
            authScreen.style.display = 'flex';
        }
        if (mainScreen) {
            mainScreen.style.display = 'none';
        }
    }

    function showMainScreen() {
        if (authScreen) {
            authScreen.style.display = 'none';
        }
        if (mainScreen) {
            mainScreen.style.display = 'flex';
        }
    }


    // Login handler
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = emailInput?.value.trim();
            const password = passwordInput?.value;

            if (!email || !password) {
                authStatus.textContent = 'Please enter email and password';
                authStatus.className = 'status error';
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
            authStatus.textContent = '';
            authStatus.className = 'status';

            try {
                const authData = await signIn(email, password);
                const profile = await getUserProfile(authData.user.id, authData.access_token);

                if (!profile || !profile.team_id) {
                    throw new Error('No team found for user');
                }

                await storeAuthData(authData, profile, profile.team_id);
                accessToken = authData.access_token;
                currentTeamId = profile.team_id;

                showMainScreen();
                await fetchTeamMembers();
            } catch (error) {
                authStatus.textContent = error.message || 'Failed to sign in';
                authStatus.className = 'status error';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign in';
            }
        });


        // State variables already declared above - no need to redeclare
        // fetchTeamMembers function is defined above, before checkAuth()

        // Get caret position in contentEditable
        function getCaretPosition(element) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return 0;

            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            return preCaretRange.toString().length;
        }

        // Set caret position in contentEditable
        function setCaretPosition(element, position) {
            const range = document.createRange();
            const sel = window.getSelection();
            let charCount = 0;
            const nodeStack = [element];
            let node;
            let foundNode = null;
            let foundOffset = 0;

            while (!foundNode && (node = nodeStack.pop())) {
                if (node.nodeType === 3) { // Text node
                    const nextCharCount = charCount + (node.textContent?.length || 0);
                    if (position <= nextCharCount) {
                        foundNode = node;
                        foundOffset = position - charCount;
                    } else {
                        charCount = nextCharCount;
                    }
                } else {
                    for (let i = node.childNodes.length - 1; i >= 0; i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }

            if (foundNode) {
                range.setStart(foundNode, foundOffset);
                range.setEnd(foundNode, foundOffset);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }

        // Update mention highlights in the input
        function updateMentionHighlights(element) {
            const fullText = element.textContent || '';
            if (mentionMap.size === 0) {
                // Clear existing highlights
                element.querySelectorAll('.mention-highlight').forEach(el => {
                    const parent = el.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
                        parent.normalize();
                    }
                });
                return;
            }

            // Save cursor position
            const savedCursorPos = getCaretPosition(element);

            // Clear existing highlights
            element.querySelectorAll('.mention-highlight').forEach(el => {
                const parent = el.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(el.textContent || ''), el);
                    parent.normalize();
                }
            });

            // Rebuild with plain text
            element.textContent = fullText;

            // Apply highlights
            const mentionsToHighlight = [];
            mentionMap.forEach((userId, mentionText) => {
                let searchIndex = 0;
                while (true) {
                    const index = fullText.indexOf(mentionText, searchIndex);
                    if (index === -1) break;

                    const charBefore = index > 0 ? fullText[index - 1] : '';
                    const isWordStart = index === 0 || /[\s@]/.test(charBefore);

                    if (isWordStart && fullText[index] === '@') {
                        mentionsToHighlight.push({
                            start: index,
                            end: index + mentionText.length,
                            text: mentionText
                        });
                    }
                    searchIndex = index + 1;
                }
            });

            // Sort by position and apply in reverse order
            mentionsToHighlight.sort((a, b) => a.start - b.start);
            mentionsToHighlight.reverse().forEach(({ start, end, text: mentionText }) => {
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null
                );

                let charCount = 0;
                let node;
                while (node = walker.nextNode()) {
                    const nodeText = node.textContent || '';
                    const nodeStart = charCount;
                    const nodeEnd = charCount + nodeText.length;

                    if (start >= nodeStart && end <= nodeEnd) {
                        const beforeText = nodeText.substring(0, start - nodeStart);
                        const afterText = nodeText.substring(end - nodeStart);

                        const parent = node.parentNode;
                        if (parent) {
                            if (beforeText) {
                                parent.insertBefore(document.createTextNode(beforeText), node);
                            }

                            const mentionSpan = document.createElement('span');
                            mentionSpan.className = 'mention-highlight';
                            mentionSpan.textContent = mentionText;
                            parent.insertBefore(mentionSpan, node);

                            if (afterText) {
                                parent.insertBefore(document.createTextNode(afterText), node);
                            }
                            parent.removeChild(node);
                        }
                        break;
                    }
                    charCount = nodeEnd;
                }
            });

            // Restore cursor position
            if (savedCursorPos > 0) {
                setTimeout(() => {
                    setCaretPosition(element, savedCursorPos);
                }, 0);
            }
        }

        // Render mention suggestions
        function renderSuggestions(query) {
            if (!showSuggestions || teamMembers.length === 0) {
                mentionSuggestions.classList.remove('show');
                return;
            }

            const filtered = teamMembers
                .filter(member => {
                    const name = (member.full_name || '').toLowerCase();
                    const role = (member.role || '').toLowerCase();
                    const searchQuery = query.toLowerCase();
                    return name.includes(searchQuery) || role.includes(searchQuery);
                })
                .slice(0, 5);

            if (filtered.length === 0) {
                mentionSuggestions.classList.remove('show');
                return;
            }

            mentionSuggestions.innerHTML = filtered
                .map((member, idx) => `
                <button
                    type="button"
                    class="mention-suggestion-item ${idx === selectedSuggestionIndex ? 'selected' : ''}"
                    data-member-id="${member.id}"
                    data-member-name="${member.full_name || 'Unknown'}"
                >
                    <span class="mention-suggestion-name">${member.full_name || 'Unknown'}</span>
                    ${member.role ? `<span class="mention-suggestion-role">(${member.role})</span>` : ''}
                </button>
            `)
                .join('');

            mentionSuggestions.classList.add('show');

            // Add click handlers
            mentionSuggestions.querySelectorAll('.mention-suggestion-item').forEach((btn, idx) => {
                btn.addEventListener('click', () => {
                    selectMention(filtered[idx]);
                });
            });
        }

        // Select a mention from suggestions
        function selectMention(member) {
            const textBefore = peopleInput.textContent.substring(0, mentionPosition.start);
            const textAfter = peopleInput.textContent.substring(mentionPosition.end);
            const mentionText = `@${member.full_name || 'Unknown'}`;

            // Update text
            const newText = textBefore + mentionText + ' ' + textAfter;
            peopleInput.textContent = newText;

            // Store mapping
            mentionMap.set(mentionText, member.id);

            // Move cursor after mention
            const newCursorPos = mentionPosition.start + mentionText.length + 1;
            setCaretPosition(peopleInput, newCursorPos);

            // Update highlights
            setTimeout(() => {
                updateMentionHighlights(peopleInput);
            }, 10);

            // Hide suggestions
            showSuggestions = false;
            mentionSuggestions.classList.remove('show');
            mentionQuery = '';
            selectedSuggestionIndex = 0;
        }

        // Handle input in people field
        peopleInput.addEventListener('input', (e) => {
            const text = peopleInput.textContent || '';
            const cursorPos = getCaretPosition(peopleInput);
            const textBeforeCursor = text.substring(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf('@');

            if (lastAtIndex !== -1) {
                const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
                if (!textAfterAt.match(/[\s\n]/)) {
                    mentionQuery = textAfterAt;
                    mentionPosition = { start: lastAtIndex, end: cursorPos };
                    showSuggestions = true;
                    selectedSuggestionIndex = 0;
                    renderSuggestions(mentionQuery);
                } else {
                    showSuggestions = false;
                    mentionSuggestions.classList.remove('show');
                }
            } else {
                showSuggestions = false;
                mentionSuggestions.classList.remove('show');
            }

            // Update highlights if not showing suggestions
            if (!showSuggestions) {
                requestAnimationFrame(() => {
                    updateMentionHighlights(peopleInput);
                });
            }
        });

        // Handle keyboard navigation in suggestions
        peopleInput.addEventListener('keydown', (e) => {
            if (showSuggestions) {
                const items = mentionSuggestions.querySelectorAll('.mention-suggestion-item');

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
                    renderSuggestions(mentionQuery);
                    items[selectedSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
                    renderSuggestions(mentionQuery);
                    items[selectedSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selectedItem = items[selectedSuggestionIndex];
                    if (selectedItem) {
                        const memberId = selectedItem.getAttribute('data-member-id');
                        const memberName = selectedItem.getAttribute('data-member-name');
                        const member = teamMembers.find(m => m.id === memberId);
                        if (member) {
                            selectMention(member);
                        }
                    }
                } else if (e.key === 'Escape') {
                    showSuggestions = false;
                    mentionSuggestions.classList.remove('show');
                }
            }
        });

        // Extract mentioned user IDs from text
        function extractMentionedUserIds() {
            const text = peopleInput.textContent || '';
            const mentionedUserIds = [];
            const foundMentions = new Set();

            const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
            let match;

            while ((match = mentionRegex.exec(text)) !== null) {
                const mentionText = match[0];
                if (mentionMap.has(mentionText)) {
                    const userId = mentionMap.get(mentionText);
                    if (userId && !foundMentions.has(userId)) {
                        mentionedUserIds.push(userId);
                        foundMentions.add(userId);
                    }
                }
            }

            return mentionedUserIds;
        }

        // Get current tab URL
        let currentUrl = '';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url) {
                currentUrl = tab.url;
            } else {
                if (statusDiv) {
                    statusDiv.textContent = 'Could not get current tab URL.';
                    statusDiv.className = 'status error';
                }
                if (ingestBtn) {
                    ingestBtn.disabled = true;
                }
            }
        } catch (error) {
            console.error('Error getting tab URL:', error);
            if (statusDiv) {
                statusDiv.textContent = 'Could not get current tab URL.';
                statusDiv.className = 'status error';
            }
            if (ingestBtn) {
                ingestBtn.disabled = true;
            }
        }

        // Initialize: check auth immediately, show auth screen if not authenticated
        // Check auth as soon as DOM is ready, with minimal delay for auth.js to load
        async function initializeAuth() {
            // Try immediately first
            if (typeof getStoredAuthData === 'function') {
                await checkAuth();
            } else {
                // If not ready, wait a tiny bit and try again
                setTimeout(async () => {
                    if (typeof getStoredAuthData === 'function') {
                        await checkAuth();
                    } else {
                        console.error('auth.js functions not loaded, showing auth screen');
                        showAuthScreen();
                    }
                }, 10);
            }
        }
        
        // Start checking immediately
        initializeAuth().catch(error => {
            console.error('Error checking auth:', error);
            showAuthScreen();
        });

        // Handle submit (only if ingestBtn exists - i.e., on main screen)
        if (ingestBtn) {
            ingestBtn.addEventListener('click', async () => {
                if (!currentUrl) return;

                const note = noteInput.value.trim();
                const mentionedUserIds = extractMentionedUserIds();

                ingestBtn.disabled = true;
                ingestBtn.textContent = 'Adding...';
                statusDiv.textContent = '';
                statusDiv.className = 'status';

                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timeout (120s)')), 120000)
                    );

                    statusDiv.textContent = 'Adding article...';
                    statusDiv.className = 'status';

                    const fetchPromise = fetch(FUNCTION_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': accessToken ? `Bearer ${accessToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({
                            url: currentUrl,
                            note: note || null,
                            mentioned_users: mentionedUserIds.length > 0 ? mentionedUserIds : null,
                            team_id: currentTeamId
                        })
                    });

                    const response = await Promise.race([fetchPromise, timeoutPromise]);

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Error ${response.status}: ${errorText}`);
                    }

                    const data = await response.json();
                    console.log('Success:', data);

                    // Article is added! Show success immediately
                    statusDiv.textContent = 'Article added to Orbit!';
                    statusDiv.className = 'status success';
                    noteInput.value = '';
                    peopleInput.textContent = '';
                    mentionMap.clear();

                    // Close after a brief moment
                    setTimeout(() => {
                        window.close();
                    }, 1500);

                } catch (error) {
                    console.error('Add failed:', error);
                    statusDiv.textContent = 'Failed to add article. See console.';
                    statusDiv.className = 'status error';
                } finally {
                    if (ingestBtn) {
                        ingestBtn.disabled = false;
                        ingestBtn.textContent = 'Add to Orbit';
                    }
                }
            });
        }
    }
});
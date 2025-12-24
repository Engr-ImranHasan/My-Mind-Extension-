let currentFilter = 'All';

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['darkMode'], (res) => {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (res.darkMode) {
            document.body.classList.add('dark-mode');
            toggleBtn.innerText = '☀️';
        } else {
            toggleBtn.innerText = '🌙';
        }
    });
    checkPinStatus();
    updateUI();
});

/**
 * বড় এবং আকর্ষণীয় আতশবাজি অ্যানিমেশন
 */
function createFireworks() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4', '#ffffff'];
    const container = document.body;
    const particleCount = 80; 

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = '50%';
        particle.style.top = '50%';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 6 + 2 + 'px'; 
        
        particle.style.setProperty('--color', color);
        particle.style.setProperty('--size', size);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 250; 
        const dx = Math.cos(angle) * velocity + 'px';
        const dy = Math.sin(angle) * velocity + 'px';
        
        particle.style.setProperty('--dx', dx);
        particle.style.setProperty('--dy', dy);
        
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);
    }
}

// Theme & Search
document.getElementById('darkModeToggle').onclick = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    document.getElementById('darkModeToggle').innerText = isDark ? '☀️' : '🌙';
    chrome.storage.sync.set({ darkMode: isDark });
};

document.getElementById('searchBtn').onclick = () => {
    const sBox = document.getElementById('searchBarContainer');
    sBox.classList.toggle('hidden');
    if (!sBox.classList.contains('hidden')) document.getElementById('searchInput').focus();
};

document.getElementById('searchInput').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    chrome.storage.sync.get(['myData'], (res) => {
        const list = res.myData || [];
        const filtered = list.filter(item => 
            (item.title && item.title.toLowerCase().includes(term)) || 
            item.content.toLowerCase().includes(term) || 
            item.category.toLowerCase().includes(term)
        );
        renderList(filtered);
    });
};

// Menu Controls
document.getElementById('menuBtn').onclick = (e) => { 
    e.stopPropagation(); 
    document.getElementById('menuDropdown').classList.toggle('hidden'); 
};
document.onclick = () => document.getElementById('menuDropdown').classList.add('hidden');

document.getElementById('category').onchange = (e) => {
    document.getElementById('customCategory').classList.toggle('hidden', e.target.value !== 'Custom');
};

document.getElementById('setReminderBtn').onclick = () => {
    document.getElementById('reminderTime').classList.toggle('hidden');
};

// Data Save Logic
document.getElementById('addBtn').onclick = () => {
    const title = document.getElementById('itemTitle').value.trim();
    const content = document.getElementById('content').value;
    const catSelect = document.getElementById('category').value;
    const customCat = document.getElementById('customCategory').value.trim();
    const rTime = document.getElementById('reminderTime').value;
    
    const isLink = /^(http|https):\/\/[^ "]+$/.test(content.trim());
    let finalCat = catSelect;
    if (catSelect === 'Note' && isLink) finalCat = 'Link';
    if (catSelect === 'Custom') finalCat = customCat || 'Other';

    const date = new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });

    if (content.trim()) {
        chrome.storage.sync.get(['myData'], (res) => {
            const list = res.myData || [];
            list.unshift({ title, category: finalCat, content, date, id: Date.now(), pinned: false, hasReminder: !!rTime });
            if (rTime) chrome.alarms.create(content.substring(0, 20), { when: new Date(rTime).getTime() });
            chrome.storage.sync.set({ myData: list }, () => {
                createFireworks(); 
                document.getElementById('itemTitle').value = '';
                document.getElementById('content').value = '';
                document.getElementById('customCategory').value = '';
                document.getElementById('reminderTime').value = '';
                document.getElementById('reminderTime').classList.add('hidden');
                updateUI();
            });
        });
    }
};

function updateUI() {
    chrome.storage.sync.get(['myData'], (res) => {
        let list = res.myData || [];
        list.sort((a, b) => b.pinned - a.pinned);
        updateCategoryDropdown(list);
        renderTabs(list);
        renderList(list);
    });
}

function updateCategoryDropdown(list) {
    const select = document.getElementById('category');
    const prev = select.value;
    let cats = ["Note", "Link", "Password"];
    list.forEach(i => { if (!cats.includes(i.category)) cats.push(i.category); });
    select.innerHTML = '';
    cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.innerText = c === "Password" ? "Key" : c;
        select.appendChild(o);
    });
    const custom = document.createElement('option');
    custom.value = "Custom"; custom.innerText = "Custom...";
    select.appendChild(custom);
    if (prev && (cats.includes(prev) || prev === "Custom")) select.value = prev;
}

function renderTabs(list) {
    const container = document.getElementById('filterTabs');
    const categories = ['All', "Note", "Link", "Password", ...new Set(list.map(i => i.category).filter(c => !["Note", "Link", "Password"].includes(c)))];
    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `tab ${currentFilter === cat ? 'active' : ''}`;
        btn.innerText = cat === "Password" ? "Key" : cat;
        btn.onclick = () => { currentFilter = cat; updateUI(); };
        container.appendChild(btn);
    });
}

function renderList(listToRender) {
    const container = document.getElementById('list');
    const delLock = document.getElementById('deleteLock').checked;
    const filtered = currentFilter === 'All' ? listToRender : listToRender.filter(i => i.category === currentFilter);
    document.getElementById('totalCount').innerText = filtered.length;
    container.innerHTML = '';

    filtered.forEach((item) => {
        const div = document.createElement('div');
        div.className = `item ${item.pinned ? 'pinned' : ''}`;
        const reminderBadge = item.hasReminder ? `<span class="reminder-icon">🔔</span>` : '';
        const titleHtml = item.title ? `<span class="item-display-title">${item.title}</span>` : '';

        div.innerHTML = `
            <button class="pin-btn" title="Pin to top">${item.pinned ? '📌' : '📍'}</button>
            <div class="item-info">
                <div><span class="cat-tag">${item.category}</span> ${reminderBadge}</div>
                <span>${item.date}</span>
            </div>
            ${titleHtml}
            <span class="item-text" id="text-${item.id}">${item.content}</span>
            <div class="item-footer-actions">
                <button class="see-more-btn" id="more-${item.id}">See More</button>
                <button class="copy-btn" id="copy-${item.id}">Copy</button>
            </div>
            <button class="delete-btn" style="display:${delLock ? 'inline-block' : 'none'}" id="del-${item.id}">Delete</button>
            <div style="clear:both;"></div>`;

        container.appendChild(div);
        const tSpan = div.querySelector(`#text-${item.id}`);
        const mBtn = div.querySelector(`#more-${item.id}`);
        setTimeout(() => { if (tSpan.scrollHeight > 50) mBtn.style.display = 'block'; }, 10);
        
        mBtn.onclick = () => {
            const isExp = tSpan.classList.toggle('expanded');
            mBtn.innerText = isExp ? 'See Less' : 'See More';
        };

        div.querySelector('.pin-btn').onclick = () => togglePin(item.id);
        div.querySelector(`#copy-${item.id}`).onclick = () => {
            navigator.clipboard.writeText(item.content);
            const b = div.querySelector(`#copy-${item.id}`);
            b.innerText = 'Copied!'; setTimeout(() => b.innerText = 'Copy', 1000);
        };
        
        div.querySelector(`#del-${item.id}`).onclick = () => {
            if(confirm("Delete?")) {
                chrome.storage.sync.get(['myData'], (res) => {
                    const newList = res.myData.filter(i => i.id !== item.id);
                    chrome.storage.sync.set({ myData: newList }, updateUI);
                });
            }
        };
    });
}

function togglePin(id) {
    chrome.storage.sync.get(['myData'], (res) => {
        const list = res.myData.map(i => { if (i.id === id) i.pinned = !i.pinned; return i; });
        chrome.storage.sync.set({ myData: list }, updateUI);
    });
}

function checkPinStatus() {
    chrome.storage.sync.get(['masterPin'], (res) => {
        if (res.masterPin) document.getElementById('pinArea').classList.remove('hidden');
    });
}

document.getElementById('unlockBtn').onclick = () => {
    const pin = document.getElementById('pinInput').value;
    chrome.storage.sync.get(['masterPin'], (res) => {
        if (pin === res.masterPin) document.getElementById('pinArea').classList.add('hidden');
        else alert("Wrong PIN!");
    });
};

document.getElementById('pinToggleMenu').onclick = () => {
    const p = prompt("4-digit PIN (Blank to disable):");
    if(p !== null) chrome.storage.sync.set({ masterPin: p.trim() || null }, () => location.reload());
};

document.getElementById('deleteLock').onchange = () => updateUI();
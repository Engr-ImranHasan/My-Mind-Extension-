chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToMyMind",
    title: "Save to My Mind",
    contexts: ["selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "saveToMyMind") {
    const content = info.selectionText || info.linkUrl;
    const isLink = /^(http|https):\/\/[^ "]+$/.test(content);
    const date = new Date().toLocaleString('en-GB');
    
    chrome.storage.sync.get(['myData'], (res) => {
      const list = res.myData || [];
      list.unshift({
        category: isLink ? "Link" : "Note",
        content: content,
        date: date,
        id: Date.now(),
        pinned: false
      });
      chrome.storage.sync.set({ myData: list });
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'My Mind Reminder',
    message: alarm.name,
    priority: 2
  });
});
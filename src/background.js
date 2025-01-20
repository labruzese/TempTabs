const browser = window.browser || window.chrome;

// Keep track of temporary tabs
let temporaryTabs = new Set();

// Add context menu item
browser.contextMenus.create({
  id: "open-temp-tab",
  title: "Open in Temporary Tab",
  contexts: ["link"]
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-temp-tab") {
    createTemporaryTab(info.linkUrl);
  }
});

// Update tab title to show temporary status
async function updateTabTitle(tabId, isTemp) {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab.url.startsWith('about:') && !tab.url.startsWith('chrome:') && !tab.url.startsWith('mozilla:')) {
      let newTitle = tab.title || '';
      // Remove existing [TEMP] if present
      newTitle = newTitle.replace('[TEMP] ', '');
      // Add [TEMP] if this is a temporary tab
      if (isTemp) {
        newTitle = `[TEMP] ${newTitle}`;
      }
      
      await browser.tabs.executeScript(tabId, {
        code: `document.title = ${JSON.stringify(newTitle)}`
      });
    }
  } catch (error) {
    console.log("Title update error:", error);
  }
}

// Create a temporary tab
async function createTemporaryTab(url = "about:blank") {
  const newTab = await browser.tabs.create({
    url: url,
    active: true
  });
  temporaryTabs.add(newTab.id);
  // Wait a bit for the page to load before updating the title
  setTimeout(() => updateTabTitle(newTab.id, true), 500);
}

// Make current tab temporary
async function makeCurrentTabTemporary() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    temporaryTabs.add(tabs[0].id);
    await updateTabTitle(tabs[0].id, true);
  }
}

// Release current tab from being temporary
async function releaseCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs[0] && temporaryTabs.has(tabs[0].id)) {
    temporaryTabs.delete(tabs[0].id);
    await updateTabTitle(tabs[0].id, false);
  }
}

// Handle keyboard commands
browser.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case "new-temp-tab":
      await createTemporaryTab();
      break;
    case "make-temp-tab":
      await makeCurrentTabTemporary();
      break;
    case "release-temp-tab":
      await releaseCurrentTab();
      break;
  }
});

// Monitor tab changes
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const previousTabs = Array.from(temporaryTabs);
  
  for (const tabId of previousTabs) {
    if (tabId !== activeInfo.tabId) {
      try {
        await browser.tabs.remove(tabId);
        temporaryTabs.delete(tabId);
      } catch (error) {
        console.error(`Error closing tab ${tabId}:`, error);
      }
    }
  }
});

// Update titles when tabs are updated
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (temporaryTabs.has(tabId) && changeInfo.title) {
    updateTabTitle(tabId, true);
  }
});

// Clean up when tabs are closed
browser.tabs.onRemoved.addListener((tabId) => {
  temporaryTabs.delete(tabId);
});

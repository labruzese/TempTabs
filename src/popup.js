const COMMANDS = {
  'new-temp-tab': 'New temp tab',
  'make-temp-tab': 'Make tab temporary',
  'release-temp-tab': 'Make tab permanent'
};

async function loadKeybindings() {
  const commands = await browser.commands.getAll();
  const container = document.getElementById('keybindings');
  
  for (const command of commands) {
    const row = document.createElement('div');
    row.className = 'keybind-row';
    
    const label = document.createElement('label');
    label.textContent = COMMANDS[command.name];
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = command.shortcut || '';
    input.placeholder = 'Press keys';
    input.dataset.command = command.name;
    
    // Prevent default keydown behavior
    input.addEventListener('keydown', (e) => {
      e.preventDefault();
      
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Command');
      
      // Get the main key (excluding modifier keys)
      let key = e.key.toUpperCase();
      if (key === 'CONTROL' || key === 'ALT' || key === 'SHIFT' || key === 'META' || key === 'OS') {
        return; // Don't update for modifier keys alone
      }
      
      // Format the shortcut string
      const shortcut = [...modifiers, key].join('+');
      input.value = shortcut;
      
      // Update the keybinding
      updateKeybinding(command.name, shortcut);
    });
    
    // Prevent key up default behavior
    input.addEventListener('keyup', (e) => {
      e.preventDefault();
    });
    
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  }
}

async function updateKeybinding(commandName, shortcut) {
  try {
    await browser.commands.update({
      name: commandName,
      shortcut: shortcut
    });
    
    const status = document.getElementById('status');
    status.textContent = 'Updated!';
    status.style.color = 'green';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  } catch (error) {
    console.error('Error updating keybinding:', error);
    const status = document.getElementById('status');
    status.style.color = 'red';
    status.textContent = 'Invalid combination';
    setTimeout(() => {
      status.textContent = '';
      status.style.color = 'green';
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', loadKeybindings);

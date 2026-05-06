// Test script to verify fog_reduction meta upgrade functionality
// This will be run in a browser context using agent-browser

console.log('Testing fog_reduction meta upgrade...');

// Test 1: Verify only 2 meta upgrades exist
const metaUpgrades = document.querySelectorAll('.meta-upgrade-card');
console.log(`Found ${metaUpgrades.length} meta upgrades in UI`);
if (metaUpgrades.length === 2) {
  console.log('✓ Correct: Only 2 meta upgrades (fog_reduction and token_multiplier)');
} else {
  console.log('✗ Error: Expected 2 meta upgrades, found', metaUpgrades.length);
}

// Test 2: Check that fog_reduction upgrade exists
const fogUpgrade = document.querySelector('.meta-upgrade-card[data-upgrade="fog_reduction"]');
if (fogUpgrade) {
  console.log('✓ fog_reduction upgrade found in UI');
  const name = fogUpgrade.querySelector('.meta-upgrade-name')?.textContent;
  const desc = fogUpgrade.querySelector('.meta-upgrade-desc')?.textContent;
  console.log(`  Name: ${name}`);
  console.log(`  Description: ${desc}`);
} else {
  console.log('✗ Error: fog_reduction upgrade not found');
}

// Test 3: Check that token_multiplier upgrade exists
const tokenUpgrade = document.querySelector('.meta-upgrade-card[data-upgrade="token_multiplier"]');
if (tokenUpgrade) {
  console.log('✓ token_multiplier upgrade found in UI');
} else {
  console.log('✗ Error: token_multiplier upgrade not found');
}

// Test 4: Verify dead upgrades are NOT present
const deadUpgrades = document.querySelectorAll('.meta-upgrade-card[data-upgrade="pickaxe_tier"], .meta-upgrade-card[data-upgrade="backpack_size"]');
if (deadUpgrades.length === 0) {
  console.log('✓ Correct: Dead upgrades (pickaxe_tier, backpack_size) not found');
} else {
  console.log('✗ Error: Found dead upgrades that should be removed:', deadUpgrades.length);
}

console.log('Fog reduction test complete!');
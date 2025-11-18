import { supabase } from './supabase-client.js';
import { validateUPI, detectFraud } from './fraud-detector.js';

document.addEventListener('DOMContentLoaded', () => {
  loadRecentChecks();

  const form = document.getElementById('upiCheckForm');
  if (form) {
    form.addEventListener('submit', handleUPICheck);
  }
});

async function handleUPICheck(e) {
  e.preventDefault();

  const upiInput = document.getElementById('upiInput');
  const errorMessage = document.getElementById('errorMessage');
  const loadingSpinner = document.getElementById('loadingSpinner');

  const upiId = upiInput.value.trim();

  errorMessage.textContent = '';

  const validation = validateUPI(upiId);
  if (!validation.isValid) {
    errorMessage.textContent = validation.error;
    return;
  }

  loadingSpinner.style.display = 'block';

  try {
    const fraudCheck = detectFraud(upiId);

    const { data, error } = await supabase
      .from('upi_checks')
      .insert([
        {
          upi_id: upiId,
          is_suspicious: fraudCheck.isSuspicious,
          domain: fraudCheck.domain
        }
      ])
      .select()
      .single();

    if (error) throw error;

    window.location.href = `result.html?id=${data.id}`;
  } catch (error) {
    console.error('Error checking UPI:', error);
    errorMessage.textContent = 'An error occurred while checking the UPI ID. Please try again.';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

async function loadRecentChecks() {
  const recentChecksContainer = document.getElementById('recentChecks');

  if (!recentChecksContainer) return;

  try {
    const { data, error } = await supabase
      .from('upi_checks')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(2);

    if (error) throw error;

    if (!data || data.length === 0) {
      recentChecksContainer.innerHTML = '<p class="no-data">No recent checks available</p>';
      return;
    }

    recentChecksContainer.innerHTML = data.map(check => {
      const statusClass = check.is_suspicious ? 'suspicious' : 'safe';
      const statusText = check.is_suspicious ? 'Suspicious' : 'Safe';
      const date = new Date(check.checked_at).toLocaleString();

      return `
        <div class="check-item ${statusClass}" onclick="window.location.href='result.html?id=${check.id}'">
          <div class="check-item-header">
            <span class="check-upi-id">${check.upi_id}</span>
            <span class="check-status ${statusClass}">${statusText}</span>
          </div>
          <div class="check-meta">
            <span>Domain: ${check.domain}</span> •
            <span>Checked: ${date}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading recent checks:', error);
    recentChecksContainer.innerHTML = '<p class="no-data">Error loading recent checks</p>';
  }
}
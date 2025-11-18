import { supabase } from './supabase-client.js';
import { validateUPI } from './fraud-detector.js';

document.addEventListener('DOMContentLoaded', () => {
  loadAlerts();

  const reportForm = document.getElementById('reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', handleReportSubmit);
  }
});

async function handleReportSubmit(e) {
  e.preventDefault();

  const upiIdInput = document.getElementById('reportUpiId');
  const reasonInput = document.getElementById('reportReason');
  const emailInput = document.getElementById('reportEmail');
  const messageDiv = document.getElementById('reportMessage');

  const upiId = upiIdInput.value.trim();
  const reason = reasonInput.value.trim();
  const email = emailInput.value.trim();

  messageDiv.textContent = '';
  messageDiv.className = 'form-message';

  const validation = validateUPI(upiId);
  if (!validation.isValid) {
    messageDiv.textContent = validation.error;
    messageDiv.classList.add('error');
    return;
  }

  try {
    const { error } = await supabase
      .from('upi_reports')
      .insert([
        {
          upi_id: upiId,
          report_reason: reason,
          reporter_email: email || null
        }
      ]);

    if (error) throw error;

    messageDiv.textContent = 'Thank you for reporting! Your report helps keep the community safe.';
    messageDiv.classList.add('success');

    upiIdInput.value = '';
    reasonInput.value = '';
    emailInput.value = '';

    setTimeout(() => {
      loadAlerts();
    }, 1000);

  } catch (error) {
    console.error('Error submitting report:', error);
    messageDiv.textContent = 'An error occurred while submitting your report. Please try again.';
    messageDiv.classList.add('error');
  }
}

async function loadAlerts() {
  const alertsList = document.getElementById('alertsList');

  if (!alertsList) return;

  try {
    const { data, error } = await supabase
      .from('upi_reports')
      .select('*')
      .order('reported_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!data || data.length === 0) {
      alertsList.innerHTML = '<p class="no-data">No community alerts available</p>';
      return;
    }

    alertsList.innerHTML = data.map(alert => {
      const date = new Date(alert.reported_at);

      return `
        <div class="alert-card">
          <div class="alert-header">
            <div class="alert-upi">${alert.upi_id}</div>
            <div class="alert-date">${date.toLocaleDateString()}</div>
          </div>
          <div class="alert-reason">${alert.report_reason}</div>
          ${alert.reporter_email ? `<div class="alert-reporter">Reported by: ${alert.reporter_email}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading alerts:', error);
    alertsList.innerHTML = '<p class="no-data">Error loading community alerts</p>';
  }
}
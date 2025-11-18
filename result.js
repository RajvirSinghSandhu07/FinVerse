import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  loadResultData();
});

async function loadResultData() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkId = urlParams.get('id');

  const resultContent = document.getElementById('resultContent');
  const resultDetails = document.getElementById('resultDetails');

  if (!checkId) {
    resultContent.innerHTML = '<p class="error-message">No check ID provided</p>';
    return;
  }

  try {
    const { data: checkData, error: checkError } = await supabase
      .from('upi_checks')
      .select('*')
      .eq('id', checkId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!checkData) {
      resultContent.innerHTML = '<p class="error-message">Check not found</p>';
      return;
    }

    resultContent.style.display = 'none';
    resultDetails.style.display = 'block';

    const statusIcon = document.getElementById('statusIcon');
    const resultTitle = document.getElementById('resultTitle');
    const upiIdDisplay = document.getElementById('upiIdDisplay');
    const domainDisplay = document.getElementById('domainDisplay');
    const statusDisplay = document.getElementById('statusDisplay');
    const checkedAtDisplay = document.getElementById('checkedAtDisplay');

    if (checkData.is_suspicious) {
      statusIcon.textContent = '⚠️';
      resultTitle.textContent = 'Suspicious UPI ID Detected';
      resultTitle.style.color = 'var(--danger-color)';
      statusDisplay.textContent = 'Suspicious';
      statusDisplay.style.color = 'var(--danger-color)';
      statusDisplay.style.fontWeight = '700';
    } else {
      statusIcon.textContent = '✅';
      resultTitle.textContent = 'UPI ID Appears Safe';
      resultTitle.style.color = 'var(--success-color)';
      statusDisplay.textContent = 'Safe';
      statusDisplay.style.color = 'var(--success-color)';
      statusDisplay.style.fontWeight = '700';
    }

    upiIdDisplay.textContent = checkData.upi_id;
    domainDisplay.textContent = checkData.domain;
    checkedAtDisplay.textContent = new Date(checkData.checked_at).toLocaleString();

    await loadTransactionHistory(checkData.upi_id);
    await loadCommunityReports(checkData.upi_id);

  } catch (error) {
    console.error('Error loading result data:', error);
    resultContent.innerHTML = '<p class="error-message">Error loading check results</p>';
  }
}

async function loadTransactionHistory(upiId) {
  const transactionList = document.getElementById('transactionList');

  try {
    const { data, error } = await supabase
      .from('upi_transactions')
      .select('*')
      .eq('upi_id', upiId)
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      transactionList.innerHTML = '<p class="no-data">No transaction history available</p>';
      return;
    }

    transactionList.innerHTML = data.map(transaction => {
      const date = new Date(transaction.transaction_date);
      const timeAgo = getTimeAgo(date);

      return `
        <div class="transaction-item">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-weight: 600;">Amount: ₹${transaction.amount}</span>
            <span style="color: var(--text-secondary); font-size: 0.875rem;">${timeAgo}</span>
          </div>
          <div style="color: var(--text-secondary); font-size: 0.875rem;">
            Status: ${transaction.status} • ${date.toLocaleString()}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading transactions:', error);
    transactionList.innerHTML = '<p class="no-data">Error loading transaction history</p>';
  }
}

async function loadCommunityReports(upiId) {
  const reportList = document.getElementById('reportList');

  try {
    const { data, error } = await supabase
      .from('upi_reports')
      .select('*')
      .eq('upi_id', upiId)
      .order('reported_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      reportList.innerHTML = '<p class="no-data">No community reports found</p>';
      return;
    }

    reportList.innerHTML = data.map(report => {
      const date = new Date(report.reported_at);

      return `
        <div class="report-item">
          <div style="margin-bottom: 0.5rem;">
            <strong>Reported:</strong> ${date.toLocaleString()}
          </div>
          <div style="margin-bottom: 0.5rem;">
            <strong>Reason:</strong> ${report.report_reason}
          </div>
          ${report.reporter_email ? `<div style="font-size: 0.875rem; color: var(--text-secondary);">Reporter: ${report.reporter_email}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading reports:', error);
    reportList.innerHTML = '<p class="no-data">Error loading community reports</p>';
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
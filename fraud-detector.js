const LEGITIMATE_DOMAINS = [
  'paytm',
  'phonepe',
  'googlepay',
  'amazonpay',
  'bhim',
  'sbi',
  'hdfcbank',
  'icicibank',
  'axisbank',
  'ybl',
  'ibl',
  'oksbi',
  'okhdfcbank',
  'okicici',
  'okaxis',
  'idfcbank',
  'indus',
  'kotak',
  'pnb',
  'bob',
  'boi',
  'cbi',
  'union',
  'canara'
];

const SUSPICIOUS_PATTERNS = [
  'ok-sbi',
  'support-paytm',
  'gpay-care',
  'help-phonepe',
  'assist-googlepay',
  'care-paytm',
  'customer-sbi',
  'service-hdfc',
  'refund-paytm',
  'cashback-gpay',
  'reward-phonepe',
  'verify-upi',
  'confirm-payment',
  'secure-pay'
];

export function validateUPI(upiId) {
  if (!upiId || typeof upiId !== 'string') {
    return {
      isValid: false,
      error: 'Invalid UPI ID format'
    };
  }

  const parts = upiId.split('@');

  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'UPI ID must contain exactly one @ symbol'
    };
  }

  const [username, domain] = parts;

  if (!username || username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters'
    };
  }

  if (!domain || domain.length < 2) {
    return {
      isValid: false,
      error: 'Domain is required'
    };
  }

  return {
    isValid: true,
    username,
    domain
  };
}

export function detectFraud(upiId) {
  const validation = validateUPI(upiId);

  if (!validation.isValid) {
    return {
      isSuspicious: false,
      reasons: [],
      domain: null,
      validationError: validation.error
    };
  }

  const { domain } = validation;
  const reasons = [];
  let isSuspicious = false;

  const lowerDomain = domain.toLowerCase();

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (lowerDomain.includes(pattern)) {
      isSuspicious = true;
      reasons.push(`Contains suspicious pattern: "${pattern}"`);
    }
  }

  const hasHyphen = lowerDomain.includes('-');
  const hasUnderscore = lowerDomain.includes('_');

  if (hasHyphen || hasUnderscore) {
    const isLegitimate = LEGITIMATE_DOMAINS.some(legit =>
      lowerDomain === legit || lowerDomain.startsWith(legit + '.') || lowerDomain.endsWith('.' + legit)
    );

    if (!isLegitimate) {
      isSuspicious = true;
      reasons.push('Domain contains suspicious special characters (hyphens or underscores)');
    }
  }

  const suspiciousKeywords = ['support', 'help', 'care', 'customer', 'service', 'refund', 'cashback', 'reward', 'verify', 'confirm', 'secure'];

  for (const keyword of suspiciousKeywords) {
    if (lowerDomain.includes(keyword)) {
      const isLegitimate = LEGITIMATE_DOMAINS.some(legit => lowerDomain === legit);
      if (!isLegitimate) {
        isSuspicious = true;
        reasons.push(`Domain contains suspicious keyword: "${keyword}"`);
        break;
      }
    }
  }

  const isKnownLegitimate = LEGITIMATE_DOMAINS.some(legit =>
    lowerDomain === legit ||
    lowerDomain.startsWith(legit + '.') ||
    lowerDomain.endsWith('.' + legit)
  );

  if (!isKnownLegitimate && !isSuspicious) {
    reasons.push('Domain is not in our verified legitimate domains list');
  }

  return {
    isSuspicious,
    reasons,
    domain,
    validationError: null
  };
}
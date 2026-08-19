import type { RiskLevel, VaultStatus, TrendDirection } from '@/types';

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#eab308';
    case 'low':
      return '#22c55e';
  }
}

export function riskBgClass(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-risk-critical/15 text-risk-critical border-risk-critical/30';
    case 'high':
      return 'bg-risk-high/15 text-risk-high border-risk-high/30';
    case 'medium':
      return 'bg-risk-medium/15 text-risk-medium border-risk-medium/30';
    case 'low':
      return 'bg-risk-low/15 text-risk-low border-risk-low/30';
  }
}

export function riskLabel(level: RiskLevel): string {
  return level.toUpperCase();
}

export function vaultStatusLabel(status: VaultStatus): string {
  return status.toUpperCase();
}

export function vaultStatusColor(status: VaultStatus): string {
  switch (status) {
    case 'overflow':
      return '#ef4444';
    case 'alert':
      return '#f97316';
    case 'warning':
      return '#eab308';
    case 'normal':
      return '#22c55e';
  }
}

export function trendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '\u2191';
    case 'down':
      return '\u2193';
    case 'stable':
      return '\u2192';
  }
}

export function trendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'Increasing';
    case 'down':
      return 'Decreasing';
    case 'stable':
      return 'Stable';
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

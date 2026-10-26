import { useState, useEffect } from 'react';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, Title, Filler,
} from 'chart.js';

ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, Title, Filler
);

// Canvas не понимает классы Tailwind, поэтому цвета задаём здесь
export const CHART_COLORS = {
    pending: '#f59e0b',
    accepted: '#10b981',
    rejected: '#ef4444',
    brand: '#6366f1',
    brandDark: '#4f46e5',
    brandSoft: 'rgba(99, 102, 241, 0.12)',
    money: '#10b981',
    moneySoft: 'rgba(16, 185, 129, 0.12)',
};

const readChartTheme = () => {
    const s = getComputedStyle(document.documentElement);
    return {
        text: s.getPropertyValue('--muted').trim() || '#64748b',
        grid: s.getPropertyValue('--border').trim() || '#e2e8f0',
        surface: s.getPropertyValue('--surface').trim() || '#ffffff',
    };
};

export function useChartTheme() {
    const [theme, setTheme] = useState(readChartTheme);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setTheme(readChartTheme());
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return theme;
}

export function getChartOptions(theme) {
    return {
        doughnut: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: theme.text, usePointStyle: true, boxWidth: 8, padding: 16 },
                },
            },
        },
        axis: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: theme.text }, grid: { display: false }, border: { color: theme.grid } },
                y: {
                    beginAtZero: true,
                    ticks: { color: theme.text, precision: 0 },
                    grid: { color: theme.grid },
                    border: { display: false },
                },
            },
        },
    };
}
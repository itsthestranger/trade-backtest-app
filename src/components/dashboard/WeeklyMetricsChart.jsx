// src/components/dashboard/WeeklyMetricsChart.jsx
import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyMetricsChart = ({ data }) => {
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography variant="subtitle1" color="text.secondary">
          No metrics data available. Start adding trades to see weekly metrics.
        </Typography>
      </Box>
    );
  }

  // Prepare data for the chart
  const chartData = {
    labels: data.map(item => item.week),
    datasets: [
      {
        label: 'Average Metrics Score',
        data: data.map(item => item.average),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Average Score',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Week',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(2);
            const weekData = data[context.dataIndex];
            return [
              `${label}: ${value}`,
              `Trades: ${weekData.count}`,
            ];
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default WeeklyMetricsChart;
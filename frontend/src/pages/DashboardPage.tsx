import React from 'react';
import Card from '../components/common/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const DashboardPage: React.FC = () => {
  // Line chart data
  const lineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Total Clients',
        data: [65, 59, 80, 81],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'New Clients',
        data: [28, 48, 40, 19],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          },
          boxWidth: 16,
          boxHeight: 16,
        },
      },
      title: {
        display: true,
        text: 'Client Growth Over Time',
        align: 'start' as const,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        align: 'top' as const,
        anchor: 'end' as const,
        offset: -25,
        formatter: (value: number) => value,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(19, 18, 18, 0.1)',
        },
        ticks: {
          stepSize: 15,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Pie chart data
  const pieData = {
    labels: ['English Speaking', 'Russian Speaking', 'Other'],
    datasets: [
      {
        data: [45, 15, 10],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          },
          boxWidth: 16,
          boxHeight: 16,
        },
      },
      title: {
        display: true,
        text: 'Client Language Distribution',
        align: 'start' as const,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold' as const,
          size: 12,
        },
        align: 'end' as const,
        anchor: 'end' as const,
        formatter: (value: number, context: any) => {
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(0);
          return `${value} (${percentage}%)`;
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6">
      <div className="flex-grow w-full max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart Card */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="h-[300px]">
                <Line options={lineOptions} data={lineData} plugins={[ChartDataLabels]} />
              </div>
            </div>
          </Card>

          {/* Pie Chart Card */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="h-[300px]">
                <Pie options={pieOptions} data={pieData} plugins={[ChartDataLabels]} />
              </div>
            </div>
          </Card>

          {/* Placeholder for future chart */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>Chart coming soon</p>
              </div>
            </div>
          </Card>

          {/* Placeholder for future chart */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>Chart coming soon</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
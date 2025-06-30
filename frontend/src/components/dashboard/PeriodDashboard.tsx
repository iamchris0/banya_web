import { useEffect, useState } from 'react';
import Card from '../common/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { WeeklyDashboardData } from '../../types';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PeriodDashboardProps {
  data: WeeklyDashboardData;
}

const PeriodDashboard: React.FC<PeriodDashboardProps> = ({ data }) => {
  const [error, setError] = useState<string | null>(null);

  const getVisitorsData = () => {
    const dates = Object.keys(data).sort();
    return {
      labels: dates.map(date => format(parseISO(date), 'MMM d')),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Total Visitors',
          data: dates.map(date => data[date]?.totalVisitors ?? 0),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'bar' as const,
          label: 'New Clients',
          data: dates.map(date => data[date]?.totalNewClients ?? 0),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Prebooked',
          data: dates.map(date => data[date]?.prebooked ?? 0),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y',
        },
      ],
    };
  };

  const getTimingData = () => {
    const dates = Object.keys(data).sort();
    return {
      labels: dates.map(date => format(parseISO(date), 'MMM d')),
      datasets: [
        {
          type: 'line' as const,
          label: 'Peak Time',
          data: dates.map(date => data[date]?.totalPeakTime ?? 0),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Off Peak',
          data: dates.map(date => data[date]?.totalOffPeak ?? 0),
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
        },
      ],
    };
  };

  const getGenderData = () => {
    const dates = Object.keys(data).sort();
    return {
      labels: dates.map(date => format(parseISO(date), 'MMM d')),
      datasets: [
        {
          type: 'line' as const,
          label: 'Male',
          data: dates.map(date => data[date]?.totalMale ?? 0),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Female',
          data: dates.map(date => data[date]?.totalFemale ?? 0),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
        },
      ],
    };
  };

  const getLanguageData = () => {
    const dates = Object.keys(data).sort();
    return {
      labels: dates.map(date => format(parseISO(date), 'MMM d')),
      datasets: [
        {
          type: 'line' as const,
          label: 'English Speaking',
          data: dates.map(date => data[date]?.totalEnglishSpeaking ?? 0),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Russian Speaking',
          data: dates.map(date => data[date]?.totalRussianSpeaking ?? 0),
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
        },
      ],
    };
  };

  const getMembershipsData = () => {
    const dates = Object.keys(data).sort();
    return {
      labels: dates.map(date => format(parseISO(date), 'MMM d')),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Amount',
          data: dates.map(date => data[date]?.totalOnlineMemberships.amount ?? 0),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'bar' as const,
          label: 'Value',
          data: dates.map(date => data[date]?.totalOnlineMemberships.value ?? 0),
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
      ],
    };
  };

  const getTransactionsData = () => {
    const dates = Object.keys(data).sort();
    return {
      labels: dates.map(date => format(parseISO(date), 'MMM d')),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Amount',
          data: dates.map(date => data[date]?.totalYottaLinks.amount ?? 0),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'bar' as const,
          label: 'Value',
          data: dates.map(date => data[date]?.totalYottaLinks.value ?? 0),
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        boxPadding: 6
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        align: 'center' as const,
        anchor: 'center' as const,
        offset: 0,
        formatter: (value: number) => value,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Visitors'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  try {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">General Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[400px]">
                  <Chart 
                    type="bar"
                    data={getVisitorsData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Visitor Overview',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[400px]">
                  <Chart 
                    type="line"
                    data={getTimingData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Timing Distribution',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Demographics & Timing</h2>
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[300px]">
                  <Chart 
                    type="line"
                    data={getGenderData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Gender Distribution',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[300px]">
                  <Chart 
                    type="line"
                    data={getLanguageData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Language Distribution',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sales & Transactions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[300px]">
                  <Chart 
                    type="bar"
                    data={getMembershipsData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Memberships & Vouchers',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[300px]">
                  <Chart
                    type="bar"
                    data={getTransactionsData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Transactions + F&B',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    setError('Failed to render period dashboard charts');
    return null;
  }
};

export default PeriodDashboard; 
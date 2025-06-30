import { useEffect, useState } from 'react';
import Card from '../common/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { DailyData } from '../../types';
import { toast } from 'react-toastify';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DailyDashboardProps {
  data: DailyData;
}

interface Treatment {
  amount: number;
  value: number;
  done: boolean;
}

interface Treatments {
  entryOnly?: Treatment;
  parenie?: Treatment;
  aromaPark?: Treatment;
  iceWrap?: Treatment;
  scrub?: Treatment;
  mudMask?: Treatment;
  mudWrap?: Treatment;
  aloeVera?: Treatment;
  massage_25?: Treatment;
  massage_50?: Treatment;
}

const DailyDashboard: React.FC<DailyDashboardProps> = ({ data }) => {
  const [error, setError] = useState<string | null>(null);

  // Key metrics calculations
  const totalRevenue = 
    data.totalOnlineMemberships.value +
    data.totalOfflineMemberships.value +
    data.totalOnlineVouchers.value +
    data.totalPaperVouchers.value +
    data.totalFoodAndDrinkSales +
    ((data.totalTreatments as Treatments)?.entryOnly?.value || 0) +
    ((data.totalTreatments as Treatments)?.parenie?.value || 0) +
    ((data.totalTreatments as Treatments)?.aromaPark?.value || 0) +
    ((data.totalTreatments as Treatments)?.iceWrap?.value || 0) +
    ((data.totalTreatments as Treatments)?.scrub?.value || 0) +
    ((data.totalTreatments as Treatments)?.mudMask?.value || 0) +
    ((data.totalTreatments as Treatments)?.mudWrap?.value || 0) +
    ((data.totalTreatments as Treatments)?.aloeVera?.value || 0) +
    ((data.totalTreatments as Treatments)?.massage_25?.value || 0) +
    ((data.totalTreatments as Treatments)?.massage_50?.value || 0);

  const totalTreatments = Object.values(data.totalTreatments as Treatments || {}).reduce(
    (sum, treatment) => sum + (treatment.amount || 0),
    0
  );

  const getVisitorsData = () => ({
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [data.totalMale, data.totalFemale],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      }
    ],
  });

  const getTimingData = () => ({
    labels: ['Peak Time', 'Off Peak'],
    datasets: [
      {
        data: [data.totalPeakTime, data.totalOffPeak],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',   // light red
          'rgba(77, 192, 75, 0.8)',   // light green
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',     // light red
          'rgba(77, 192, 75, 1)',     // light green
        ],
        borderWidth: 1,
      }
    ],
  });

  const getLanguageData = () => ({
    labels: ['English Speaking', 'Russian Speaking'],
    datasets: [
      {
        data: [data.totalEnglishSpeaking, data.totalRussianSpeaking],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      }
    ],
  });

  const getSalesData = () => ({
    labels: ['Online Memberships', 'Offline Memberships', 'Online Vouchers', 'Paper Vouchers'],
    datasets: [
      {
        label: 'Amount',
        data: [
          data.totalOnlineMemberships.amount,
          data.totalOfflineMemberships.amount,
          data.totalOnlineVouchers.amount,
          data.totalPaperVouchers.amount
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Value',
        data: [
          data.totalOnlineMemberships.value,
          data.totalOfflineMemberships.value,
          data.totalOnlineVouchers.value,
          data.totalPaperVouchers.value
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      }
    ],
  });

  const getTransactionsData = () => ({
    labels: ['Yotta Links', 'Yotta Widget'],
    datasets: [
      {
        label: 'Amount',
        data: [
          data.totalYottaLinks.amount,
          data.totalYottaWidget.amount
        ],
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
      {
        label: 'Value',
        data: [
          data.totalYottaLinks.value,
          data.totalYottaWidget.value
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  });

  const getTreatmentsData = () => {
    const treatments = data.totalTreatments as Treatments;
    return {
      labels: [
        'Entry Only',
        'Parenie',
        'Aroma Park',
        'Ice Wrap',
        'Scrub',
        'Mud Mask',
        'Mud Wrap',
        'Aloe Vera',
        'Massage 25',
        'Massage 50'
      ],
      datasets: [
        {
          label: 'Amount',
          data: [
            treatments.entryOnly?.amount || 0,
            treatments.parenie?.amount || 0,
            treatments.aromaPark?.amount || 0,
            treatments.iceWrap?.amount || 0,
            treatments.scrub?.amount || 0,
            treatments.mudMask?.amount || 0,
            treatments.mudWrap?.amount || 0,
            treatments.aloeVera?.amount || 0,
            treatments.massage_25?.amount || 0,
            treatments.massage_50?.amount || 0
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ],
    };
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        align: 'start',
        font: {
          size: 16,
          weight: 'bold',
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
            return `${label}: ${percentage}%`;
          }
        }
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold',
          size: 14,
        },
        formatter: (value: number, context: any) => {
          // Show value on the pie chart
          return value;
        },
        display: true,
        anchor: 'center',
        align: 'center',
      },
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        align: 'start',
        font: {
          size: 16,
          weight: 'bold',
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
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold',
          size: 13,
        },
        anchor: 'end',
        align: 'top',
        offset: 4,
        formatter: (value: number) => value,
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          }
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
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{data.totalVisitors}</p>
                  <p className="ml-2 text-sm text-gray-500">({data.totalNewClients} new)</p>
                </div>
                <div className="flex flex-col items-end justify-end">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">Prebooked:</span>
                    <span className="text-sm font-semibold text-gray-700">{data.prebooked ?? 0}</span>
                    {data.totalVisitors > (data.prebooked ?? 0) && (
                      (<FaArrowUp className="text-green-600 mr-1" />)
                    )}
                    {data.totalVisitors < (data.prebooked ?? 0) && ( 
                      (<FaArrowDown className="text-red-600 mr-1" />)
                    )}
                    {data.totalVisitors === (data.prebooked ?? 0) && (
                        (<FaEquals className="text-gray-400 mr-1" />)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900">£{totalRevenue.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">F&B Sales</h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900">£{data.totalFoodAndDrinkSales.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Treatments</h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900">£{totalTreatments.toLocaleString()}</p>
            </div>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">Customer Distribution</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[300px]">
                  <Chart 
                    type="pie"
                    data={getVisitorsData()}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins!,
                        title: {
                          ...pieChartOptions.plugins!.title,
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
                    type="pie"
                    data={getTimingData()}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins!,
                        title: {
                          ...pieChartOptions.plugins!.title,
                          text: 'Timing Distribution',
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
                    type="pie"
                    data={getLanguageData()}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins!,
                        title: {
                          ...pieChartOptions.plugins!.title,
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

        {/* Sales & Transactions */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">Sales & Transactions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="h-[400px]">
                  <Chart 
                    type="bar"
                    data={getSalesData()}
                    options={{
                      ...barChartOptions,
                      plugins: {
                        ...barChartOptions.plugins!,
                        title: {
                          ...barChartOptions.plugins!.title,
                          text: 'Sales Distribution',
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
                    type="bar"
                    data={getTransactionsData()}
                    options={{
                      ...barChartOptions,
                      plugins: {
                        ...barChartOptions.plugins!,
                        title: {
                          ...barChartOptions.plugins!.title,
                          text: 'Transactions Distribution',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* F&B Sales & Treatments */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">F&B Sales & Treatments</h2>
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="h-[400px]">
                <Chart 
                  type="bar"
                  data={getTreatmentsData()}
                  options={{
                    ...barChartOptions,
                    plugins: {
                      ...barChartOptions.plugins!,
                      title: {
                        ...barChartOptions.plugins!.title,
                        text: 'Treatments Distribution',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    setError('Failed to render daily dashboard charts');
    return null;
  }
};

export default DailyDashboard; 
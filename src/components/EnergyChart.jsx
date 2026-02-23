import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EnergyChart = ({ data, period }) => {
  const chartData = {
    labels: data.data.map(d => {
      if (period === 'daily') return `${d._id}:00`;
      if (period === 'weekly') return `Day ${d._id}`;
      return `Day ${d._id}`;
    }),
    datasets: [
      {
        label: 'Consumption (kWh)',
        data: data.data.map(d => d.consumption),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cost ($)',
        data: data.data.map(d => d.cost),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        }
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'kWh',
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '$',
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        }
      }
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default EnergyChart;
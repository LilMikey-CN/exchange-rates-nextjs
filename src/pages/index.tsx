// pages/exchange-rates.tsx
import { GetServerSideProps } from 'next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Define types for our data
interface ExchangeRateData {
  buying_rate: number;
  selling_rate: number;
  timestamp: string;
  formattedTime: string;
}

interface PageProps {
  exchangeData: ExchangeRateData[];
  error: string | null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch data on the server side
    const response = await fetch('http://180-one-glass.tech:8081/api/v1/aud-cny/boc/rates/last10');

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Format the data on the server
    const formattedData: ExchangeRateData[] = data
      .map((item: any) => {
        const date = new Date(item.timestamp);
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return {
          ...item,
          formattedTime: `${month}-${day} ${hours}:${minutes}`,
          buying_rate: parseFloat(item.buying_rate),
          selling_rate: parseFloat(item.selling_rate)
        };
      })
      .reverse(); // Reverse to show chronological order

    // Return the data as props
    return {
      props: {
        exchangeData: formattedData,
        error: null
      }
    };
  } catch (err) {
    console.error('Error fetching exchange rate data:', err);
    // Return the error as props
    return {
      props: {
        exchangeData: [],
        error: 'Failed to fetch exchange rate data. Please try again later.'
      }
    };
  }
};

const CurrencyExchangeGraph = ({ exchangeData, error }: PageProps) => {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic domain based on data
  const minRate = Math.floor(Math.min(
    ...exchangeData.map(item => item.buying_rate),
    ...exchangeData.map(item => item.selling_rate)
  ) * 0.998);

  const maxRate = Math.ceil(Math.max(
    ...exchangeData.map(item => item.buying_rate),
    ...exchangeData.map(item => item.selling_rate)
  ) * 1.002);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">CNY to AUD Exchange Rate</h1>
          <p className="text-gray-600 mb-6">Latest 10 records showing buying and selling rates</p>

          <div className="h-64 md:h-80 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={exchangeData}
                margin={{ top: 10, right: 10, left: 5, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="formattedTime"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickSize={8}
                  tickMargin={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: '#6b7280' }}
                  tickSize={5}
                  tickMargin={8}
                  domain={[minRate, maxRate]}
                  label={{
                    value: 'Rate (CNY)', angle: -90, position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 14, fontWeight: 'bold' }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} CNY`, '']}
                  labelFormatter={(label) => `Date/Time: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="buying_rate"
                  stroke="#494e84"
                  strokeWidth={3}
                  dot={{ fill: '#494e84', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#da9100' }}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  name="Buying Rate"
                />
                <Line
                  type="monotone"
                  dataKey="selling_rate"
                  stroke="#dd164c"
                  strokeWidth={3}
                  dot={{ fill: '#dd164c', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#da9100' }}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  name="Selling Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
            <p>• Bank's buying rate: how much CNY you get when selling 100 AUD</p>
            <p>• Bank's selling rate: how much CNY you need to buy 100 AUD</p>
            <p>• Hover over points to see exact values</p>
            <p>• Data source: BOC - Bank of China</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyExchangeGraph;


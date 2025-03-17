// pages/exchange-rates.tsx
import { GetServerSideProps } from 'next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';

// Define types for our data
interface ExchangeRateData {
  buying_rate: number;
  selling_rate: number;
  timestamp: string;
  formattedTime: {
    en: string;
    zh: string;
  };
}

interface PageProps {
  exchangeData: ExchangeRateData[];
  error: string | null;
}

// Translation dictionary
const translations = {
  en: {
    pageTitle: 'CNY to AUD Exchange Rate',
    subtitle: 'Latest 10 records showing buying and selling rates',
    buyingRateLabel: 'Buying Rate',
    sellingRateLabel: 'Selling Rate',
    rateLabel: 'Rate (CNY)',
    dateTimeLabel: 'Date/Time',
    buyingRateDescription: "• Bank's buying rate: how much CNY you get when selling 100 AUD",
    sellingRateDescription: "• Bank's selling rate: how much CNY you need to buy 100 AUD",
    hoverDescription: "• Hover over points to see exact values",
    dataSource: "• Data source: BOC - Bank of China",
    currentLanguage: "Current Language: English",
    switchLanguage: "中文"
  },
  zh: {
    pageTitle: '人民币 兑 澳大利亚元 汇率',
    subtitle: '最新 10 条记录显示买入和卖出汇率',
    buyingRateLabel: '买入汇率',
    sellingRateLabel: '卖出汇率',
    rateLabel: '汇率 (人民币)',
    dateTimeLabel: '日期/时间',
    buyingRateDescription: "• 银行买入汇率：出售 100 澳元可获得多少人民币",
    sellingRateDescription: "• 银行卖出汇率：购买 100 澳元需要多少人民币",
    hoverDescription: "• 将鼠标悬停在点上可查看确切值",
    dataSource: "• 数据源：中国银行",
    currentLanguage: "当前语言：中文",
    switchLanguage: "English"
  }
};

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

        // English formatting
        const monthEn = date.toLocaleString('en-US', { month: 'short' });
        const dayEn = date.getDate().toString().padStart(2, '0');
        const hoursEn = date.getHours().toString().padStart(2, '0');
        const minutesEn = date.getMinutes().toString().padStart(2, '0');
        const formattedTimeEn = `${monthEn}-${dayEn} ${hoursEn}:${minutesEn}`;

        // Chinese formatting
        const monthZh = (date.getMonth() + 1).toString();
        const dayZh = date.getDate().toString();
        const hoursZh = date.getHours().toString().padStart(2, '0');
        const minutesZh = date.getMinutes().toString().padStart(2, '0');
        const formattedTimeZh = `${monthZh}月${dayZh}日 ${hoursZh}:${minutesZh}`;

        return {
          ...item,
          formattedTime: {
            en: formattedTimeEn,
            zh: formattedTimeZh
          },
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
  // State for language toggle (default: English)
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const t = translations[language];

  // Toggle language function
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

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

  // Prepare data for the current language
  const localizedData = exchangeData.map(item => ({
    ...item,
    formattedTime: item.formattedTime[language]
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl relative">
        {/* Language toggle in top right */}
        <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 z-10">
          <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {t.currentLanguage}
          </p>
          <button
            onClick={toggleLanguage}
            className="bg-indigo-600 text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            {t.switchLanguage}
          </button>
        </div>

        <div className="p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{t.pageTitle}</h1>
          <p className="text-gray-600 mb-6">{t.subtitle}</p>

          <div className="h-64 md:h-80 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={localizedData}
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
                    value: t.rateLabel, angle: -90, position: 'insideLeft',
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
                  labelFormatter={(label) => `${t.dateTimeLabel}: ${label}`}
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
                  name={t.buyingRateLabel}
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
                  name={t.sellingRateLabel}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
            <p>{t.buyingRateDescription}</p>
            <p>{t.sellingRateDescription}</p>
            <p>{t.hoverDescription}</p>
            <p>{t.dataSource}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyExchangeGraph;

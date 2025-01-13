import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Button } from "/components/ui/button"
import { Input } from "/components/ui/input"
import { Label } from "/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from "/components/ui/toast"
import { useToast } from "/components/ui/use-toast"

// Mock API function to simulate fetching stock data
const fetchStockData = async (symbol: string) => {
  // Replace with actual API call
  const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/2023-01-01/2023-12-31?adjusted=true&apiKey=YOUR_API_KEY`)
  const data = await response.json()
  const stockData = data.results.map((result: any) => ({
    date: new Date(result.t).toLocaleDateString(),
    price: result.c,
  }))
  return stockData
}

// Mock API function to simulate fetching current stock price
const fetchCurrentStockPrice = async (symbol: string) => {
  // Replace with actual API call
  const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=YOUR_API_KEY`)
  const data = await response.json()
  return data.results[0].c
}

export default function InvestingApp() {
  const [stockSymbol, setStockSymbol] = useState('')
  const [stockPrice, setStockPrice] = useState<number | null>(null)
  const [priceThreshold, setPriceThreshold] = useState<number | null>(null)
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [stockData, setStockData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (stockSymbol) {
      fetchCurrentStockPrice(stockSymbol).then(price => {
        setStockPrice(price)
      })

      fetchStockData(stockSymbol).then(data => {
        setStockData(data)
      })

      const interval = setInterval(() => {
        fetchCurrentStockPrice(stockSymbol).then(price => {
          setStockPrice(price)
        })
      }, 5000) // Fetch stock price every 5 seconds

      return () => clearInterval(interval)
    }
  }, [stockSymbol])

  const notify = () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      new Notification(`Stock Alert: ${stockSymbol}`, {
        body: `The stock price is ${condition === 'above' ? 'above' : 'below'} your threshold of $${priceThreshold}. Current price: $${stockPrice}`,
      })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(`Stock Alert: ${stockSymbol}`, {
            body: `The stock price is ${condition === 'above' ? 'above' : 'below'} your threshold of $${priceThreshold}. Current price: $${stockPrice}`,
          })
        }
      })
    }
  }

  const handleStockSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStockSymbol(e.target.value.toUpperCase())
  }

  const handlePriceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setPriceThreshold(value)
    }
  }

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCondition(e.target.value as 'above' | 'below')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Card className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Investing App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock-symbol" className="block text-sm font-medium text-gray-700">S&P 500 Stock Symbol</Label>
                <Input id="stock-symbol" value={stockSymbol} onChange={handleStockSymbolChange} placeholder="Enter S&P 500 stock symbol" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <Label htmlFor="price-threshold" className="block text-sm font-medium text-gray-700">Price Threshold</Label>
                <Input id="price-threshold" type="number" value={priceThreshold !== null ? priceThreshold.toString() : ''} onChange={handlePriceThresholdChange} placeholder="Enter price threshold" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <Label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</Label>
                <select id="condition" value={condition} onChange={handleConditionChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>
              <div className="col-span-full">
                <Button onClick={() => {
                  if (stockSymbol && priceThreshold !== null) {
                    fetchCurrentStockPrice(stockSymbol).then(price => {
                      setStockPrice(price)
                      if ((condition === 'above' && price > priceThreshold) || (condition === 'below' && price < priceThreshold)) {
                        notify()
                      }
                    })
                  }
                }} disabled={!stockSymbol || priceThreshold === null} className="w-full">
                  Fetch Stock Price
                </Button>
              </div>
            </div>
            {stockPrice !== null && (
              <div className="mt-4">
                <p className="text-lg font-bold">Current Price: ${stockPrice.toFixed(2)}</p>
              </div>
            )}
            {stockData.length > 0 && (
              <div className="mt-8">
                <LineChart
                  width={800}
                  height={400}
                  data={stockData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </div>
            )}
          </CardContent>
        </Card>
        <ToastViewport />
      </div>
    </ToastProvider>
  )
}
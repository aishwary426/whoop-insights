import { render, screen } from '@testing-library/react'
import CorrelationScatterPlot from '@/components/advanced-analytics/CorrelationScatterPlot'
import '@testing-library/jest-dom'

// Mock Recharts since it doesn't play well with JSDOM
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts')
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
        ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
        Scatter: () => <div data-testid="scatter" />,
        XAxis: () => <div data-testid="x-axis" />,
        YAxis: () => <div data-testid="y-axis" />,
        ZAxis: () => <div data-testid="z-axis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
        Cell: () => <div data-testid="cell" />,
    }
})

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light' }),
}))

describe('CorrelationScatterPlot', () => {
    const mockData = [
        { date: '2024-01-01', strain: 10, recovery: 50, sleep: 7 },
        { date: '2024-01-02', strain: 12, recovery: 60, sleep: 6 },
    ]
    const mockMetrics = ['strain', 'recovery', 'sleep']

    it('renders correctly', () => {
        render(<CorrelationScatterPlot data={mockData} metrics={mockMetrics} />)
        expect(screen.getByText('Correlation Analysis')).toBeInTheDocument()
        expect(screen.getByText('X-Axis:')).toBeInTheDocument()
        expect(screen.getByText('Y-Axis:')).toBeInTheDocument()
    })

    it('displays correlation value', () => {
        render(<CorrelationScatterPlot data={mockData} metrics={mockMetrics} />)
        // Correlation between strain (10, 12) and recovery (50, 60) is 1.0
        expect(screen.getByText('1.00')).toBeInTheDocument()
    })
})

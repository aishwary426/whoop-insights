import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ChartElement {
  selector: string
  title: string
}

/**
 * Export all graphs/charts from the dashboard to a PDF
 */
export async function exportChartsToPDF() {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - 2 * margin
  let currentY = margin

  // List of chart container IDs/selectors to capture
  const chartSelectors: ChartElement[] = [
    { selector: '[data-chart="recovery-baseline"]', title: 'Recovery vs Baseline' },
    { selector: '[data-chart="performance-section"]', title: 'Performance Metrics' },
    { selector: '[data-chart="hrv-chart"]', title: 'Blood Oxygen (SpO2)' },
    { selector: '[data-chart="skin-temp-chart"]', title: 'Skin Temperature' },
    { selector: '[data-chart="rhr-chart"]', title: 'Resting Heart Rate' },
    { selector: '[data-chart="resp-rate-chart"]', title: 'Respiratory Rate' },
  ]

  // Store original scroll position
  const originalScrollY = window.scrollY

  try {
    // Scroll to top to ensure all charts are visible
    window.scrollTo(0, 0)
    await new Promise(resolve => setTimeout(resolve, 500)) // Wait for scroll

    // Add title page
    pdf.setFontSize(20)
    pdf.text('WHOOP Insights Dashboard Report', pageWidth / 2, currentY, { align: 'center' })
    currentY += 10
    
    pdf.setFontSize(12)
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' })
    currentY += 20

    // Capture each chart
    for (const chart of chartSelectors) {
      const element = document.querySelector(chart.selector) as HTMLElement
      
      if (!element) {
        console.warn(`Chart not found: ${chart.selector}`)
        continue
      }

      try {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'instant', block: 'center' })
        await new Promise(resolve => setTimeout(resolve, 300))

        // Add new page if needed
        if (currentY > pageHeight - 100) {
          pdf.addPage()
          currentY = margin
        }

        // Add chart title
        pdf.setFontSize(14)
        pdf.text(chart.title, margin, currentY)
        currentY += 8

        // Capture the chart as canvas
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Check if we need a new page for this image
        if (currentY + imgHeight > pageHeight - margin) {
          pdf.addPage()
          currentY = margin
          // Re-add title on new page
          pdf.setFontSize(14)
          pdf.text(chart.title, margin, currentY)
          currentY += 8
        }

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
        currentY += imgHeight + 10

      } catch (error) {
        console.error(`Error capturing chart ${chart.title}:`, error)
      }
    }
  } finally {
    // Restore original scroll position
    window.scrollTo(0, originalScrollY)
  }

  // Save the PDF
  pdf.save(`whoop-insights-dashboard-${new Date().toISOString().split('T')[0]}.pdf`)
}


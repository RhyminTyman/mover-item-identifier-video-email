"use client";

import { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Calculate,
    Download,
    Email,
    Add,
    Clear,
    TableChart
} from '@mui/icons-material';
import AddressAutocomplete from './AddressAutocomplete';

interface PricingCalculatorProps {
  items: Array<{
    shortName: string;
    description: string;
    estimatedDimensionsInches: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
    tags: string[];
    roomName?: string | null;
    count: number;
  }>;
  onSave?: (pricingData: PricingData) => void;
  onCancel?: () => void;
}

interface PricingData {
  customerName: string;
  phone: string;
  email: string;
  moveDate: string;
  originAddress: string;
  destinationAddress: string;
  distance: number;
  accessType: string;
  rushService: boolean;
  sameBuilding: boolean;
  stairFlights: number;
  packingBoxes: number;
  unpackingBoxes: number;
  disposalNeeded: boolean;
  storageNeeded: boolean;
  selectedItems: string[];
  totalCubicFeet: number;
  totalWeight: number;
  estimatedHours: number;
  baseCost: number;
  additionalHandling: number;
  disposalCost: number;
  storageCost: number;
  stairsCost: number;
  packingCost: number;
  unpackingCost: number;
  distanceCost: number;
  subtotal: number;
  taxAmount: number;
  totalCost: number;
}

interface CompanyPricing {
  baseCostPerHour: number;
  costPerMile: number;
  costPerCubicFoot: number;
  costPerPound: number;
  stairCostPerFlight: number;
  packingCostPerBox: number;
  unpackingCostPerBox: number;
  disposalCost: number;
  storageCostPerDay: number;
  rushServiceMultiplier: number;
  taxRate: number;
}

const defaultPricing: CompanyPricing = {
  baseCostPerHour: 50.0,
  costPerMile: 2.0,
  costPerCubicFoot: 0.5,
  costPerPound: 0.1,
  stairCostPerFlight: 10.0,
  packingCostPerBox: 5.0,
  unpackingCostPerBox: 3.0,
  disposalCost: 25.0,
  storageCostPerDay: 10.0,
  rushServiceMultiplier: 1.5,
  taxRate: 8.0
};

export default function PricingCalculator({ items, onSave, onCancel }: PricingCalculatorProps) {
  const [pricing] = useState<CompanyPricing>(defaultPricing);
  const [formData, setFormData] = useState<PricingData>({
    customerName: '',
    phone: '',
    email: '',
    moveDate: '',
    originAddress: '',
    destinationAddress: '',
    distance: 0,
    accessType: 'Ground Floor',
    rushService: false,
    sameBuilding: false,
    stairFlights: 0,
    packingBoxes: 0,
    unpackingBoxes: 0,
    disposalNeeded: false,
    storageNeeded: false,
    selectedItems: [],
    totalCubicFeet: 0,
    totalWeight: 0,
    estimatedHours: 1,
    baseCost: 0,
    additionalHandling: 0,
    disposalCost: 0,
    storageCost: 0,
    stairsCost: 0,
    packingCost: 0,
    unpackingCost: 0,
    distanceCost: 0,
    subtotal: 0,
    taxAmount: 0,
    totalCost: 0
  });

  const [loading, setLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [useStartAddress, setUseStartAddress] = useState(true);
  const [useDestinationAddress, setUseDestinationAddress] = useState(false);

  const calculatePricing = useCallback(() => {
    const selectedItemsData = items.filter((_, index) => 
      formData.selectedItems.includes(index.toString())
    );

    // Calculate total cubic feet and weight
    const totalCubicFeet = selectedItemsData.reduce((total, item) => {
      const { length, width, height } = item.estimatedDimensionsInches;
      if (length && width && height) {
        const cubicFeet = (length * width * height) / 1728; // Convert cubic inches to cubic feet
        return total + (cubicFeet * item.count); // Multiply by count for multiple items
      }
      return total;
    }, 0);

    const totalWeight = selectedItemsData.reduce((total, item) => {
      const { length, width, height } = item.estimatedDimensionsInches;
      if (length && width && height) {
        const cubicFeet = (length * width * height) / 1728; // Convert cubic inches to cubic feet
        return total + (cubicFeet * 10 * item.count); // 10 lbs per cubic foot estimate, multiplied by count
      }
      return total;
    }, 0);

    // Calculate estimated hours (base 1 hour + additional based on items)
    const estimatedHours = Math.max(1, 1 + (selectedItemsData.length * 0.1));

    // Calculate costs
    const baseCost = estimatedHours * pricing.baseCostPerHour;
    const additionalHandling = totalCubicFeet * pricing.costPerCubicFoot + totalWeight * pricing.costPerPound;
    const disposalCost = formData.disposalNeeded ? pricing.disposalCost : 0;
    const storageCost = formData.storageNeeded ? pricing.storageCostPerDay : 0;
    const stairsCost = formData.stairFlights * pricing.stairCostPerFlight;
    const packingCost = formData.packingBoxes * pricing.packingCostPerBox;
    const unpackingCost = formData.unpackingBoxes * pricing.unpackingCostPerBox;
    const distanceCost = formData.distance * pricing.costPerMile;

    const subtotal = baseCost + additionalHandling + disposalCost + storageCost + stairsCost + packingCost + unpackingCost + distanceCost;
    
    // Apply rush service multiplier
    const finalSubtotal = formData.rushService ? subtotal * pricing.rushServiceMultiplier : subtotal;
    
    const taxAmount = finalSubtotal * (pricing.taxRate / 100);
    const totalCost = finalSubtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      totalCubicFeet,
      totalWeight,
      estimatedHours,
      baseCost,
      additionalHandling,
      disposalCost,
      storageCost,
      stairsCost,
      packingCost,
      unpackingCost,
      distanceCost,
      subtotal: finalSubtotal,
      taxAmount,
      totalCost
    }));
  }, [formData.selectedItems, formData.distance, formData.stairFlights, formData.packingBoxes, formData.unpackingBoxes, formData.disposalNeeded, formData.storageNeeded, formData.rushService, pricing, items]);

  // Calculate pricing when form data changes
  useEffect(() => {
    calculatePricing();
  }, [calculatePricing]);

  const handleInputChange = (field: keyof PricingData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemSelection = (itemIndex: string) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemIndex)
        ? prev.selectedItems.filter(i => i !== itemIndex)
        : [...prev.selectedItems, itemIndex]
    }));
  };

  const selectAllItems = () => {
    setFormData(prev => ({
      ...prev,
      selectedItems: items.map((_, index) => index.toString())
    }));
  };

  const clearSelection = () => {
    setFormData(prev => ({
      ...prev,
      selectedItems: []
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      console.log('Starting PDF generation...');
      
      // Try static import first, fallback to dynamic import
      let PDFDocument;
      try {
        PDFDocument = jsPDF;
        console.log('Using jsPDF from static import');
      } catch {
        console.log('Static import failed, trying dynamic import...');
        const { jsPDF: DynamicJsPDF } = await import('jspdf');
        PDFDocument = DynamicJsPDF;
        console.log('jsPDF imported dynamically');
      }
      
      // Create new PDF document
      const doc = new PDFDocument();
      console.log('PDF document created');
      
      // Helper function to add colored header
      const addHeader = (text: string, y: number, color: [number, number, number] = [41, 128, 185]) => {
        doc.setFillColor(...color);
        doc.rect(20, y - 5, 170, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(text, 25, y + 3);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'normal');
      };
      
      // Helper function to add colored box (currently unused)
      // const addColoredBox = (x: number, y: number, width: number, height: number, color: [number, number, number], text: string, textColor: [number, number, number] = [255, 255, 255]) => {
      //   doc.setFillColor(...color);
      //   doc.rect(x, y, width, height, 'F');
      //   doc.setTextColor(...textColor);
      //   doc.setFontSize(10);
      //   doc.text(text, x + 5, y + height/2 + 2);
      //   doc.setTextColor(40, 40, 40);
      // };
      
      // Helper function to add section divider
      const addDivider = (y: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
      };
      
      // Page setup
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 30;
      
      // Header with company branding
      addHeader('Smart Move Inventory - Pricing Report', yPosition, [41, 128, 185]);
      yPosition += 25;
      
      yPosition += 10;
      
      // Customer Information Section
      addHeader('Customer Information', yPosition, [52, 152, 219]);
      yPosition += 25;
      
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`Name: ${formData.customerName || 'N/A'}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Email: ${formData.email || 'N/A'}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Phone: ${formData.phone || 'N/A'}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Move Date: ${formData.moveDate || 'N/A'}`, 25, yPosition);
      yPosition += 20;
      
      // Move Details Section
      addHeader('Move Details', yPosition, [52, 152, 219]);
      yPosition += 25;
      
      doc.text(`Origin: ${formData.originAddress || 'N/A'}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Destination: ${formData.destinationAddress || 'N/A'}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Distance: ${formData.distance} miles`, 25, yPosition);
      yPosition += 12;
      doc.text(`Access Type: ${formData.accessType}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Stair Flights: ${formData.stairFlights}`, 25, yPosition);
      yPosition += 12;
      doc.text(`Rush Service: ${formData.rushService ? 'Yes' : 'No'}`, 25, yPosition);
      yPosition += 20;
      
      // Summary Statistics Section
      addHeader('Summary Statistics', yPosition, [52, 152, 219]);
      yPosition += 25;
      
      // Simple table for statistics
      const stats = [
        { label: 'Items', value: formData.selectedItems.length },
        { label: 'Weight (lbs)', value: formData.totalWeight.toFixed(0) },
        { label: 'Volume (cu ft)', value: formData.totalCubicFeet.toFixed(1) },
        { label: 'Hours', value: formData.estimatedHours.toFixed(1) }
      ];
      
      // Create a simple table
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      
      stats.forEach((stat, index) => {
        const x = 25 + (index * 45);
        doc.text(stat.label, x, yPosition);
        doc.text(stat.value.toString(), x, yPosition + 8);
      });
      yPosition += 25;
      
      // Items Section - Only show selected items
      addHeader('Selected Items', yPosition, [52, 152, 219]);
      yPosition += 25;
      
      const selectedItemsData = items.filter((_, index) => 
        formData.selectedItems.includes(index.toString())
      );
      
      console.log(`Processing ${selectedItemsData.length} selected items...`);
      
      if (selectedItemsData.length > 0) {
        // Create a simple table for selected items
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        
        // Table headers
        doc.setFont('helvetica', 'bold');
        doc.text('Item', 25, yPosition);
        doc.text('Count', 100, yPosition);
        doc.text('Dimensions', 130, yPosition);
        doc.text('Room', 180, yPosition);
        yPosition += 15;
        
        // Add divider line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(25, yPosition, 190, yPosition);
        yPosition += 10;
        
        // Add each selected item as a table row
        selectedItemsData.forEach((item) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 30;
          }
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          
          // Item name
          const itemName = item.shortName.length > 20 ? item.shortName.substring(0, 17) + '...' : item.shortName;
          doc.text(itemName, 25, yPosition);
          
          // Count
          doc.text(item.count.toString(), 100, yPosition);
          
          // Dimensions
          const { length, width, height } = item.estimatedDimensionsInches;
          const dims = [length, width, height].filter(d => d !== null);
          const dimText = dims.length > 0 ? `${dims.join('×')}"` : 'N/A';
          doc.text(dimText, 130, yPosition);
          
          // Room
          const roomText = item.roomName || 'N/A';
          doc.text(roomText, 180, yPosition);
          
          yPosition += 12;
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('No items selected for this pricing calculation.', 25, yPosition);
        yPosition += 15;
      }
      
      // Pricing Breakdown Section
      addHeader('Pricing Breakdown', yPosition, [52, 152, 219]);
      yPosition += 25;
      
      // Simple pricing table
      const pricingItems = [
        { label: 'Base Cost', value: formData.baseCost.toFixed(2) },
        { label: 'Additional Handling', value: formData.additionalHandling.toFixed(2) },
        { label: 'Disposal', value: formData.disposalCost.toFixed(2) },
        { label: 'Storage', value: formData.storageCost.toFixed(2) },
        { label: 'Stairs', value: formData.stairsCost.toFixed(2) },
        { label: 'Packing', value: formData.packingCost.toFixed(2) },
        { label: 'Unpacking', value: formData.unpackingCost.toFixed(2) },
        { label: 'Distance Charge', value: formData.distanceCost.toFixed(2) },
        { label: 'Subtotal', value: formData.subtotal.toFixed(2) }
      ];
      
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      
      pricingItems.forEach((item) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, 30, yPosition);
        doc.text(`$${item.value}`, 160, yPosition);
        
        yPosition += 12;
      });
      
      // Tax and Total
      yPosition += 5;
      addDivider(yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tax (${pricing.taxRate}%)`, 30, yPosition);
      doc.text(`$${formData.taxAmount.toFixed(2)}`, 160, yPosition);
      yPosition += 15;
      
      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 30, yPosition);
      doc.text(`$${formData.totalCost.toFixed(2)}`, 160, yPosition);
      yPosition += 20;
      
      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('* Prices are estimates and may vary based on actual conditions', 20, yPosition);
      doc.text('Smart Move Inventory - Professional Moving Services', 20, yPosition + 8);
      
      // Save the PDF
      const fileName = `pricing-report-${formData.customerName || 'customer'}-${new Date().toISOString().split('T')[0]}.pdf`;
      console.log(`Saving PDF as: ${fileName}`);
      
      // Try to save the PDF
      doc.save(fileName);
      console.log('PDF saved successfully');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to download PDF: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      setLoading(true);
      
      // Create workbook and worksheets
      const workbook = XLSX.utils.book_new();
      
      // Customer Information Sheet
      const customerData = [
        ['Customer Information', ''],
        ['Name', formData.customerName || 'N/A'],
        ['Email', formData.email || 'N/A'],
        ['Phone', formData.phone || 'N/A'],
        ['Move Date', formData.moveDate || 'N/A'],
        ['Origin Address', formData.originAddress || 'N/A'],
        ['Destination Address', formData.destinationAddress || 'N/A'],
        ['Distance (miles)', formData.distance.toString()],
        ['Access Type', formData.accessType],
        ['Rush Service', formData.rushService ? 'Yes' : 'No'],
        ['Same Building', formData.sameBuilding ? 'Yes' : 'No'],
        ['Stair Flights', formData.stairFlights.toString()],
        ['Packing Boxes', formData.packingBoxes.toString()],
        ['Unpacking Boxes', formData.unpackingBoxes.toString()],
        ['Disposal Needed', formData.disposalNeeded ? 'Yes' : 'No'],
        ['Storage Needed', formData.storageNeeded ? 'Yes' : 'No']
      ];
      
      const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
      XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Info');
      
      // Items Sheet
      const selectedItemsData = items.filter((_, index) => 
        formData.selectedItems.includes(index.toString())
      );
      
      const itemsData = [
        ['Item', 'Description', 'Count', 'Length (in)', 'Width (in)', 'Height (in)', 'Room', 'Tags']
      ];
      
      selectedItemsData.forEach(item => {
        const { length, width, height } = item.estimatedDimensionsInches;
        itemsData.push([
          item.shortName,
          item.description,
          item.count.toString(),
          length ? length.toString() : 'N/A',
          width ? width.toString() : 'N/A',
          height ? height.toString() : 'N/A',
          item.roomName || 'N/A',
          item.tags ? item.tags.join(', ') : 'N/A'
        ]);
      });
      
      const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');
      
      // Pricing Sheet
      const pricingData = [
        ['Pricing Breakdown', ''],
        ['Items Count', formData.selectedItems.length],
        ['Total Weight (lbs)', formData.totalWeight.toFixed(0)],
        ['Total Volume (cu ft)', formData.totalCubicFeet.toFixed(1)],
        ['Estimated Hours', formData.estimatedHours.toFixed(1)],
        ['', ''],
        ['Base Cost', `$${formData.baseCost.toFixed(2)}`],
        ['Additional Handling', `$${formData.additionalHandling.toFixed(2)}`],
        ['Disposal', `$${formData.disposalCost.toFixed(2)}`],
        ['Storage', `$${formData.storageCost.toFixed(2)}`],
        ['Stairs', `$${formData.stairsCost.toFixed(2)}`],
        ['Packing', `$${formData.packingCost.toFixed(2)}`],
        ['Unpacking', `$${formData.unpackingCost.toFixed(2)}`],
        ['Distance Charge', `$${formData.distanceCost.toFixed(2)}`],
        ['Subtotal', `$${formData.subtotal.toFixed(2)}`],
        ['Tax', `$${formData.taxAmount.toFixed(2)}`],
        ['TOTAL', `$${formData.totalCost.toFixed(2)}`]
      ];
      
      const pricingSheet = XLSX.utils.aoa_to_sheet(pricingData);
      XLSX.utils.book_append_sheet(workbook, pricingSheet, 'Pricing');
      
      // Save the file
      const fileName = `pricing-report-${formData.customerName || 'customer'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPDF = async () => {
    setEmailDialogOpen(true);
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setEmailAddress('');
  };

  const handleEmailDialogSubmit = async () => {
    try {
      setLoading(true);
      
      const customerEmail = emailAddress || formData.email;
      if (!customerEmail) {
        alert('Please enter a valid email address.');
        return;
      }

      // Create mailto link with the PDF content as attachment (simplified approach)
      const subject = `Pricing Report - ${formData.customerName || 'Customer'}`;
      const body = `Please find attached the pricing report for your move.\n\nCustomer: ${formData.customerName}\nMove Date: ${formData.moveDate}\nTotal Cost: $${formData.totalCost.toFixed(2)}\n\nBest regards,\nSmart Move Inventory Team`;
      
      const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      
      setEmailDialogOpen(false);
      setEmailAddress('');
      
    } catch (error) {
      console.error('Error emailing PDF:', error);
      alert('Failed to email PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressCheckboxChange = (type: 'start' | 'destination') => {
    if (type === 'start') {
      setUseStartAddress(true);
      setUseDestinationAddress(false);
    } else {
      setUseStartAddress(false);
      setUseDestinationAddress(true);
    }
  };

  // Removed old HTML-based PDF generation - now using jsPDF

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Pricing Calculator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Calculate moving costs based on your items and move parameters
      </Typography>

      <Grid container spacing={3}>
        {/* Move Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Move Parameters
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone #"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date of Move"
                    type="date"
                    value={formData.moveDate}
                    onChange={(e) => handleInputChange('moveDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Address Selection
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useStartAddress}
                            onChange={() => handleAddressCheckboxChange('start')}
                            color="primary"
                          />
                        }
                        label="Use Start Address"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useDestinationAddress}
                            onChange={() => handleAddressCheckboxChange('destination')}
                            color="primary"
                          />
                        }
                        label="Use Destination Address"
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <AddressAutocomplete
                    value={formData.originAddress}
                    onChange={(value) => handleInputChange('originAddress', value)}
                    label="Origin Address"
                    placeholder="Enter pickup address..."
                    helperText="Where will the movers pick up your items?"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <AddressAutocomplete
                    value={formData.destinationAddress}
                    onChange={(value) => handleInputChange('destinationAddress', value)}
                    label="Destination Address"
                    placeholder="Enter delivery address..."
                    helperText="Where will the movers deliver your items?"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Distance (miles)"
                    type="number"
                    value={formData.distance}
                    onChange={(e) => handleInputChange('distance', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Access Type</InputLabel>
                    <Select
                      value={formData.accessType}
                      onChange={(e) => handleInputChange('accessType', e.target.value)}
                    >
                      <MenuItem value="Ground Floor">Ground Floor</MenuItem>
                      <MenuItem value="Elevator">Elevator</MenuItem>
                      <MenuItem value="Stairs">Stairs</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rushService}
                        onChange={(e) => handleInputChange('rushService', e.target.checked)}
                      />
                    }
                    label="Rush Service - Same-day or next-day service"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sameBuilding}
                        onChange={(e) => handleInputChange('sameBuilding', e.target.checked)}
                      />
                    }
                    label="Same Building?"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Number of Stair Flights"
                    type="number"
                    value={formData.stairFlights}
                    onChange={(e) => handleInputChange('stairFlights', parseInt(e.target.value) || 0)}
                    helperText="Enter the total number of stair flights at pickup or dropoff (enter 1 if none)"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Packing Boxes"
                    type="number"
                    value={formData.packingBoxes}
                    onChange={(e) => handleInputChange('packingBoxes', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Un-Packing Boxes"
                    type="number"
                    value={formData.unpackingBoxes}
                    onChange={(e) => handleInputChange('unpackingBoxes', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.disposalNeeded}
                        onChange={(e) => handleInputChange('disposalNeeded', e.target.checked)}
                      />
                    }
                    label="Is there Disposal?"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.storageNeeded}
                        onChange={(e) => handleInputChange('storageNeeded', e.target.checked)}
                      />
                    }
                    label="Storage Needed?"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Select Items */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Items
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose items to include in your moving cost calculation
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={selectAllItems}
                  sx={{ mr: 1 }}
                >
                  Select All
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearSelection}
                >
                  Clear Selection
                </Button>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected: {formData.selectedItems.length} items
              </Typography>
              
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {items.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: formData.selectedItems.includes(index.toString()) ? 'primary.main' : 'grey.300',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      backgroundColor: formData.selectedItems.includes(index.toString()) ? 'primary.50' : 'transparent',
                      '&:hover': {
                        backgroundColor: formData.selectedItems.includes(index.toString()) ? 'primary.100' : 'grey.50'
                      }
                    }}
                    onClick={() => handleItemSelection(index.toString())}
                  >
                    <Typography variant="subtitle2">
                      {item.shortName} {item.count > 1 && `(${item.count} items)`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    {item.estimatedDimensionsInches.length && item.estimatedDimensionsInches.width && item.estimatedDimensionsInches.height && (
                      <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        opacity: 0.9
                      }}>
                        {(item.estimatedDimensionsInches.length * item.estimatedDimensionsInches.width * item.estimatedDimensionsInches.height / 1728 * item.count).toFixed(2)} cubic ft total
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Breakdown */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: { xs: 2, sm: 0 } }}>
                  Pricing Breakdown
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 1 },
                  flexWrap: 'wrap'
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    disabled={loading}
                    onClick={handleDownloadPDF}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Download PDF Report</Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>PDF</Box>
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TableChart />}
                    disabled={loading}
                    onClick={handleExportExcel}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Export Excel</Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Excel</Box>
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    disabled={loading}
                    onClick={handleEmailPDF}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Email PDF Report</Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Email</Box>
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" color="primary">
                    {formData.selectedItems.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" color="primary">
                    {formData.totalWeight.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    lbs
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                    {formData.totalCubicFeet.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500,
                    opacity: 0.9
                  }}>
                    cubic ft
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" color="primary">
                    {formData.estimatedHours.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    hours
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Base Cost</Typography>
                    <Typography>${formData.baseCost.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Additional Handling</Typography>
                    <Typography>${formData.additionalHandling.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Disposal</Typography>
                    <Typography>${formData.disposalCost.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Storage</Typography>
                    <Typography>${formData.storageCost.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Stairs</Typography>
                    <Typography>${formData.stairsCost.toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Packing</Typography>
                    <Typography>${formData.packingCost.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Unpacking</Typography>
                    <Typography>${formData.unpackingCost.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Distance Charge</Typography>
                    <Typography>${formData.distanceCost.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal</Typography>
                    <Typography>${formData.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax ({pricing.taxRate}%)</Typography>
                    <Typography>${formData.taxAmount.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Total</Typography>
                <Typography variant="h4" color="primary">
                  ${formData.totalCost.toFixed(2)}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                * Prices are estimates and may vary based on actual conditions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', sm: 'flex-end' }, 
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center'
          }}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
              onClick={handleSave}
              disabled={loading || formData.selectedItems.length === 0}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {loading ? 'Saving...' : 'Save Pricing'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={handleEmailDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Email Pricing Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the email address where you&apos;d like to send the pricing report.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder={formData.email || 'customer@example.com'}
            helperText={formData.email ? `Default: ${formData.email}` : 'Enter customer email address'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmailDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleEmailDialogSubmit} 
            variant="contained" 
            disabled={loading || (!emailAddress && !formData.email)}
            startIcon={loading ? <CircularProgress size={20} /> : <Email />}
          >
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

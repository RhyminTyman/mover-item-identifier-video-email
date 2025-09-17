"use client";

import { useState, useEffect, useCallback } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Calculate,
  Download,
  Email,
  Add,
  Clear
} from '@mui/icons-material';

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
  }, [formData, pricing, items]);

  // Calculate pricing when form data changes
  useEffect(() => {
    calculatePricing();
  }, [formData.selectedItems, formData.distance, formData.stairFlights, formData.packingBoxes, formData.unpackingBoxes, formData.disposalNeeded, formData.storageNeeded, formData.rushService, items, calculatePricing]);

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
      
      // Create a new window to generate and download the PDF
      const pdfWindow = window.open('', '_blank');
      if (!pdfWindow) {
        alert('Please allow popups to download the PDF');
        return;
      }

      // Generate PDF content
      const pdfContent = generatePDFContent();
      
      // Create a blob and download it
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `pricing-report-${formData.customerName || 'customer'}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPDF = async () => {
    try {
      setLoading(true);
      
      // Get customer email
      const customerEmail = formData.email || prompt('Please enter customer email address:');
      if (!customerEmail) {
        setLoading(false);
        return;
      }

      // Create mailto link with the PDF content as attachment (simplified approach)
      const subject = `Pricing Report - ${formData.customerName || 'Customer'}`;
      const body = `Please find attached the pricing report for your move.\n\nCustomer: ${formData.customerName}\nMove Date: ${formData.moveDate}\nTotal Cost: $${formData.totalCost.toFixed(2)}\n\nBest regards,\nSmart Move Inventory Team`;
      
      const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      
    } catch (error) {
      console.error('Error emailing PDF:', error);
      alert('Failed to email PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFContent = () => {
    const selectedItemsData = items.filter((_, index) => 
      formData.selectedItems.includes(index.toString())
    );

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Report - ${formData.customerName || 'Customer'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #555; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .pricing-breakdown { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
        .pricing-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total-row { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
        .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; text-align: center; }
        .stat-value { font-size: 1.5em; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Smart Move Inventory - Pricing Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Customer Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Customer Name:</span> ${formData.customerName || 'N/A'}
            </div>
            <div class="info-item">
                <span class="info-label">Phone:</span> ${formData.phone || 'N/A'}
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span> ${formData.email || 'N/A'}
            </div>
            <div class="info-item">
                <span class="info-label">Move Date:</span> ${formData.moveDate || 'N/A'}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Move Details</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Origin:</span> ${formData.originAddress || 'N/A'}
            </div>
            <div class="info-item">
                <span class="info-label">Destination:</span> ${formData.destinationAddress || 'N/A'}
            </div>
            <div class="info-item">
                <span class="info-label">Distance:</span> ${formData.distance} miles
            </div>
            <div class="info-item">
                <span class="info-label">Access Type:</span> ${formData.accessType}
            </div>
            <div class="info-item">
                <span class="info-label">Stair Flights:</span> ${formData.stairFlights}
            </div>
            <div class="info-item">
                <span class="info-label">Rush Service:</span> ${formData.rushService ? 'Yes' : 'No'}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Selected Items (${selectedItemsData.length})</h2>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Dimensions</th>
                    <th>Room</th>
                </tr>
            </thead>
            <tbody>
                ${selectedItemsData.map(item => `
                    <tr>
                        <td>${item.shortName}</td>
                        <td>${item.description}</td>
                        <td>${item.estimatedDimensionsInches.length && item.estimatedDimensionsInches.width && item.estimatedDimensionsInches.height ? 
                            `${item.estimatedDimensionsInches.length}" × ${item.estimatedDimensionsInches.width}" × ${item.estimatedDimensionsInches.height}"` : 'N/A'}</td>
                        <td>${item.roomName || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Pricing Summary</h2>
        <div class="summary-stats">
            <div>
                <div class="stat-value">${formData.selectedItems.length}</div>
                <div class="stat-label">Items</div>
            </div>
            <div>
                <div class="stat-value">${formData.totalWeight.toFixed(0)}</div>
                <div class="stat-label">lbs</div>
            </div>
            <div>
                <div class="stat-value">${formData.totalCubicFeet.toFixed(1)}</div>
                <div class="stat-label">cubic ft</div>
            </div>
            <div>
                <div class="stat-value">${formData.estimatedHours.toFixed(1)}</div>
                <div class="stat-label">hours</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Pricing Breakdown</h2>
        <div class="pricing-breakdown">
            <div class="pricing-row">
                <span>Base Cost</span>
                <span>$${formData.baseCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Additional Handling</span>
                <span>$${formData.additionalHandling.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Disposal</span>
                <span>$${formData.disposalCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Storage</span>
                <span>$${formData.storageCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Stairs</span>
                <span>$${formData.stairsCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Packing</span>
                <span>$${formData.packingCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Unpacking</span>
                <span>$${formData.unpackingCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Distance Charge</span>
                <span>$${formData.distanceCost.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Subtotal</span>
                <span>$${formData.subtotal.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
                <span>Tax (${pricing.taxRate}%)</span>
                <span>$${formData.taxAmount.toFixed(2)}</span>
            </div>
            <div class="pricing-row total-row">
                <span>Total</span>
                <span>$${formData.totalCost.toFixed(2)}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <p><em>* Prices are estimates and may vary based on actual conditions</em></p>
    </div>
</body>
</html>`;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
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
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone #"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
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
                  <TextField
                    fullWidth
                    label="Origin Address"
                    value={formData.originAddress}
                    onChange={(e) => handleInputChange('originAddress', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Destination Address"
                    value={formData.destinationAddress}
                    onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Distance (miles)"
                    type="number"
                    value={formData.distance}
                    onChange={(e) => handleInputChange('distance', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={6}>
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
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Number of Stair Flights"
                    type="number"
                    value={formData.stairFlights}
                    onChange={(e) => handleInputChange('stairFlights', parseInt(e.target.value) || 0)}
                    helperText="Enter the total number of stair flights at pickup or dropoff (enter 1 if none)"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Packing Boxes"
                    type="number"
                    value={formData.packingBoxes}
                    onChange={(e) => handleInputChange('packingBoxes', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Un-Packing Boxes"
                    type="number"
                    value={formData.unpackingBoxes}
                    onChange={(e) => handleInputChange('unpackingBoxes', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={6}>
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
                      <Typography variant="caption" color="text.secondary">
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Pricing Breakdown
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    sx={{ mr: 1 }}
                    disabled={loading}
                    onClick={handleDownloadPDF}
                  >
                    Download PDF Report
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    disabled={loading}
                    onClick={handleEmailPDF}
                  >
                    Email PDF Report
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Typography variant="h4" color="primary">
                    {formData.selectedItems.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" color="primary">
                    {formData.totalWeight.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    lbs
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" color="primary">
                    {formData.totalCubicFeet.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    cubic ft
                  </Typography>
                </Grid>
                <Grid item xs={3}>
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
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
              onClick={handleSave}
              disabled={loading || formData.selectedItems.length === 0}
            >
              {loading ? 'Saving...' : 'Save Pricing'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

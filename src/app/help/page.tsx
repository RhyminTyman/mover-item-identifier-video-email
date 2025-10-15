import { Container, Typography, Box, Paper, Accordion, AccordionSummary, AccordionDetails, Grid, Card, CardContent, Divider } from '@mui/material';
import { ExpandMore, HelpOutline, CameraAlt, Business, AttachMoney, Settings, Security, Email } from '@mui/icons-material';
import Link from 'next/link';

export default function HelpCenter() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box textAlign="center" mb={6}>
        <HelpOutline sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Help Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers to common questions and learn how to use Barreleyes
        </Typography>
      </Box>

      {/* Quick Links */}
      <Grid container spacing={3} mb={6}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <CameraAlt sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Getting Started</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload photos and analyze items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Getting Quotes</Typography>
              <Typography variant="body2" color="text.secondary">
                Request and compare quotes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <Business sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">For Companies</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage quotes and CRM
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <Settings sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Account Settings</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your profile
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FAQ Sections */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Frequently Asked Questions
        </Typography>

        {/* Getting Started */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          <CameraAlt sx={{ verticalAlign: 'middle', mr: 1 }} />
          Getting Started
        </Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I upload photos or videos?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              1. Go to the <strong>Analyze Photos</strong> tab in your dashboard
            </Typography>
            <Typography variant="body2" paragraph>
              2. Click the upload area or drag and drop your files
            </Typography>
            <Typography variant="body2" paragraph>
              3. You can upload multiple photos or a single video (up to 100MB)
            </Typography>
            <Typography variant="body2" paragraph>
              4. Wait for the AI to analyze your items
            </Typography>
            <Typography variant="body2">
              <strong>Tip:</strong> Take clear, well-lit photos for best results. Include multiple angles of large items.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How accurate is the AI analysis?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Our AI uses OpenAI's GPT-4 Vision model, which is highly accurate for identifying common household items and furniture.
            </Typography>
            <Typography variant="body2" paragraph>
              However, you should always review the results and:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 4 }}>
              <li>Add any missing items</li>
              <li>Correct dimensions if needed</li>
              <li>Update item descriptions</li>
              <li>Verify counts for multiple items</li>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Can I edit the identified items?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Yes! After analysis, you can:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 4 }}>
              <li>Edit item names and descriptions</li>
              <li>Update dimensions</li>
              <li>Change room assignments</li>
              <li>Add or remove tags</li>
              <li>Adjust item counts</li>
              <li>Delete incorrect items</li>
              <li>Add new items manually</li>
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Quotes */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          <AttachMoney sx={{ verticalAlign: 'middle', mr: 1 }} />
          Getting Quotes
        </Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I request a quote?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              1. Complete your inventory analysis
            </Typography>
            <Typography variant="body2" paragraph>
              2. Click on the <strong>Pricing Calculator</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              3. Select a moving company from the dropdown
            </Typography>
            <Typography variant="body2" paragraph>
              4. Fill in move details (addresses, date, etc.)
            </Typography>
            <Typography variant="body2" paragraph>
              5. Review the estimated cost
            </Typography>
            <Typography variant="body2">
              6. Click <strong>Submit Quote</strong> to send your request
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How long does it take to get a quote?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Most moving companies respond within 24-48 hours. You'll receive an email notification when they send you a quote.
            </Typography>
            <Typography variant="body2">
              You can check the status of your quote requests in the <strong>Saved Inventories</strong> tab.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Can I request quotes from multiple companies?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Yes! You can submit the same inventory to multiple moving companies to compare prices and services.
            </Typography>
            <Typography variant="body2">
              Simply use the pricing calculator multiple times, selecting a different company each time.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* For Moving Companies */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          <Business sx={{ verticalAlign: 'middle', mr: 1 }} />
          For Moving Companies
        </Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I set up my company profile?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              1. Sign up with a company-admin account
            </Typography>
            <Typography variant="body2" paragraph>
              2. Go to <strong>Company Admin</strong> → <strong>Company Information</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              3. Fill in your company details (address, contact info)
            </Typography>
            <Typography variant="body2" paragraph>
              4. Set your pricing rates (per hour, per mile, etc.)
            </Typography>
            <Typography variant="body2">
              5. Save your settings
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I integrate with my CRM?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              1. Go to <strong>Company Admin</strong> → <strong>CRM Settings</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              2. Select your CRM provider (Salesforce, HubSpot, Zoho, etc.)
            </Typography>
            <Typography variant="body2" paragraph>
              3. Enter your API credentials
            </Typography>
            <Typography variant="body2" paragraph>
              4. Test the connection
            </Typography>
            <Typography variant="body2">
              5. Enable automatic sync for leads and quotes
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I respond to quote requests?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              1. Check the <strong>Quote Requests</strong> tab in your dashboard
            </Typography>
            <Typography variant="body2" paragraph>
              2. Click on a request to view details
            </Typography>
            <Typography variant="body2" paragraph>
              3. Review the customer's inventory
            </Typography>
            <Typography variant="body2" paragraph>
              4. Click <strong>Create Quote</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              5. Enter pricing details
            </Typography>
            <Typography variant="body2">
              6. Send the quote to the customer
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Account & Privacy */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          <Security sx={{ verticalAlign: 'middle', mr: 1 }} />
          Account & Privacy
        </Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I export my data?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              You can export all your data at any time:
            </Typography>
            <Typography variant="body2" paragraph>
              1. Go to <strong>Account Settings</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              2. Click <strong>Export My Data</strong>
            </Typography>
            <Typography variant="body2">
              3. Download the JSON file containing all your information
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>How do I delete my account?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              To delete your account:
            </Typography>
            <Typography variant="body2" paragraph>
              1. Go to <strong>Account Settings</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              2. Scroll to <strong>Danger Zone</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              3. Click <strong>Delete Account</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              4. Confirm by entering your email
            </Typography>
            <Typography variant="body2" color="warning.main">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Is my data secure?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Yes! We take security seriously:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 4 }}>
              <li>All data is encrypted in transit and at rest</li>
              <li>We use industry-standard authentication (Clerk)</li>
              <li>Photos are stored securely on AWS S3</li>
              <li>API keys and sensitive data are encrypted</li>
              <li>We never sell your personal information</li>
            </Typography>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              Read our <Link href="/privacy">Privacy Policy</Link> for more details.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Contact Support */}
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', backgroundColor: 'primary.50' }}>
        <Email sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Still Need Help?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Can't find what you're looking for? Our support team is here to help!
        </Typography>
        <Typography variant="body2" paragraph>
          Email us at: <strong>support@barreleyes.com</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          We typically respond within 24 hours
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          <Link href="/privacy" style={{ marginRight: 16 }}>Privacy Policy</Link>
          <Link href="/terms" style={{ marginRight: 16 }}>Terms of Service</Link>
          <Link href="/">Back to Home</Link>
        </Typography>
      </Box>
    </Container>
  );
}


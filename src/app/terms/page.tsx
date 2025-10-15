import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last Updated: {new Date().toLocaleDateString()}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ '& h2': { mt: 4, mb: 2 }, '& p': { mb: 2 } }}>
          <Typography variant="h5" component="h2">
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using Barreleyes (&quot;the Service&quot;), you agree to be bound by these Terms of Service 
            and all applicable laws and regulations. If you do not agree with any of these terms, you are 
            prohibited from using this Service.
          </Typography>

          <Typography variant="h5" component="h2">
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            Barreleyes provides an inventory identification and moving quote platform that allows users to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Upload photos and videos of their belongings</li>
            <li>Receive AI-powered analysis and identification of items</li>
            <li>Get moving cost estimates and quotes from moving companies</li>
            <li>Manage inventory and connect with moving service providers</li>
          </Typography>

          <Typography variant="h5" component="h2">
            3. User Accounts
          </Typography>
          <Typography variant="body1" paragraph>
            You must create an account to use certain features of the Service. You are responsible for:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Providing accurate and current information</li>
          </Typography>

          <Typography variant="h5" component="h2">
            4. User Content
          </Typography>
          <Typography variant="body1" paragraph>
            You retain ownership of content you upload (photos, videos, etc.). By uploading content, you grant us 
            a license to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Process and analyze your content using AI services</li>
            <li>Store your content on our servers and third-party services (AWS S3)</li>
            <li>Share your content with moving companies you request quotes from</li>
            <li>Display your content within your account interface</li>
          </Typography>

          <Typography variant="h5" component="h2">
            5. Acceptable Use
          </Typography>
          <Typography variant="body1" paragraph>
            You agree not to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Upload illegal, harmful, or inappropriate content</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe on others&apos; intellectual property rights</li>
            <li>Attempt to hack, disrupt, or compromise the Service</li>
            <li>Use the Service for spam or automated requests</li>
            <li>Misrepresent your identity or affiliation</li>
          </Typography>

          <Typography variant="h5" component="h2">
            6. AI Analysis Disclaimer
          </Typography>
          <Typography variant="body1" paragraph>
            Our AI-powered inventory identification is provided &quot;as is&quot; and may not always be 100% accurate. 
            Estimates and identifications should be verified. We are not responsible for:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Inaccurate item identification or descriptions</li>
            <li>Incorrect price estimates or quotes</li>
            <li>Decisions made based on AI-generated analysis</li>
          </Typography>

          <Typography variant="h5" component="h2">
            7. Moving Company Relationships
          </Typography>
          <Typography variant="body1" paragraph>
            We facilitate connections between customers and moving companies but are not a party to any 
            agreements between you and moving companies. We are not responsible for:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Services provided by moving companies</li>
            <li>Pricing, quotes, or final costs from moving companies</li>
            <li>Quality or timeliness of moving services</li>
            <li>Disputes between customers and moving companies</li>
          </Typography>

          <Typography variant="h5" component="h2">
            8. Fees and Payments
          </Typography>
          <Typography variant="body1" paragraph>
            Certain features may require payment. You agree to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Pay all applicable fees</li>
            <li>Provide accurate billing information</li>
            <li>Pay for services even if canceled (no refund policy unless stated)</li>
          </Typography>

          <Typography variant="h5" component="h2">
            9. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            The Service, including its design, features, and functionality, is owned by Barreleyes and 
            protected by copyright, trademark, and other intellectual property laws.
          </Typography>

          <Typography variant="h5" component="h2">
            10. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, BARRELEYES SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE 
            OF THE SERVICE.
          </Typography>

          <Typography variant="h5" component="h2">
            11. Indemnification
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to indemnify and hold harmless Barreleyes from any claims, damages, losses, or expenses 
            arising from your use of the Service or violation of these Terms.
          </Typography>

          <Typography variant="h5" component="h2">
            12. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to suspend or terminate your account at any time for violation of these Terms 
            or for any other reason. Upon termination, your right to use the Service will immediately cease.
          </Typography>

          <Typography variant="h5" component="h2">
            13. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We may modify these Terms at any time. Continued use of the Service after changes constitutes 
            acceptance of the modified Terms.
          </Typography>

          <Typography variant="h5" component="h2">
            14. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
            without regard to its conflict of law provisions.
          </Typography>

          <Typography variant="h5" component="h2">
            15. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            For questions about these Terms, contact us at:
          </Typography>
          <Typography variant="body1" component="div" sx={{ pl: 2 }}>
            <strong>Email:</strong> legal@barreleyes.com<br />
            <strong>Address:</strong> [Your Business Address]
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            <Link href="/privacy" style={{ marginRight: 16 }}>Privacy Policy</Link>
            <Link href="/">Back to Home</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}


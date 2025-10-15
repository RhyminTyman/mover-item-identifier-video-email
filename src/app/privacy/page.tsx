import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last Updated: {new Date().toLocaleDateString()}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ '& h2': { mt: 4, mb: 2 }, '& p': { mb: 2 } }}>
          <Typography variant="h5" component="h2">
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect information you provide directly to us, including:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Name, email address, and contact information</li>
            <li>Account credentials and authentication data</li>
            <li>Photos and videos you upload for inventory analysis</li>
            <li>Moving-related information (addresses, move dates, items)</li>
            <li>Company information (for business accounts)</li>
            <li>Payment information (if applicable)</li>
          </Typography>

          <Typography variant="h5" component="h2">
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Provide, maintain, and improve our services</li>
            <li>Process your inventory analysis requests</li>
            <li>Communicate with you about your account and services</li>
            <li>Send quotes and pricing information</li>
            <li>Facilitate CRM integrations for moving companies</li>
            <li>Protect against fraud and abuse</li>
            <li>Comply with legal obligations</li>
          </Typography>

          <Typography variant="h5" component="h2">
            3. Information Sharing and Disclosure
          </Typography>
          <Typography variant="body1" paragraph>
            We may share your information with:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Moving companies you request quotes from</li>
            <li>Service providers who assist in our operations (OpenAI, AWS S3, etc.)</li>
            <li>Law enforcement when required by law</li>
            <li>Other parties with your explicit consent</li>
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell your personal information to third parties.
          </Typography>

          <Typography variant="h5" component="h2">
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate security measures to protect your information, including:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Secure authentication through Clerk</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and monitoring</li>
          </Typography>

          <Typography variant="h5" component="h2">
            5. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We retain your information for as long as your account is active or as needed to provide services. 
            You may request deletion of your account and associated data at any time.
          </Typography>

          <Typography variant="h5" component="h2">
            6. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Object to certain data processing</li>
          </Typography>

          <Typography variant="h5" component="h2">
            7. Cookies and Tracking
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies and similar technologies to:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Maintain your session</li>
            <li>Remember your preferences</li>
            <li>Analyze usage patterns</li>
            <li>Improve our services</li>
          </Typography>
          <Typography variant="body1" paragraph>
            You can control cookies through your browser settings.
          </Typography>

          <Typography variant="h5" component="h2">
            8. Third-Party Services
          </Typography>
          <Typography variant="body1" paragraph>
            Our service integrates with:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>OpenAI for image analysis</li>
            <li>AWS S3 for file storage</li>
            <li>Clerk for authentication</li>
            <li>Upstash Redis for caching</li>
            <li>Resend for email delivery</li>
          </Typography>
          <Typography variant="body1" paragraph>
            These services have their own privacy policies and data handling practices.
          </Typography>

          <Typography variant="h5" component="h2">
            9. Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Our service is not intended for users under 18 years of age. We do not knowingly 
            collect personal information from children.
          </Typography>

          <Typography variant="h5" component="h2">
            10. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this privacy policy from time to time. We will notify you of any 
            significant changes by email or through our service.
          </Typography>

          <Typography variant="h5" component="h2">
            11. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have questions about this privacy policy or our data practices, please contact us at:
          </Typography>
          <Typography variant="body1" component="div" sx={{ pl: 2 }}>
            <strong>Email:</strong> privacy@barreleyes.com<br />
            <strong>Address:</strong> [Your Business Address]
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            <Link href="/terms" style={{ marginRight: 16 }}>Terms of Service</Link>
            <Link href="/">Back to Home</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}


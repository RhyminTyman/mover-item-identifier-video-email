import { Box, Container, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </Typography>
        <Button
          component={Link}
          href="/dashboard"
          variant="contained"
          size="large"
        >
          Go to Dashboard
        </Button>
      </Container>
    </Box>
  );
}

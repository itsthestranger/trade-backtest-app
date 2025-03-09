// src/components/backtest/DocumentationView.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Grid,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notes as NotesIcon
} from '@mui/icons-material';

const DocumentationView = ({ trades }) => {
  // Filter trades that have documentation
  const tradesWithDocs = trades.filter(
    trade => trade.documentation && (
      trade.documentation.trade_journal || 
      (trade.confluences && trade.confluences.length > 0) || 
      trade.documentation.body_mind_state
    )
  );
  
  // Sort trades by date and time (newest first)
  const sortedTrades = [...tradesWithDocs].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.confirmation_time || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.confirmation_time || '00:00'}`);
    return dateB - dateA;
  });
  
  // Function to get avatar background color based on trade status
  const getAvatarColor = (trade) => {
    if (trade.status === 'Winner') return 'success.main';
    if (trade.status === 'Expense') return 'error.main';
    return 'primary.main';
  };
  
  // Function to get avatar icon based on trade direction
  const getAvatarIcon = (trade) => {
    if (trade.direction === 'Long') return <TrendingUpIcon />;
    if (trade.direction === 'Short') return <TrendingDownIcon />;
    return <NotesIcon />;
  };
  
  // If no trades with documentation, show a message
  if (sortedTrades.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No trade documentation found. Add notes, confluences, or body & mind state to trades to see them here.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Trade Documentation
      </Typography>
      
      <Grid container spacing={3}>
        {sortedTrades.map((trade) => (
          <Grid item xs={12} md={6} key={trade.id}>
            <Card>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: getAvatarColor(trade) }}>
                    {getAvatarIcon(trade)}
                  </Avatar>
                }
                title={`${trade.instrument_name} ${trade.direction}`}
                subheader={`${trade.date} | ${trade.confirmation_time || 'N/A'} | ${trade.session}`}
                action={
                  <Chip 
                    label={trade.status}
                    color={trade.status === 'Winner' ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                }
              />
              <CardContent>
                {/* Trade Journal */}
                {trade.documentation && trade.documentation.trade_journal && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Trade Journal:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {trade.documentation.trade_journal}
                    </Typography>
                  </Box>
                )}
                
                {/* Confluences */}
                {trade.confluences && trade.confluences.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Confluences:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {trade.confluences.map((confluence) => (
                        <Chip key={confluence.id} label={confluence.name} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Body & Mind State */}
                {trade.documentation && trade.documentation.body_mind_state && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Body & Mind State:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {trade.documentation.body_mind_state.split(',').map((state) => (
                        <Chip key={state} label={state} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                {/* Trade Results */}
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Entry: {trade.entry}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Exit: {trade.exit || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Stop: {trade.stop}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Target: {trade.target}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight="bold" color={trade.result > 0 ? 'success.main' : 'error.main'}>
                      Result: {trade.result ? `${trade.result.toFixed(2)}R` : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DocumentationView;